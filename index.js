const SerialPort = require('serialport');

const {Port} = require('./src/Port');
const {Client} = require('./src/Client');

const port = new Port(new SerialPort("/dev/cu.usbserial-FT4MFJFF1", {baudRate: 115200}), false);
const client = new Client(port, true);

const {C2xUserRow} = require('./src/flash/C2xD2x/C2xUserRow');
const {FlashOptions} = require('./src/flash/FlashOptions');

const {Flasher} = require('./src/Flasher');

const delay = (ms) => new Promise((y,n) => setTimeout(y, ms));

(async () => {
    try {
        await client.init();
		const device = await client.device();
        
        await device.flash.init();

        const flasher = new Flasher(client, device);
        flasher.on('start', (evt) => {
            console.log("start: " + JSON.stringify(evt));
        });

        flasher.on('progress', (evt) => {
            console.log("progress: " + JSON.stringify(evt));
        });

        flasher.on('pageread:end', (evt) => {
            console.log("page read: " + JSON.stringify(evt));
        });

        flasher.on('end', (evt) => {
            console.log("end: " + JSON.stringify(evt));
        });

        const prog = require('fs').readFileSync('2.bin');
        
        let target = 8192 / 64;
        let src = prog;
        const pageBuffer = Buffer.alloc(64);
        while (src.length) {
            const bytesToCopy = Math.min(src.length, 64);
            pageBuffer.fill(0);
            src.copy(pageBuffer, 0, 0, bytesToCopy);
            await device.flash.loadBuffer(pageBuffer);
            await device.flash.writePage(target);
            src = src.slice(bytesToCopy);
            target++;
        }

        await device.reset();










        // const pages = 32;
        // const firstPage = 4096 - pages;
        // const offset = 13;

        // const pagesData = [];
        // for (let i = 0; i < pages; ++i) {
        //     const p = Buffer.alloc(64);
        //     p.fill((offset + i) & 0xFF);
        //     pagesData.push(p);
        // }

        // for (let i = 0; i < pagesData.length; ++i) {
        //     const p = firstPage + i;
        //     console.log("Loading page buffer %d", p);
        //     await device.flash.loadBuffer(pagesData[i]);
        //     console.log("writing page!");
        //     await device.flash.writePage(p);
        //     await delay(100);
        // }

        // const pageBuffer = Buffer.alloc(64);
        // for (let i = 0; i < pagesData.length; ++i) {
        //     const p = firstPage + i;
        //     const expect = (offset + i) & 0xFF;
        //     await device.flash.readPage(p, pageBuffer);
        //     for (let j = 0; j < pageBuffer.length; ++j) {
        //         if (pageBuffer[j] !== expect) {
        //             console.log("Page %d check failed! (%d != %d)", p, pageBuffer[j], expect);
        //             break;
        //         }
        //     }
        // }



        // const mem = Buffer.alloc(8 * 1024);
        // await flasher.read(0, mem);

        // require('fs').writeFileSync("dump.bin", mem);




        // const userRow = new C2xUserRow();
        // const userRowAddress = 0x804000;
        // const userRowBuffer = Buffer.alloc(userRow.size);
        // await client.read(userRowAddress, userRowBuffer);
        // userRow.reset(userRowBuffer);

        // const fo = new FlashOptions(16);

        // userRow.setBOD(false);
        // userRow.setBOR(false);

        // // userRow.update(fo);

        // console.log(userRow.getAll());




        // console.log("user row", ur.getSettings());

        
		// await device.reset();

        // console.log(device);

    } catch (err) {
        console.error(err);
    }
})();
