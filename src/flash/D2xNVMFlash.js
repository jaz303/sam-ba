const {BaseFlash} = require('./BaseFlash');

// CMDEX field should be 0xA5 to allow execution of any command.
const CMDEX_KEY              		= 0xa500;

// NVM ready bit mask
const NVM_INT_STATUS_READY_MASK 	= 0x1;

// NVM status mask
const NVM_CTRL_STATUS_MASK 			= 0xFFEB;

const NVM_REG_BASE    				= 0x41004000;

const NVM_REG_CTRLA   				= 0x00;
const NVM_REG_CTRLB   				= 0x04;
const NVM_REG_INTFLAG 				= 0x14;
const NVM_REG_STATUS  				= 0x18;
const NVM_REG_ADDR    				= 0x1c;
const NVM_REG_LOCK    				= 0x20;

const NVM_CMD_ER      				= 0x02;
const NVM_CMD_WP      				= 0x04;
const NVM_CMD_EAR     				= 0x05;
const NVM_CMD_WAP     				= 0x06;
const NVM_CMD_LR      				= 0x40;
const NVM_CMD_UR      				= 0x41;
const NVM_CMD_SSB     				= 0x45;
const NVM_CMD_PBC     				= 0x44;

const ERASE_ROW_PAGES 				= 4; // pages

// NVM User Row
const NVM_UR_ADDR                 	= 0x804000;
const NVM_UR_SIZE                 	= (_size * ERASE_ROW_PAGES);
const NVM_UR_BOD33_ENABLE_OFFSET  	= 0x1;
const NVM_UR_BOD33_ENABLE_MASK    	= 0x6;
const NVM_UR_BOD33_RESET_OFFSET   	= 0x1;
const NVM_UR_BOD33_RESET_MASK     	= 0x7;
const NVM_UR_NVM_LOCK_OFFSET      	= 0x6;

const ErrFlashCmd = Symbol('err-flash-cmd');
const ErrFlashPage = Symbol('err-flash-page');

exports.D2xNVMFlash = class D2xNVMFlash extends BaseFlash {
	constructor(client, {pageCount, pageSize, user, stack}) {
		super(client, {
			address: 0,
			pageCount: pageCount,
			pageSize: pageSize,
			planeCount: 1,
			lockRegionCount: 16,
			user: user,
			stack: stack
		});
		this._eraseAuto = true;
	}

	//
	// Overrides

	eraseAll(offset) {
		if (this._client.canChipErase()) {
			return this._client.chipErase(offset);
		} else {
			return this._erase(offset, this.totalSize - offset);
		}
	}

	eraseAuto(enable) {
		this._eraseAuto = !!enable;
	}

	readLockRegions() {
		let lockBits = 0;
		let addr = NVM_UR_ADDR + NVM_UR_NVM_LOCK_OFFSET;
		const out = new Array(this.lockRegionCount);
		for (let r = 0; r < this.lockRegionCount; ++r) {
			if (r % 8 === 0) {
				lockBits = await this._client.readByte(addr++);
			}
			out[r] = (lockBits & (1 << (r % 8))) === 0;
		}
		return out;
	}

	async readSecurity() {
		return ((await this._readReg(NVM_REG_STATUS)) & 0x100) !== 0;
	}

	isBODSupported() { return true; }

	async readBOD() {
		const b = await this._client.readByte(NVM_UR_ADDR + NVM_UR_BOD33_ENABLE_OFFSET);
		return (b & NVM_UR_BOD33_ENABLE_MASK) != 0;
	}

	isBORSupported() { return true; }

	async readBOR() {
		const b = await this._client.readByte(NVM_UR_ADDR + NVM_UR_BOD33_RESET_OFFSET);
		return (b & NVM_UR_BOD33_RESET_MASK) != 0;
	}

	readBootFlash() {
		return true;
	}

	writeOptions() {

	}

	async writePage(page) {
		this._checkPageNumber(page);

		// Disable cache and configure manual page write
		const rv = await this._readReg(NVM_REG_CTRLB);
    	await this._writeReg(NVM_REG_CTRLB, rv | (0x1 << 18) | (0x1 << 7));

    	// Auto-erase if writing at the start of the erase page
    	if (this._eraseAuto && (page % ERASE_ROW_PAGES) == 0) {
    		await this._erase(page * this.pageSize, ERASE_ROW_PAGES * this.pageSize);
    	}

    	// Clear page buffer
    	await this._command(NVM_CMD_PBC);

    	// Compute the start address.
    	const addr = this.address + (page * this.pageSize);

		await this._wordCopy.setDestinationAddress(addr);
	    await this._wordCopy.setSourceAddress(this._onBufferA ? this._pageBufferA : this._pageBufferB);
	    this._onBufferA = !this._onBufferA;
	    await this._waitReady();
	    await this._wordCopy.runv();

	    await this._writeReg(NVM_REG_ADDR, addr / 2);
	    await this._command(NVM_CMD_WP);
	}

	readPage(page, buffer) {
		this._checkPageNumber(page);
		this._checkPageBufferSize(buffer);
		return this._client.read(this.address + (page * this.pageSize), buffer);
	}

	//
	//

	_readReg(reg) {
		return this._client.readWord(NVM_REG_BASE + reg);
	}

	_writeReg(reg, value) {
		return this._client.writeWord(NVM_REG_BASE + reg, value);
	}

	async _waitReady() {
		while (((await this._readReg(NVM_REG_INTFLAG)) & 0x1) === 0); 
	}

	async _command(cmd) {
		await this._waitReady();
		await this._writeReg(NVM_REG_CTRLA, CMDEX_KEY | cmd);
		await this._waitReady();
		if ((await this._readReg(NVM_REG_INTFLAG)) & 0x2) {
			// Clear the error bit
			await this._writeReg(NVM_REG_INTFLAG, 0x2);
			throw ErrFlashCmd;
		}
	}

	async _erase(offset, size) {
		const eraseSize = this.pageSize * ERASE_ROW_PAGES;

		if ((offset % eraseSize) != 0) {
			throw new Error("Erase offset not boundary-aligned");
		}

		if ((offset + size) > this.totalSize) {
			throw new Error("Erase size out of bounds");
		}

		const eraseEnd = Math.floor((offset + size + eraseSize - 1) / eraseSize);

		for (let eraseNum = offset / eraseSize; eraseNum < eraseEnd; ++eraseNum) {
			await this._waitReady();

			// Clear error bits
	        const statusReg = await this._readReg(NVM_REG_STATUS);
	        await this._writeReg(NVM_REG_STATUS, statusReg | NVM_CTRL_STATUS_MASK);

	        // Issue erase command
	        const wordAddr = Math.floor((eraseNum * eraseSize) / 2);
	        await this._writeReg(NVM_REG_ADDR, wordAddr);
	        await this._command(NVM_CMD_ER);
		}
	}

	async _readUserRow(wtf) {

	}
}