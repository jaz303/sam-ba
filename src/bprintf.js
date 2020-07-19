const printf = require('printf');

exports.bprintf = (fmt, ...args) => Buffer.from(printf(fmt, ...args));