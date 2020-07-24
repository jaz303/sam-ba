const Unknown = Symbol('unknown');
const Loaded = Symbol('loaded');
const Dirty = Symbol('dirty');

exports.FlashUserRowSettings = class FlashUserRowSettings {
    constructor(client, flash, definition) {
        this._client = client;
        this._flash = flash;
        this._def = definition;
        this._state = Unknown;
        this._ref = null;
        this._curr = null;
    }

    async init() {
        await this._flash.init();
    }

    async read() {
        this._ref = Buffer.alloc(this._def.size);
        this._curr = Buffer.alloc(this._def.size);
        await this._client.read(this._def.address, this._ref);
        this._ref.copy(this._curr);
        this._state = Loaded;
    }

    getAll() {
        this._loadCheck();
        return this._def.getAll(this._curr);
    }

    isDirty() {
        return this._state === Dirty;
    }

    _updateDirty() {
        if (this._ref.compare(this._curr) !== 0) {
            this._state = Dirty;
        }
    }

    _loadCheck() {
        if (this._state === Unknown) {
            throw new Error("Settings not loaded");
        }
    }
}