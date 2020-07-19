const SerialPort = require('serialport');

const {Port} = require('./src/Port');
const {Client} = require('./src/Client');

const port = new Port(new SerialPort("/dev/cu.usbserial-FT4MFJFF1", {baudRate: 115200}), false);
const client = new Client(port, true);

(async () => {
    try {
        await client.init();
		const device = await client.device();
        
        // console.log(device);

    } catch (err) {
        console.error(err);
    }
})();
