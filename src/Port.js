exports.Port = class Port {
	constructor(transport, isUSB) {
		this.isUSB = isUSB;

		this._transport = transport;
		this._timeout = 0;

		this._receivedChunks = [];

		this._startReading();
	}

	async read(buffer) {
		
	}

	async write(buffer) {

	}

	async get() {

	}

	async put(c) {

	}

	timeout(millis) {
		
	}

	async flush() {

	}

	_startReading() {
		this._transport.on('data', (buf) => {
			this._receivedChunks.push(buf);
			this._drain();
		});
	}

	_drain() {
		
	}
}