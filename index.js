const SerialPort = require('serialport');

const {Port} = require('./src/Port');
const {Client} = require('./src/Client');

const port = new Port(new SerialPort("/dev/cu.usbserial-FT4MFJFF1", {baudRate: 115200}), false);
const client = new Client(port, true);

const {C2xUserRow} = require('./src/flash/C2xD2x/C2xUserRow');
const {FlashOptions} = require('./src/flash/FlashOptions');

(async () => {
    try {
        await client.init();
		const device = await client.device();

        const userRow = new C2xUserRow();
        const userRowAddress = 0x804000;
        const userRowBuffer = Buffer.alloc(userRow.size);
        await client.read(userRowAddress, userRowBuffer);
        userRow.reset(userRowBuffer);

        const fo = new FlashOptions(16);

        userRow.setBOD(false);
        userRow.setBOR(false);

        // userRow.update(fo);

        console.log(userRow.getAll());




        // console.log("user row", ur.getSettings());

        
		// await device.reset();

        // console.log(device);

    } catch (err) {
        console.error(err);
    }
})();
