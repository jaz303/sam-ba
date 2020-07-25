const {Port} = require('./src/Port');
const {Client} = require('./src/Client');
const {Flasher} = require('./src/Flasher');
const {UsageError} = require('./src/errors');

const debug = require('./src/debug');

const SerialPort = require('serialport');
const printf = require('printf');

//
// CLI Actions

exports.info = async (options) => {
	const client = await open(options);
	const device = client.device;

	const entries = [
		['SAM-BA version',		'samBAVersion',		client.version],
		['Device', 				'device', 			device.name],
		['Family', 				'family', 			device.family],
		['Flash address',		'flashAddress',		printf("0x%08X", device.flash.address)],
		['Flash size',			'flashSize',		printf("%dKiB", device.flash.totalSize / 1024)],
		['Flash size (bytes)',	'flashSizeBytes',	device.flash.totalSize],
		['Page size (bytes)',	'pageSizeBytes',	device.flash.pageSize],
		['Page count',			'pageCount',		device.flash.pageCount],
		['Plane count',			'planeCount',		device.flash.planeCount],
		['Lock region count',	'lockRegionCount',	device.flash.lockRegionCount]
	];

	print(entries, options);
}

exports.settings = async (options) => {
	const client = await open(options);

	const settings = client.device.settings;

	await settings.init();
	await settings.read();

	const out = [];
	const dict = settings.getAll();
	for (let k in dict) {
		out.push([k, k, dict[k]]);
	}

	print(out, options);
}

exports.reset = async (options) => {
	const device = (await open(options)).device;
	await device.reset();
}

exports.read = async (options) => {
	const client = await open(options);
	const flasher = new Flasher(client, client.device);

	let address = options.address;
	if (address === null) {
		address = 0;
	}

	let targetBuffer = null;
	if (options.length !== null) {
		targetBuffer = Buffer.alloc(options.length);
	}

	const outputBuffer = await flasher.readToBuffer(address, targetBuffer);

	console.log(outputBuffer.length);
	console.log(outputBuffer);
	
}

exports.write = async (options) => {
	const client = await open(options);
	const device = client.device;
	const flasher = new Flasher(client, device);

	if (options.args.length !== 1) {
		throw new UsageError("write <file>");
	}

	const address = options.address;
	if (typeof address !== 'number') {
		throw new Error("Target address must be specified when writing");
	}

	const data = require('fs').readFileSync(options.args[0]);

	await flasher.write(address, data);

	if (debug.enabled)
		debug.info("Flash write complete");
	
	if (options.reset) {
		if (debug.enabled)
			debug.info("Resetting...");
		await device.reset();
	}
}

//
// Helpers

function print(input, options) {
	if (options.json) {
		console.log(JSON.stringify(input.reduce((dict, [name, key, value]) => {
			dict[key] = value;
			return dict;
		}, {}), null, '  '));
	} else {
		input.forEach(([name, key, value]) => {
			console.log("%s: %s", name, value);
		});
	}
}

async function open({serialPort, baudRate}) {
	const p = new SerialPort(serialPort, {baudRate: baudRate});
	const c = new Client(new Port(p, false), true);
	await c.init();
	return c;
}