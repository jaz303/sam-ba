const {Applet} = require('./Applet');

const impl = require('./word_copy_impl');

exports.WordCopyApplet = class WordCopyApplet extends Applet {
	constructor(client, addr) {
		super(client, {
			addr 	: addr,
			code	: impl.$codeBuffer,
			start 	: addr + impl.start,
			stack 	: addr + impl.stack,
			reset	: addr + impl.reset
		});
	}

	async configure(destinationAddress, sourceAddress, wordCount) {
		await this._client.writeWord(this.addr + impl.dst_addr, destinationAddress);
		await this._client.writeWord(this.addr + impl.src_addr, sourceAddress);
		await this._client.writeWord(this.addr + impl.words, wordCount);
	}
}