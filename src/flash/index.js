const C2xD2xNVMFlash = require('./C2xD2x/NVMFlash').NVMFlash;
const {C2xUserRow} = require('./C2xD2x/C2xUserRow');
const {D2xUserRow} = require('./C2xD2x/D2xUserrow');

exports.C2xNVM = (client, opts) => {
	return new C2xD2xNVMFlash(client, {
		userRow: new C2xUserRow(),
		...opts
	});
}

exports.D2xNVM = (client, opts) => {
	return new C2xD2xNVMFlash(client, {
		userRow: new D2xUserRow(),
		...opts
	});
}
