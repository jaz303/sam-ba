const {UserRow} = require('./UserRow');

const Address = 0x804000;

exports.D2xUserRow = class D2xUserRow extends UserRow {
    constructor() {
        super(Address, 8, 16);
        
        this._add('BOOTPROT', 3);
        this._skip(1);
        this._add('EEPROM', 3);
        this._skip(1);
        this._add('BOD33_LEVEL', 6);
        this._add('BOD33_ENABLE', 1);
        this._add('BOD33_ACTION', 2);
        this._skip(8);
        this._add('WDT_ENABLE', 1);
        this._add('WDT_ALWAYS_ON', 1);
        this._add('WDT_PERIOD', 4);
        this._add('WDT_WINDOW', 4);
        this._add('WDT_EWOFFSET', 4);
        this._add('WDT_WEN', 1);
        this._add('BOD33_HYSTERESIS', 1);
        this._skip(7);
        this._add('LOCK', 16);
        this._done();
    }

    setBOR(enabled) {
        this.set('BOD33_ACTION', enabled ? 0x1 : 0x0);
    }

    setBOD(enabled) {
        this.set('BOD33_ENABLE', enabled ? 0x1 : 0x0);
    }
}