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

		const op = { operation: 'read', id: this._generateOperationID() }
		const pagesToRead = Math.ceil(buffer.length / pageSize);
		const pageOffset = flashOffset / pageSize;
		const startTime = now();

		this.emit('start', {
			flashOffset: flashOffset,
			length: buffer.length,
			pageCount: pagesToRead,
			...op
		});

		for (let pageNum = 0; pageNum < pagesToRead; ++pageNum) {
			this.emit('progress', this._progressEvent(pagesToRead, pageNum, op));

			const page = pageOffset + pageNum;
			const readStart = now();

			this.emit('pageread:start', { flashPage: page, ...op });
			await this._readPage(page, pageBuffer);
			this.emit('pageread:end', { flashPage: page, duration: dur(readStart), ...op });
			
			const bytesToCopy = Math.min(buffer.length, pageBuffer.length);
			pageBuffer.copy(buffer, 0, 0, bytesToCopy);
			buffer = buffer.slice(bytesToCopy);
		}

		this.emit('progress', this._progressEvent(pagesToRead, pagesToRead, op));

		this.emit('end', {
			duration: dur(startTime),
			...op
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

	_progressEvent(max, complete, op) {
		return {
			progress: complete / max,
			stepCount: max,
			stepsCompleted: complete,
			...op
		}
	}
}