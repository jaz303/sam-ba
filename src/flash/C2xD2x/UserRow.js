exports.UserRow = class UserRow {
	constructor(size, lockRegionCount) {
		this.size = size;
		this.lockRegionCount = lockRegionCount;

		if (lockRegionCount > 32) {
			throw new Error("Maximum number of supported lock regions is 32");
		}

		this._settings = {};
		this._rowData = Buffer.alloc(size);
		this._pos = 0;
	}

	reset(newData) {
		if (newData.length !== this.size) {
			throw new Error(`Invalid user row length (expected=${this.size}, actual=${newData.size})`);
		}
		this._rowData = newData.slice(0, this.size);
	}

	get(key) {
		let {offset, width} = this._checkSetting(key, false);

		let value = 0;
		for (let i = 0; i < width; ++i, ++offset) {
			const by = offset >> 3;
			const bi = offset & 7;
			if (this._rowData[by] & (1 << bi)) {
				value |= (1 << i);
			}
		}

		return value;
	}

	getAll() {
		const out = {};
		for (let key in this._settings) {
			out[key] = this.get(key);
		}
		return out;
	}

	set(key, value) {
		let {offset, width, writable} = this._checkSetting(key, true);

		for (let i = 0; i < width; ++i, ++offset) {
			const by = offset >> 3;
			const bi = offset & 7;
			if (value & (1 << i)) {
				this._rowData[by] |= (1 << bi);
			} else {
				this._rowData[by] &= ~(1 << bi);
			}
		}
	}

	_checkSetting(key, forWriting) {
		const cfg = this._settings[key];

		if (!cfg) {
			throw new Error(`Unknown setting key '${key}'`);
		}

		if (cfg.width > 32) {
			throw new Error("Manipulating settings of width > 32 not yet supported!");
		}

		if (forWriting && !cfg.writable) {
			throw new Error(`Settings key '${key}' is read-only`);
		}

		return cfg;
	}

	//
	// Lock Regions

	getLockedRegions() {
		const mask = this.get('LOCK');
		
		const out = [];
		for (let i = 0; i < this.lockRegionCount; ++i) {
			out.push(!(mask & (1 << i)));
		}

		return out;
	}

	setLockedRegions(lockedRegions) {
		if (lockedRegions.length !== this.lockRegionCount) {
			throw new Error("Lock region length mismatch");
		}

		let mask = 0xFFFFFFFF;
		for (let i = 0; i < lockedRegions.length; ++i) {
			if (lockedRegions[i]) {
				mask &= ~(1 << i);
			}
		}

		this.set('LOCK', mask);
	}

	lockAllRegions() { this._setAllRegionsLocked(true); }
	unlockAllRegions() { this._setAllRegionsLocked(false); }

	_setAllRegionsLocked(locked) {
		const rs = new Array(this.lockRegionCount);
		rs.fill(!!locked);
		this.setLockedRegions(rs);
	}

	//
	// Methods for declaring settings

	_add(name, bitWidth, writable = true) {
		if (name in this._settings) {
			throw new Error(`Duplicate user row setting '${name}'`);
		}

		this._settings[name] = {
			offset 		: this._pos,
			width 		: bitWidth,
			writable	: writable
		};

		this._pos += bitWidth;
	}

	_skip(bitWidth) {
		this._pos += bitWidth;
	}

	_done() {
		if (this._pos !== (this.size * 8)) {
			throw new Error(`Size mismatch (expected=${this.size * 8}, actual=${this._pos})`);
		}
	}
}