const {EventEmitter} = require('events');

exports.Flasher = class Flasher extends EventEmitter {
	constructor(client, device) {
		super();
		this._client = client;
		this._device = device;
		this._flash = device.flash;
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

	verify(foffset, data) {

	}

	read(foffset, buffer) {
		const pageSize = this._flash.pageSize;

		
	}

	lock() {

	}

	info() {

	}
}