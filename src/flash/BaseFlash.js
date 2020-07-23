const {WordCopyApplet} = require('../applets/WordCopyApplet');

function align32(val) {
	return (val + 3) & ~3;
}

exports.BaseFlash = class BaseFlash {
	constructor(client, {address, pageCount, pageSize, planeCount, lockRegionCount, user, stack}) {
		this.address = address;
		this.pageCount = pageCount;
		this.pageSize = pageSize;
		this.planeCount = planeCount;
		this.lockRegionCount = lockRegionCount;
		
		this._user = user;
		this._stack = stack;
		this._client = client;
		this._wordCopy = new WordCopyApplet(client, user);
		
		// page buffers will have the size of a physical page and will be situated right after the applet
		this._pageBufferA = align32(user + this._wordCopy.size);
		this._pageBufferB = this._pageBufferA + this.pageSize;
		this._onBufferA = true;
	}

	get totalSize() { return this.pageCount * this.pageSize; }

	async init() {
		await this._wordCopy.install();
		await this._wordCopy.setWordCount(this.pageSize / 4);
		await this._wordCopy.setStack(this._stack);
	}

	eraseAll(offset) { throw new Error("eraseAll() is not implemented"); }
	eraseAuto(enable) { throw new Error("eraseAuto() is not implemented"); }

	writePage(page) { throw new Error("writePage() is not implemented"); }
	readPage(page, dst) { throw new Error("readPage() is not implemented"); }

	writeBuffer(dstAddr, bufferSize) {
		return this._client.writeBuffer(
			this._onBufferA ? this._pageBufferA : this._pageBufferB,
			dstAddr + this.address,
			bufferSize
		);
	}

	loadBuffer(data) {
		this._checkPageBufferSize(data);
		const target = this._onBufferA ? this._pageBufferA : this._pageBufferB;
		console.log("loading buffer to " + target);
		return this._client.write(target, data);
	}

	//
	//

	_checkPageNumber(page) {
		if (page < 0 || page >= this.pageCount) {
			throw new Error(`Invalid page number (${page})`);
		}
	}

	_checkPageBufferSize(buffer) {
		if (buffer.length !== this.pageSize) {
			throw new Error(`Invalid page size (${buffer.length})`);
		}
	}
}