const debug = require('./debug');
const printf = require('printf');

exports.Flasher = class Flasher {
	constructor(client, device) {
		this._client = client;
		this._device = device;
		this._flash = device.flash;
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

		let page = F.pageForAddress(offset);

		if (!dst) {
			dst = Buffer.alloc(F.totalSize - offset);
		} else {
			const end = offset + dst.length;
			if (end > F.totalSize) {
				throw new Error(printf("End address 0x%08X is out of bounds", end));
			}
		}

		if (debug.enabled)
			debug.info("Reading %d bytes (%d pages) starting from page %d", dst.length, Math.ceil(dst.length / F.pageSize), page);

		const pageBuffer = Buffer.alloc(F.pageSize);

		let tmp = dst;
		while (tmp.length) {
			if (debug.enabled)
				debug.info("Read page %d", page);

			await F.readPage(page, pageBuffer);
			const bytesToCopy = Math.min(F.pageSize, tmp.length);
			pageBuffer.copy(tmp, 0, 0, bytesToCopy);
			page++;
			tmp = tmp.slice(bytesToCopy);
		}

		if (debug.enabled)
			debug.info("Read to buffer complete");

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

		if (debug.enabled)
			debug.info("Standard write complete");
	}

	async _getFlash() {
		await this._device.flash.init();
		return this._device.flash;
	}
}