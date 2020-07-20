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

exports.D2xNVMFlash = class D2xNVMFlash {
	constructor(client, {pageCount, pageSize, user, stack}) {
		this._client = client;

		this.address = 0;
		this.pageCount = pageCount;
		this.pageSize = pageSize;
		this.planeCount = 1;
		this.lockRegions = 16;
		
	}

	get totalSize() { return this.pageSize * this.pageCount; }

	// address
	// pageSize
	// pageCount
	// planeCount
	// totalSize
	// lockRegions

	eraseAll(offset) {

	}

	async writePage(page) {

	}

	async readPage(page, buffer) {
		if (page >= this.pageCount) {
			throw ErrFlashPage;
		}
		if (buffer.length !== this.pageSize) {

		}
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
		// const eraseSize = 
	}

	async _readUserRow(wtf) {

	}

}