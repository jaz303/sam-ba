const bool = (v) => !!v;

exports.FlashOptions = class FlashOptions {
	constructor(lockRegionCount) {

		// One boolean per page
		// true => region is locked
		this.lockRegions = makeOption(
			makeFalses(lockRegionCount),
			(v) => v.slice(0),
			(v) => {
				if (v.length !== lockRegionCount) {
					throw new Error(`Lock region count mismatch`);
				}
				return v.map(bool);
			}
		);

		this.security = makeOption(false, null, bool);
		this.bod = makeOption(false, null, bool);
		this.bor = makeOption(false, null, bool);
		this.bootFlash = makeOption(false, null, bool);
	}
}

function makeOption(value, get, set) {
	let dirty = false;

	get = get || function(v) { return v; }
	set = set || function(v) { return v; }

	return {
		get value() { return value; },
		get isDirty() { return dirty; },
		set(v) { value = set(v); dirty = true; }
	};
}

function makeFalses(len) {
	const lrs = new Array(len);
	lrs.fill(false);
	return lrs;
}