exports.Applet = class Applet {
	constructor(client, {addr, code, start, stack, reset}) {
		this._client = client;

		this._addr = addr;
		this._code = code;
		this._start = start;
		this._stack = stack; // Applet stack address in device SRAM
		this._reset = reset;
	}

	// Applet size
	get size() { return this._code.length; }

	// Address in device SRAM where will be placed the applet
	get addr() { return this._addr; }

	init() {
		return this._client.write(this._addr, this._code);
	}

	setStack(stack) {
		return this._client.writeWord(this._stack, stack);
	}

	// To be used for Thumb-1 based devices (ARM7TDMI, ARM9)
	run() {
		// Add one to the start address for Thumb mode
		return this._client.go(this._start + 1);
	}

	// To be used for Thumb-2 based devices (Cortex-Mx)
	async runv() {
		// Add one to the start address for Thumb mode
		await this._client.writeWord(this._reset, this._start + 1);
		
		// The stack is the first reset vector
		await this._client.go(this._stack);
	}
}