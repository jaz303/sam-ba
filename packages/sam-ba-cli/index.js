const {
    Client,
    Flasher,
    UsageError,
    debug
} = require('@jaz303/sam-ba');

const createTransport = require('@jaz303/sam-ba-transport-serialport');
const SerialPort = require('serialport');
const printf = require('printf');

//
// CLI Actions

exports.info = async (options) => {
    const client = await open(options);
    const device = client.device;

    const entries = [
        ['SAM-BA version',      'samBAVersion',     client.version],
        ['Device',              'device',           device.name],
        ['Family',              'family',           device.family],
        ['Flash address',       'flashAddress',     printf("0x%08X", device.flash.address)],
        ['Flash size',          'flashSize',        printf("%dKiB", device.flash.totalSize / 1024)],
        ['Flash size (bytes)',  'flashSizeBytes',   device.flash.totalSize],
        ['Page size (bytes)',   'pageSizeBytes',    device.flash.pageSize],
        ['Page count',          'pageCount',        device.flash.pageCount],
        ['Plane count',         'planeCount',       device.flash.planeCount],
        ['Lock region count',   'lockRegionCount',  device.flash.lockRegionCount]
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

    if (options.args.length !== 1) {
        throw new UsageError("read <file>");
    }

    let address = options.address;
    if (address === null) {
        address = 0;
    }

    let targetBuffer = null;
    if (options.length !== null) {
        targetBuffer = Buffer.alloc(options.length);
    }

    flasher.on('start', (evt) => {
        console.log("Reading %d bytes (%d pages) from %s",
            evt.length,
            evt.pageCount,
            printf("0x%08X", evt.address)
        );
    });

    flasher.on('pageread:start', ({page}) => {
        console.log("Reading page %d...", page);
    });

    const outputBuffer = await flasher.readToBuffer(address, targetBuffer);

    require('fs').writeFileSync(options.args[0], outputBuffer);
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

    flasher.on('start', (evt) => {
        console.log("Writing %d bytes (%d pages) to %s",
            evt.length,
            evt.pageCount,
            printf("0x%08X", evt.address)
        );
    });

    flasher.on('pagewrite:start', ({page}) => {
        console.log("Writing page %d...", page);
    });

    await flasher.write(address, data);

    if (debug.enabled)
        debug.info("Flash write complete");
    
    if (options.reset) {
        if (debug.enabled)
            debug.info("Resetting...");
        await device.reset();
    }
}

exports.erase = async (options) => {
    const client = await open(options);
    const flasher = new Flasher(client, client.device);

    const address = options.address;
    if (typeof address !== 'number') {
        throw new Error("Start address must be specified when erasing");
    }

    await flasher.erase(address);

    if (debug.enabled)
        debug.info("Erase complete");

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
    if (typeof serialPort !== 'string') {
        throw new Error("Serial port must be specified with -p/--port");
    }
    const p = new SerialPort(serialPort, {baudRate: baudRate});
    const t = createTransport(p, false);
    const c = new Client(t);
    await c.init();
    return c;
}