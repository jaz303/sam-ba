exports.Port = class Port {
	constructor(transport, isUSB) {
		this.isUSB = isUSB;
		this._transport = transport;
		this._timeout = 0;
		this._receivedChunks = [];
		this._activeRead = null;
		this._timeout = null;
		
		transport.on('data', (buf) => {
			this._receivedChunks.push(buf);
			this._drain();
		});
	}

	async read(buffer) {
		return new Promise((yes, no) => {
			if (this._activeRead) {
				throw new Error("Read already in progress!");
			}
			this._activeRead = new ReadRequest(buffer, this._timeout, yes);
			this._setTimeout();
			this._drain();
		});
	}

	write(buffer) {
		this._transport.write(buffer);
		return Promise.resolve(buffer.length);
	}

	async get() {
		const b = Buffer.alloc(1);
		const len = await this.read(b);
		if (len !== 1) {
			return -1;
		}
		return b[0];
	}

	async put(c) {
		const b = Buffer.alloc(1);
		b[0] = c;
		this._transport.write(b);
	}

	timeout(millis) {
		this._timeout = millis;
	}

	async flush() {

	}

	_drain() {
		while (this._activeRead && this._receivedChunks.length > 0) {
			const ar = this._activeRead;
			const chunk = this._receivedChunks.shift();
			const bytesNow = Math.min(chunk.length, ar.buffer.length - ar.received);

			chunk.copy(ar.buffer, ar.received, 0, bytesNow);
			ar.received += bytesNow;
			if (ar.received === ar.buffer.length) {
				this._dispatchReadComplete();
				clearTimeout(this._timeout);
			} else {
				this._setTimeout();
			}

			if (bytesNow < chunk.length) {
				this._receivedChunks.unshift(chunk.slice(bytesNow));
			}
		}
	}

	_setTimeout() {
		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => {
			this._dispatchReadComplete();
		}, this._activeRead.timeout);
	}

	_dispatchReadComplete() {
		const req = this._activeRead;
		this._activeRead = null;
		req.onComplete(req.received);
	}
}

class ReadRequest {
	constructor(buffer, timeout, onComplete) {
		this.buffer = buffer;
		this.timeout = timeout;
		this.onComplete = onComplete;
		this.received = 0;
	}
}