const SerialPort = require('serialport');
const devices = require('./devices');

const {Port} = require('./src/Port');
const {Client} = require('./src/Client');

const port = new Port(new SerialPort("/dev/cu.usbserial-FT4MFJFF1", {baudRate: 115200}), false);
const client = new Client(port, true);

(async () => {
	try {
		await client.init();
	} catch (err) {
		console.error(err);
	}
})();
