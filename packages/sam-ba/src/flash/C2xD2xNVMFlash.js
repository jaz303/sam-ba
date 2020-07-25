const {BaseFlash} = require('./BaseFlash');
const debug = require('../debug');

// CMDEX field should be 0xA5 to allow execution of any command.
const CMDEX_KEY                     = 0xa500;

// NVM ready bit mask
const NVM_INT_STATUS_READY_MASK     = 0x1;

// NVM status mask
const NVM_CTRL_STATUS_MASK          = 0xFFEB;

const NVM_REG_BASE                  = 0x41004000;

const NVM_REG_CTRLA                 = 0x00;
const NVM_REG_CTRLB                 = 0x04;
const NVM_REG_INTFLAG               = 0x14;
const NVM_REG_STATUS                = 0x18;
const NVM_REG_ADDR                  = 0x1c;
const NVM_REG_LOCK                  = 0x20;

const NVM_CMD_ER                    = 0x02;
const NVM_CMD_WP                    = 0x04;
const NVM_CMD_EAR                   = 0x05;
const NVM_CMD_WAP                   = 0x06;
const NVM_CMD_LR                    = 0x40;
const NVM_CMD_UR                    = 0x41;
const NVM_CMD_SSB                   = 0x45;
const NVM_CMD_PBC                   = 0x44;

const ERASE_ROW_PAGES               = 4; // pages

const ErrFlashCmd = Symbol('err-flash-cmd');

const delay = (ms) => new Promise((y,n) => setTimeout(y, ms));

const console = { log() {}, warn() {}, error() {} };

exports.C2xD2xNVMFlash = class C2xD2xNVMFlash extends BaseFlash {
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

    async writePage(page) {
        this._checkPageNumber(page);

        // Disable cache and configure manual page write
        const rv = await this._readReg(NVM_REG_CTRLB);
        await this._writeReg(NVM_REG_CTRLB, rv | (0x1 << 18) | (0x1 << 7));

        console.log("cache disabled + configured");
        
        // Auto-erase if writing at the start of the erase page
        if (this._eraseAuto && (page % ERASE_ROW_PAGES) == 0) {
            console.log("erasing...");
            await this._erase(page * this.pageSize, ERASE_ROW_PAGES * this.pageSize);
            console.log("erase complete");
        }

        // Clear page buffer
        await this._command(NVM_CMD_PBC);

        console.log("PBC issued");

        // Compute the start address.
        const addr = this.address + (page * this.pageSize);

        await this._wordCopy.setDestinationAddress(addr);
        await this._wordCopy.setSourceAddress(this._onBufferA ? this._pageBufferA : this._pageBufferB);

        console.log("word copy applet configured");

        this._onBufferA = !this._onBufferA;

        console.log("waiting for ready");

        await this._waitReady();

        console.log("ready, running applet...");

        await this._wordCopy.runv();

        console.log("applet run");

        await this._writeReg(NVM_REG_ADDR, addr / 2);

        console.log("nvm reg addr");

        await this._command(NVM_CMD_WP);

        console.log("done!");
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
        console.log("cmd wait ready");
        await this._waitReady();
        console.log("cmd write reg");
        await this._writeReg(NVM_REG_CTRLA, CMDEX_KEY | cmd);
        console.log("cmd wait ready 2");
        await delay(15);
        await this._waitReady();
        console.log("cmd read reg");
        if ((await this._readReg(NVM_REG_INTFLAG)) & 0x2) {
            // Clear the error bit
            await this._writeReg(NVM_REG_INTFLAG, 0x2);
            throw ErrFlashCmd;
        }
    }

    async _erase(offset, minSize) {
        const eraseSize = this.pageSize * ERASE_ROW_PAGES;

        if ((offset % eraseSize) != 0) {
            throw new Error("Erase offset not erase boundary aligned");
        }

        if ((offset + minSize) > this.totalSize) {
            throw new Error("Erase size out of bounds");
        }

        const eraseStart = offset / eraseSize;
        const eraseEnd = Math.floor((offset + minSize + eraseSize - 1) / eraseSize);

        if (debug.enabled) {
            debug.info("Erase start: %d", eraseStart);
            debug.info("Erase end: %d", eraseEnd);
        }

        for (let eraseNum = eraseStart; eraseNum < eraseEnd; ++eraseNum) {
            await this._waitReady();

            // Clear error bits
            const statusReg = await this._readReg(NVM_REG_STATUS);
            await this._writeReg(NVM_REG_STATUS, statusReg | NVM_CTRL_STATUS_MASK);

            // Issue erase command
            const wordAddr = (eraseNum * eraseSize) >> 1;
            await this._writeReg(NVM_REG_ADDR, wordAddr);
            await this._command(NVM_CMD_ER);
        }
    }
}