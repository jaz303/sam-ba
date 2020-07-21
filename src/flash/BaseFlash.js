const {WordCopyApplet} = require('../applets/WordCopyApplet');

function makeOption(value) {
	let dirty = false;

	return {
		get value() { return value; },
		get isDirty() { return dirty; },
		set(v) { value = v; dirty = true; }
	};
}

function makeFalses(len) {
	const lrs = new Array(len);
	lrs.fill(false);
	return lrs;
}

function align32(val) {
	return (val + 3) & ~3;
}

exports.BaseFlash = class BaseFlash {
	constructor(client, {address, pageCount, pageSize, planeCount, lockRegionCount, user, stack}) {
		this.address = address;
		this.pageCount = pageCount;
		this.pageSize = size;
		this.planeCount = planeCount;
		this.lockRegionCount = lockRegionCount;
		
		this._user = user;
		this._stack = stack;
		this._client = client;
		this._wordCopy = new WordCopyApplet(client, user);
		this._lockRegions = makeOption(makeFalses(this.lockRegionCount));
		this._security = makeOption(false);
		this._bod = makeOption(false);
		this._bor = makeOption(false);
		this._bootFlash = makeOption(false);
		
		// page buffers will have the size of a physical page and will be situated right after the applet
		this._pageBufferA = align32(user + this._wordCopy.size);
		this._pageBufferB = this._pageBufferA + this.pageSize;
		this._onBufferA = true;
	}

	get lockRegions() { return this._lockRegions.value.slice(0); }
	get totalSize() { return this.pageCount * this.pageSize; }

	async init() {
		// await this._wordCopyApplet.configure()
	}

	eraseAll(offset) { throw new Error("eraseAll() is not implemented"); }
	eraseAuto(enable) { throw new Error("eraseAuto() is not implemented"); }

	readLockRegions() { throw new Error("readLockRegions() is not implemented"); }
	setLockRegions(val) {
		if (!Array.isArray(val) || val.length !== this.lockRegionCount) {
			throw new Error("Lock region size mismatch");
		}
		this._lockRegions.set(val.map(v => !!v));
	}

	readSecurity() { throw new Error("readSecurity() is not implemented"); }
	enableSecurity() { this._security.set(true); }

	isBODSupported() { return false; }
	readBOD() { throw new Error("readBOD() is not implemented"); }
	setBOD(enable) {
		if (this.isBODSupported()) {
			this._bod.set(!!enable);
		}
	}
	
	isBORSupported() { return false; }
	readBOR() { throw new Error("readBOR() is not implemented"); }
	setBOR(enable) {
		if (this.isBORSupported()) {
			this._bor.set(!!enable);
		}
	}

	isBootFlashSupported() { return false; }
	readBootFlash() { throw new Error("readBootFlash() is not implemented"); }
	setBootFlash(enable) {
		if (this.isBootFlashSupported()) {
			this._bootFlash.set(!!enable);
		}
	}
	
	writeOptions() { throw new Error("writeOptions() is not implemented"); }

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
		return this._client.write(
			this._onBufferA ? this._pageBufferA : this._pageBufferB,
			data
		);
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