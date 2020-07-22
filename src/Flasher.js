const {EventEmitter} = require('events');

exports.Flasher = class Flasher extends EventEmitter {
	constructor(client, device) {
		super();
		this._client = client;
		this._device = device;
		this._flash = device.flash;
		this._nextID = 1;
	}

	async erase(foffset) {
		this.emit('erase');
		await this._flash.eraseAll(foffset);
		this._flash.eraseAuto(false);
	}

	async write(foffset, data) {
		const pageSize = this._flash.pageSize;
		
		const numPages = Math.ceil(data.length / pageSize);
		if (numPages > this._flash.pageCount) {
			throw new Error("Data too long");
		}

		if (this._client.canWriteBuffer()) {
			// let offset = 0;
			// const bufferSize = this._client.writeBufferSize;

			// for (let i = 0; i < data.length; i += bufferSize) {

			// }
		} else {
			let page = foffset / pageSize;
			// TODO: check page is integer
			for (let i = 0; i < data.length; i += pageSize, page++) {
				// TODO: emit progress
				await this._flash.loadBuffer(data.slice(i, i + pageSize));
				// TODO: emit progress
				await this._flash.writePage(page);
				// TODO: emit progress
			}
		}
	}

	verify(flashOffset, data) {

	}

	async read(flashOffset, buffer) {
		const pageSize = this._flash.pageSize;
		const pageBuffer = Buffer.alloc(pageSize);

		if (flashOffset < 0 || flashOffset >= this._flash.totalSize) {
			throw new Error(`Flash read start is out of bounds`);
		}

		if ((flashOffset % pageSize) !== 0) {
			throw new Error(`Flash read offset ${flashOffset} is not page-aligned`);
		}

		if ((flashOffset + buffer.length) > this._flash.totalSize) {
			throw new Error(`Flash read end is out of bounds`);
		}

		const opID = this._generateOperationID();
		const pagesToRead = Math.ceil(buffer.length / pageSize);
		const pageOffset = flashOffset / pageSize;

		this.emit('start', {
			id: opID,
			operation: 'read',
			flashOffset: flashOffset,
			length: buffer.length,
			pageCount: pagesToRead
		});

		for (let pageNum = 0; pageNum < pagesToRead; ++pageNum) {
			const page = pageOffset + pageNum;
			this.emit('progress', {
				id: opID,
				pageIndex: pageNum,
				flashPage: page,
				progress: (pageNum / pagesToRead)
			});
			await this._readPage(page, pageBuffer);
			const bytesToCopy = Math.min(buffer.length, pageBuffer.length);
			pageBuffer.copy(buffer, 0, 0, bytesToCopy);
			buffer = buffer.slice(bytesToCopy);
		}

		this.emit('end', {
			id: opID,
			operation: 'read'
		});
	}

	lock() {

	}

	info() {

	}

	_readPage(page, buf) {
		if (page < 0 || page >= this._flash.pageCount) {
			throw new Error(`Invalid flash page (${page})`);
		}
		if (buf.length !== this._flash.pageSize) {
			throw new Error(`Buffer size (${buf.length}) does not equal page size (${this._flash.pageSize})`);
		}
		return this._client.read(page * this._flash.pageSize, buf);
	}

	_generateOperationID() {
		return this._nextID;
	}
}