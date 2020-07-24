const {
    SAMC2x,
    SAMD2x
} = require('./');

const FLASH = {
    SAM_C_D: {
        x18: { pageCount: 4096, pageSize: 64, user: 0x20004000, stack: 0x20008000 },
        x17: { pageCount: 2048, pageSize: 64, user: 0x20002000, stack: 0x20004000 },
        x16: { pageCount: 1024, pageSize: 64, user: 0x20001000, stack: 0x20002000 },
        x15: { pageCount: 512,  pageSize: 64, user: 0x20000800, stack: 0x20001000 }    
    }
};

const DEVICES = exports.DEVICES = {

    // SAMC20

    ['0x11000000'](c) { return new SAMC2x(c, 'ATSAMC20J18A', FLASH.SAM_C_D.x18); },

    // SAMD21

    ['0x10010003'](c) { return new SAMD2x(c, 'ATSAMD21J15A', FLASH.SAM_C_D.x15); },
    ['0x10010008'](c) { return new SAMD2x(c, 'ATSAMD21G15A', FLASH.SAM_C_D.x15); },
    ['0x1001000d'](c) { return new SAMD2x(c, 'ATSAMD21E15A', FLASH.SAM_C_D.x15); },
    ['0x10010021'](c) { return new SAMD2x(c, 'ATSAMD21J15B', FLASH.SAM_C_D.x15); },
    ['0x10010024'](c) { return new SAMD2x(c, 'ATSAMD21G15B', FLASH.SAM_C_D.x15); },
    ['0x10010027'](c) { return new SAMD2x(c, 'ATSAMD21E15B', FLASH.SAM_C_D.x15); },
    ['0x10010056'](c) { return new SAMD2x(c, 'ATSAMD21E15B-WLCSP', FLASH.SAM_C_D.x15); },
    ['0x10010063'](c) { return new SAMD2x(c, 'ATSAMD21E15C-WLCSP', FLASH.SAM_C_D.x15); },

    ['0x10010002'](c) { return new SAMD2x(c, 'ATSAMD21J16A', FLASH.SAM_C_D.x16); },
    ['0x10010007'](c) { return new SAMD2x(c, 'ATSAMD21G16A', FLASH.SAM_C_D.x16); },
    ['0x1001000c'](c) { return new SAMD2x(c, 'ATSAMD21E16A', FLASH.SAM_C_D.x16); },
    ['0x10010020'](c) { return new SAMD2x(c, 'ATSAMD21J16B', FLASH.SAM_C_D.x16); },
    ['0x10010023'](c) { return new SAMD2x(c, 'ATSAMD21G16B', FLASH.SAM_C_D.x16); },
    ['0x10010026'](c) { return new SAMD2x(c, 'ATSAMD21E16B', FLASH.SAM_C_D.x16); },
    ['0x10010055'](c) { return new SAMD2x(c, 'ATSAMD21E16B-WLCSP', FLASH.SAM_C_D.x16); },
    ['0x10010062'](c) { return new SAMD2x(c, 'ATSAMD21E16C-WLCSP', FLASH.SAM_C_D.x16); },

    ['0x10010001'](c) { return new SAMD2x(c, 'ATSAMD21J17A', FLASH.SAM_C_D.x17); },
    ['0x10010006'](c) { return new SAMD2x(c, 'ATSAMD21G17A', FLASH.SAM_C_D.x17); },
    ['0x1001000b'](c) { return new SAMD2x(c, 'ATSAMD21E17A', FLASH.SAM_C_D.x17); },
    ['0x10010010'](c) { return new SAMD2x(c, 'ATSAMD21G17A-WLCSP', FLASH.SAM_C_D.x17); },

    ['0x10010000'](c) { return new SAMD2x(c, 'ATSAMD21J18A', FLASH.SAM_C_D.x18); },
    ['0x10010005'](c) { return new SAMD2x(c, 'ATSAMD21G18A', FLASH.SAM_C_D.x18); },
    ['0x1001000a'](c) { return new SAMD2x(c, 'ATSAMD21E18A', FLASH.SAM_C_D.x18); },
    ['0x1001000f'](c) { return new SAMD2x(c, 'ATSAMD21G18A-WLCSP', FLASH.SAM_C_D.x18); },

}

// const RESETS = [
//     (c) => c.writeWord(0xE000ED0C, 0x05FA0004),
//     (c) => c.writeWord(0x400E1A00, 0xA500000D),
//     (c) => c.writeWord(0x400E1200, 0xA500000D),
//     (c) => c.writeWord(0x400E1400, 0xA500000D),
//     (c) => c.writeWord(0x400E1800, 0xA500000D),
//     (c) => c.writeWord(0xFFFFFD00, 0xA500000D)
// ];

// const FAMILIES = exports.FAMILIES = {

//     SAMC20: { reset: RESETS[0] },
//     SAMC21: { reset: RESETS[0] },
//     SAMD21: { reset: RESETS[0] },
//     SAMR21: { reset: RESETS[0] },
//     SAML21: { reset: RESETS[0] },
//     SAMD51: { reset: RESETS[0] },
//     SAME51: { reset: RESETS[0] },
//     SAME53: { reset: RESETS[0] },
//     SAME54: { reset: RESETS[0] },
//     SAME70: { reset: RESETS[0] },
//     SAMS70: { reset: RESETS[0] },
//     SAMV70: { reset: RESETS[0] },
//     SAMV71: { reset: RESETS[0] },

//     SAM3X: { reset: RESETS[1] },
//     SAM3S: { reset: RESETS[1] },
//     SAM3A: { reset: RESETS[1] },

//     SAM3U: { reset: RESETS[2] },

//     SAM3N: { reset: RESETS[3] },
//     SAM4S: { reset: RESETS[3] },

//     SAM4E: { reset: RESETS[4] },

//     SAM7S:  { reset: RESETS[5] },
//     SAM7SE: { reset: RESETS[5] },
//     SAM7X:  { reset: RESETS[5] },
//     SAM7XC: { reset: RESETS[5] },
//     SAM7L:  { reset: RESETS[5] },
//     SAM9XE: { reset: RESETS[5] },

// };