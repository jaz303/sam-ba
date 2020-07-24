const { FAMILIES, DEVICES } = require('./devices');
const { info, warn, error } = require('./debug');
const createFlash = require('./flash');

const printf = require('printf');
const debug = require('./debug');

class Device {
    constructor(client, family, name, flash) {
        this.name = name;
        this.family = family;
        this.flash = flash;

        this._client = client;
        this._reset = FAMILIES[this.family].reset;
    }

    reset() {
        return this._reset(this._client);
    }
}

exports.getDevice = async function(client) {
    let chipID = 0, cpuID = 0, extChipID = 0, deviceID = 0;

    // All devices support addresss 0 as the ARM reset vector so if the vector is
    // a ARM7TDMI branch, then assume we have an Atmel SAM7/9 CHIPID register
    if (((await client.readWord(0x0)) & 0xff000000) === 0xea000000) {
        chipID = await client.readWord(0xfffff240);
    } else {

        // Next try the ARM CPUID register since all Cortex-M devices support it
        cpuID = (await client.readWord(0xe000ed00)) & 0x0000fff0;
        
        // Cortex-M0+
        if (cpuID === 0xC600) {
            
            // These should support the ARM device ID register
            deviceID = await client.readWord(0x41002018);
        
        // Cortex M4
        } else if (cpuID === 0xC240) {
            
            // SAM4 processors have a reset vector to the SAM-BA ROM
            if (((await client.readWord(0x4)) & 0xfff00000) === 0x800000) {
                [chipID, extChipID] = await readChipID(client, chipID, extChipID);

            // Else we should have a device that supports the ARM device ID register
            } else {
                deviceID = await client.readWord(0x41002018);
            
            }
        
        // For all other Cortex versions try the Atmel chip ID registers
        } else {
            [chipID, extChipID] = await readChipID(client, chipID, extChipID);
        }

    }

    if (debug.enabled)
        debug.info("Read ID: chip=0x%s cpu=0x%s device=0x%s",
            printf("%08X", chipID),
            printf("%08X", cpuID),
            printf("%08X", deviceID)
        );

    let spec;
    const tmp = chipID & 0x7fffffe0;
    if (tmp) {
        // TODO: implement lookup by chip ID
    } else {
        spec = DEVICES[printf("0x%08x", deviceID & 0xffff00ff)];
    }

    if (!spec) {
        throw new Error("Unsupported device ID: " + deviceID);
    }

    const [family, deviceName, flashType, flashArgs] = spec;

    if (debug.enabled) {
        debug.info("Family: %s", family);
        debug.info("Device: %s", deviceName);
    }

    return new Device(
        client,
        family,
        deviceName,
        createFlash[flashType](client, flashArgs)
    );
}

async function readChipID(client, chipID, extChipID) {
    let cid = await client.readWord(0x400e0740);
    if (cid !== 0) {
        return [cid, await client.readWord(0x400e0744)];
    }

    cid = await client.readWord(0x400e0940);
    if (cid !== 0) {
        return [cid, await client.readWord(0x400e0944)];
    }
    
    return [0, extChipID];
}
