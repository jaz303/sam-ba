class Device {
	constructor(client, name, flash, settings) {
		this.family = familyName(name);
		this.name = name;
		this.flash = flash;
		this.settings = settings;

		this._client = client;
	}

	reset() {
		throw new Error("reset() is not implemented");
	}
}

const RESETS = [
    (c) => c.writeWord(0xE000ED0C, 0x05FA0004),
    (c) => c.writeWord(0x400E1A00, 0xA500000D),
    (c) => c.writeWord(0x400E1200, 0xA500000D),
    (c) => c.writeWord(0x400E1400, 0xA500000D),
    (c) => c.writeWord(0x400E1800, 0xA500000D),
    (c) => c.writeWord(0xFFFFFD00, 0xA500000D)
];

const {C2xD2xNVMFlash} = require('../flash/C2xD2xNVMFlash');
const {FlashUserRowSettings} = require('../settings/FlashUserRowSettings');
const {C2xUserRow} = require('../settings/C2xUserRow');
const {D2xUserRow} = require('../settings/D2xUserRow');

class SAMC2xD2x extends Device {
	constructor(client, name, flashParams, settingsDef) {
		const flash = new C2xD2xNVMFlash(client, flashParams);
		const settings = new FlashUserRowSettings(client, flash, settingsDef);
		super(client, name, flash, settings);
	}

	reset() {
		return RESETS[0](this._client);
	}
}

exports.SAMC2x = class SAMC2x extends SAMC2xD2x {
	constructor(client, name, flashParams) {
		super(
			client,
			name,
			flashParams,
			new C2xUserRow()
		);
	}
}

exports.SAMD2x = class SAMD2x extends SAMC2xD2x {
	constructor(client, name, flashParams) {
		super(
			client,
			name,
			flashParams,
			new D2xUserRow()
		);
	}
}

function familyName(part) {
	if (part.match(/^AT(SAM[CD]2[01])/))
		return RegExp.$1;

	throw new Error(`Unknown family for part ${part}`);
}