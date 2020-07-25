const debug = require('./debug');
const printf = require('printf');
const {EventEmitter} = require('events');

function now() { return Date.now() / 1000; }
function dur(s) { return now() - s; }

exports.Flasher = class Flasher extends EventEmitter {
    constructor(client, device) {
        super();
        this._client = client;
        this._device = device;
        this._flash = device.flash;
        this._nextID = 1;
    }

    async erase(offset) {
        const F = await this._getFlash();
        await F.eraseAll(offset);
    }

    async write(offset, data) {
        const F = await this._getFlash();

        let page = F.pageForAddress(offset);

        const end = offset + data.length;
        if (end > F.totalSize) {
            throw new Error(printf("End address 0x%08X is out of bounds", end));
        }

        if (debug.enabled)
            debug.info("Write %d bytes (%d pages) starting at page %d", data.length, Math.ceil(data.length / F.pageSize), page);

        if (this._client.canWriteBufer()) {
            await this._writeViaBuffer(F, page, data);
        } else {
            await this._writeStandard(F, page, data);
        }
    }

    async readToBuffer(offset, dst) {
        const F = await this._getFlash();

        const startPage = F.pageForAddress(offset);

        if (!dst) {
            dst = Buffer.alloc(F.totalSize - offset);
        } else {
            const end = offset + dst.length;
            if (end > F.totalSize) {
                throw new Error(printf("End address 0x%08X is out of bounds", end));
            }
        }

        const op = { operation: 'read', id: this._generateOperationID() }
        const pagesToRead = Math.ceil(dst.length / F.pageSize);
        const pageBuffer = Buffer.alloc(F.pageSize);
        const startTime = now();

        if (debug.enabled)
            debug.info("Reading %d bytes (%d pages) starting from page %d", dst.length, pagesToRead, page);

        this.emit('start', {
            address: offset,
            length: dst.length,
            pageCount: pagesToRead,
            ...op
        });

        let tmp = dst;
        for (let pageIndex = 0; pageIndex < pagesToRead; ++pageIndex) {
            this.emit('progress', this._progressEvent(pagesToRead, pageIndex, op));

            const page = startPage + pageIndex;

            if (debug.enabled)
                debug.info("Read page %d", page);

            const readStart = now();
            this.emit('pageread:start', { page: page, ...op });
            await F.readPage(page, pageBuffer);
            this.emit('pageread:end', { page: page, duration: dur(readStart), ...op });

            const bytesToCopy = Math.min(F.pageSize, tmp.length);
            pageBuffer.copy(tmp, 0, 0, bytesToCopy);
            tmp = tmp.slice(bytesToCopy);
        }

        if (debug.enabled)
            debug.info("Read to buffer complete");

        this.emit('progress', this._progressEvent(pagesToRead, pagesToRead, op));

        this.emit('end', {
            duration: dur(startTime),
            ...op
        });

        return dst;
    }

    async _writeViaBuffer() {
        throw new Error("Not implemented");
    }

    async _writeStandard(F, page, data) {
        const pageBuffer = Buffer.alloc(F.pageSize);

        while (data.length) {
            if (debug.enabled)
                debug.info("Write page %d", page);

            const bytesToCopy = Math.min(data.length, F.pageSize);
            data.copy(pageBuffer, 0, 0, bytesToCopy);
            pageBuffer.fill(0x00, bytesToCopy);
            await F.loadBuffer(pageBuffer);
            await F.writePage(page);
            page++;
            data = data.slice(bytesToCopy);
        }
    }

    async _getFlash() {
        await this._device.flash.init();
        return this._device.flash;
    }

    _generateOperationID() {
        return this._nextID;
    }

    _progressEvent(max, complete, op) {
        return {
            progress: complete / max,
            stepCount: max,
            stepsCompleted: complete,
            ...op
        }
    }
}