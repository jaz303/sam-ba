const {UserRow} = require('./UserRow');

const Address = 0x804000;

exports.C2xUserRow = class C2xUserRow extends UserRow {
	constructor() {
		super(Address, 8, 16);
		
		this._add('BOOTPROT', 3);
		this._skip(1);
		this._add('EEPROM', 3);
		this._skip(1);
		this._add('BODVDD_LEVEL', 6);
		this._add('BODVDD_DISABLE', 1);
		this._add('BODVDD_ACTION', 2);
		this._add('BODCORE_CALIBRATION_1', 9, false);
		this._add('WDT_ENABLE', 1);
		this._add('WDT_ALWAYS_ON', 1);
		this._add('WDT_PERIOD', 4);
		this._add('WDT_WINDOW', 4);
		this._add('WDT_EWOFFSET', 4);
		this._add('WDT_WEN', 1);
		this._add('BODVDD_HYSTERESIS', 1);
		this._add('BODCORE_CALIBRATION_2', 1, false);
		this._skip(5);
		this._add('LOCK', 16);
		this._done();
	}

	setBOR(enabled) {
		this.set('BODVDD_ACTION', enabled ? 0x1 : 0x0);
	}

	setBOD(enabled) {
		this.set('BODVDD_DISABLE', enabled ? 0x0 : 0x1);
	}
}