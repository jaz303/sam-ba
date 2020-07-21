const {crc16} = require('./crc');
const {bprintf} = require('./bprintf');
const {getDevice} = require('./device');

const printf = require('printf');

const BLK_SIZE          = 128;
const MAX_RETRIES       = 5;
const SOH               = 0x01;
const EOT               = 0x04;
const ACK               = 0x06;
const NAK               = 0x15;
const CAN               = 0x18;
const START             = 'C'.charCodeAt(0);

const TIMEOUT_QUICK     = 100;
const TIMEOUT_NORMAL    = 1000;
const TIMEOUT_LONG      = 5000;

const ErrIO = Symbol('io-error');
const ErrUnsupported = Symbol('unsupported');
const ErrNotImplemented = Symbol('not-implemented');

const {info, warn, error} = require('./debug');

exports.Client = class Client {
    constructor(port, debug = false) {
        this._port = port;
        this._isUSB = port.isUSB;

        this._caps = {
            chipErase: false,
            writeBuffer: false,
            checksumBuffer: false
        };

        this._readBufferSize = 0;
        this._debug = debug;
    }

    canChipErase() { return this._caps.chipErase; }
    canWriteBufer() { return this._caps.writeBuffer; }
    canChecksumBuffer() { return this._caps.checksumBuffer; }

    async init() {
        if (this._debug)
            info("Initialising...");

        this._port.timeout(TIMEOUT_QUICK);

        // Flush garbage
        await this._port.read(Buffer.alloc(1024));

        // Have skipped BOSSA's auto-baud stuff
        // (this library expects to receive a preconigured port)
        this._port.put('#'.charCodeAt(0));
        
        if (this._debug)
            info("Setting binary mode");
        
        const bSetBinMode = Buffer.from('N#');
        await this._port.write(bSetBinMode);
        await this._port.read(bSetBinMode);

        const ver = await this.version();
        if (this._debug)
            info("Version: %s", ver);

        // Skipping the Arduino stuff for now

        this._port.timeout(TIMEOUT_NORMAL);

        return ver;
    }

    device() {
        return getDevice(this, this._debug);
    }

    async writeByte(addr, val) {
        await this._writeFully(bprintf("O%08X,%02X#", addr, val));
        if (this._isUSB) {
            await this._port.flush();
        }
    }

    async readByte(addr, val) {
        await this._writeFully(bprintf("o%08X,4#", addr));
        const buf = await this._readBytes(1);
        return buf[0];
    }

    async writeWord(addr, val) {
        await this._writeFully(bprintf("W%08X,%08X#", addr, val));
        if (this._isUSB) {
            await this._port.flush();
        }
    }

    async readWord(addr, val) {
        await this._writeFully(bprintf("w%08X,4#", addr));
        const buf = await this._readBytes(4);
        return buf.readUInt32LE(0);
    }

    async write(addr, buffer) {
        await this._writeFully("S%08X,%08X#", addr, buffer.length);
        if (this._isUSB) {
            await this._port.flush();
            await this._writeBinary(buffer);
        } else {
            await this._writeXmodem(buffer);
        }
    }

    async read(addr, buffer) {
        if (this._debug)
            info("Reading %d bytes from %s...", buffer.length, printf("0x%08X", addr));

        if (this._isUSB
            && this._readBufferSize == 0
            && buffer.length > 32
            && !(size & (size - 1))) {
            buffer[0] = await this._readByte(addr);
            addr++;
            buffer = buffer.slice(1);
        }
        
        while (buffer.length > 0) {
            let chunk;
            if (this._readBufferSize > 0 && buffer.length > this._readBufferSize) {
                chunk = this._readBufferSize;
            } else {
                chunk = buffer.length;
            }
            await this._writeFully(bprintf("R%08X,%08X#", addr, chunk));
            if (this._isUSB) {
                await this._readBinary(buffer.slice(0, chunk));
            } else {
                await this._readXmodem(buffer.slice(0, chunk));
            }
            addr += chunk;
            buffer = buffer.slice(chunk);
        }
    }

    async go(addr) {
        await this._writeFully(bprintf("G%08X#", addr));
        if (this._isUSB) {
            await this._port.flush();
        }
    }

    async version() {
        await this._writeFully(Buffer.from('V#'));

        this._port.timeout(TIMEOUT_QUICK);
        const response = Buffer.alloc(255);
        const size = await this._port.read(response);
        this._port.timeout(TIMEOUT_NORMAL);
        if (size <= 0) {
            if (this._debug)
                error("Get version - timeout");
            throw ErrIO;
        }

        if (this._debug)
            info("Getting version, %d bytes read", size);

        let end;
        for (end = 0; end < size; ++end) {
            const ch = response[end];
            if (ch < 0x20 || ch > 0x7E) {
                break;
            }
        }

        return response.slice(0, end).toString();
    }

    //
    // Extended operations

    async chipErase(startAddr) {
        this._checkCap('chipErase');
        await this._writeFully(bprintf("X%08X#", startAddr));
        this._port.timeout(TIMEOUT_LONG);
        const res = await this._readBytes(3);
        this._port.timeout(TIMEOUT_NORMAL);
        if (res[0] !== 'X'.charCodeAt(0)) {
            throw new Error();
        }
    }

    async writeBuffer(srcAddr, dstAddr, size) {
        this._checkCap('writeBuffer');
        // TODO: implement
        throw ErrNotImplemented;
    }

    async checksumBuffer(srcAddr, dstAddr, size) {
        this._checkCap('checksumBuffer');
        // TODO: implement
        throw ErrNotImplemented;
    }

    //
    //

    async _writeXmodem(buffer) {
        const blk = Buffer.alloc(BLK_SIZE + 5);
        let blkNum = 1;
        let retries;

        for (retries = 0; retries < MAX_RETRIES; ++retries) {
            if ((await this._port.get()) == START) {
                break;
            }
        }
        
        if (retries == MAX_RETRIES) {
            throw ErrIO;
        }

        while (buffer.length > 0) {
            blk[0] = SOH;
            blk[1] = (blkNum & 0xFF);
            blk[2] = ~(blkNum & 0xFF);

            const bytesToCopy = Math.min(buffer.length, BLK_SIZE);
            buffer.copy(blk, 3, 0, bytesToCopy);
            this._crcCalc(blk);

            for (retries = 0; retries < MAX_RETRIES; ++retries) {
                await this._writeFully(blk);
                if ((await this._port.get()) == ACK) {
                    break;
                }
            }
            
            if (retries == MAX_RETRIES) {
                throw ErrIO;
            }
            
            buffer = buffer.slice(BLK_SIZE);
            blkNum++;
        }

        for (retries = 0; retries < MAX_RETRIES; ++retries) {
            await this._port.put(EOT);
            if ((await this._port.get()) == ACK) {
                break;
            }
        }
        
        if (retries == MAX_RETRIES) {
            throw ErrIO;
        }
    }

    async _readXmodem(buffer) {
        const blk = Buffer.alloc(BLK_SIZE + 5);
        let blkNum = 1;
        let retries;

        while (buffer.length > 0) {
            for (retries = 0; retries < MAX_RETRIES; ++retries) {
                if (blkNum === 1) {
                    await this._port.put(START);
                }

                const bytesRead = await this._port.read(blk);
                if (bytesRead === blk.length
                    && blk[0] === SOH
                    && blk[1] === (blkNum & 0xFF)
                    && this._crcCheck(blk)) {
                    break;
                }
                
                if (blkNum !== 1) {
                    await this._port.put(NAK);
                }
            }   
            
            if (retries == MAX_RETRIES) {
                throw ErrIO;
            }

            await this._port.put(ACK);

            const bytesToCopy = Math.min(buffer.length, BLK_SIZE);
            blk.copy(buffer, 0, 3, 3 + bytesToCopy);
            buffer = buffer.slice(bytesToCopy);
            blkNum++
        }

        for (retries = 0; retries < MAX_RETRIES; ++retries) {
            if ((await this._port.get()) == EOT) {
                await this._port.put(ACK);
                break;
            }
            await this._port.put(NAK);
        }
        
        if (retries == MAX_RETRIES) {
            throw ErrIO;
        }
    }

    _writeBinary(buffer) {
        return this._writeFully(buffer);
    }

    _readBinary(buffer) {
        return this._readFully(buffer);
    }

    async _writeFully(buffer) {
        const written = await this._port.write(buffer);
        if (written !== buffer.length) {
            throw ErrIO;
        }
    }

    async _readFully(buffer) {
        const read = await this._port.read(buffer);
        if (read !== buffer.length) {
            throw ErrIO;
        }
    }

    async _readBytes(n) {
        const out = Buffer.alloc(n);
        await this._readFully(out);
        return out;
    }

    _crcCalc(block) {
        block.writeUInt16BE(BLK_SIZE + 3, crc16(block.slice(3, 3 + BLK_SIZE)));
    }

    _crcCheck(block) {
        return block.readUInt16BE(BLK_SIZE + 3) === crc16(block.slice(3, 3 + BLK_SIZE));
    }

    _checkCap(cap) {
        if (!this._caps[cap]) {
            throw ErrUnsupported;
        }
    }
}

