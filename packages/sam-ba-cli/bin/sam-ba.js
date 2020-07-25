#!/usr/bin/env node

const cli = require('../');
const {UsageError, debug} = require('@jaz303/sam-ba');

const args = process.argv.slice(2);

const options = {
    action      : null,
    args        : [],
    logLevel    : 1,
    serialPort  : null,
    baudRate    : 115200,
    json        : false,
    address     : null,
    length      : null,
    reset       : false
};

while (hasNext()) {
    const arg = next();
    switch (arg) {
        case '--debug':
            debug.enabled = true;
            break;
        case '-p':
        case '--port':
            options.serialPort = next();
            break;
        case '-b':
        case '--baud':
            options.baudRate = parseInt(next(), 10);
            break;
        case '--json':
            options.json = true;
            break;
        case '-a':
        case '--address':
            options.address = parseNumber(next());
            break;
        case '-l':
        case '--length':
            options.length = parseNumber(next());
            break;
        case '--reset':
            options.reset = true;
            break;
        default:
            if (!options.action) {
                setAction(arg); 
            } else {
                options.args.push(arg);
            }
            break;
    }
}

if (!options.action) {
    throw new Error("No action set");
}

options.action(options).then(() => {
    process.exit(0);
}, (err) => {
    if (err instanceof UsageError) {
        console.error(`Usage: ${process.argv[0]} ${process.argv[1]} ${err.message}`);
    } else {
        console.error(err.message); 
    }
    process.exit(1);
});

function parseNumber(n) {
    if (n.startsWith('0x')) {
        return parseInt(n.substring(2), 16);
    } else {
        return parseInt(n, 10);
    }
}

function setAction(action) {
    options.action = cli[action];
    if (!options.action) {
        throw new Error("Unknown action: " + action);
    }
}

function hasNext() {
    return args.length > 0;
}

function next() {
    if (args.length === 0) {
        throw new Error();
    }
    return args.shift();
}
