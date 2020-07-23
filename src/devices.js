const FLASH = exports.FLASH = {
    SAM_C_D: {
        x18: { pageCount: 4096, pageSize: 64, user: 0x20004000, stack: 0x20008000 },
        x17: { pageCount: 2048, pageSize: 64, user: 0x20002000, stack: 0x20004000 },
        x16: { pageCount: 1024, pageSize: 64, user: 0x20001000, stack: 0x20002000 },
        x15: { pageCount: 512,  pageSize: 64, user: 0x20000800, stack: 0x20001000 }    
    }
};

const RESETS = [
    (c) => c.writeWord(0xE000ED0C, 0x05FA0004),
    (c) => c.writeWord(0x400E1A00, 0xA500000D),
    (c) => c.writeWord(0x400E1200, 0xA500000D),
    (c) => c.writeWord(0x400E1400, 0xA500000D),
    (c) => c.writeWord(0x400E1800, 0xA500000D),
    (c) => c.writeWord(0xFFFFFD00, 0xA500000D)
];

const FAMILIES = exports.FAMILIES = {

    SAMC20: { reset: RESETS[0] },
    SAMC21: { reset: RESETS[0] },
    SAMD21: { reset: RESETS[0] },
    SAMR21: { reset: RESETS[0] },
    SAML21: { reset: RESETS[0] },
    SAMD51: { reset: RESETS[0] },
    SAME51: { reset: RESETS[0] },
    SAME53: { reset: RESETS[0] },
    SAME54: { reset: RESETS[0] },
    SAME70: { reset: RESETS[0] },
    SAMS70: { reset: RESETS[0] },
    SAMV70: { reset: RESETS[0] },
    SAMV71: { reset: RESETS[0] },

    SAM3X: { reset: RESETS[1] },
    SAM3S: { reset: RESETS[1] },
    SAM3A: { reset: RESETS[1] },

    SAM3U: { reset: RESETS[2] },

    SAM3N: { reset: RESETS[3] },
    SAM4S: { reset: RESETS[3] },

    SAM4E: { reset: RESETS[4] },

    SAM7S:  { reset: RESETS[5] },
    SAM7SE: { reset: RESETS[5] },
    SAM7X:  { reset: RESETS[5] },
    SAM7XC: { reset: RESETS[5] },
    SAM7L:  { reset: RESETS[5] },
    SAM9XE: { reset: RESETS[5] },

};

const DEVICES = exports.DEVICES = {

    // SAMC20

    '0x11000000': ['SAMC20', 'ATSAMC20J18A', 'C2xNVM', FLASH.SAM_C_D.x18],

    // SAMD21

    '0x10010003': ['SAMD21', 'ATSAMD21J15A', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010008': ['SAMD21', 'ATSAMD21G15A', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x1001000d': ['SAMD21', 'ATSAMD21E15A', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010021': ['SAMD21', 'ATSAMD21J15B', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010024': ['SAMD21', 'ATSAMD21G15B', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010027': ['SAMD21', 'ATSAMD21E15B', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010056': ['SAMD21', 'ATSAMD21E15B-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x15],
    '0x10010063': ['SAMD21', 'ATSAMD21E15C-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x15],

    '0x10010002': ['SAMD21', 'ATSAMD21J16A', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010007': ['SAMD21', 'ATSAMD21G16A', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x1001000c': ['SAMD21', 'ATSAMD21E16A', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010020': ['SAMD21', 'ATSAMD21J16B', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010023': ['SAMD21', 'ATSAMD21G16B', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010026': ['SAMD21', 'ATSAMD21E16B', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010055': ['SAMD21', 'ATSAMD21E16B-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x16],
    '0x10010062': ['SAMD21', 'ATSAMD21E16C-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x16],

    '0x10010001': ['SAMD21', 'ATSAMD21J17A', 'D2xNVM', FLASH.SAM_C_D.x17],
    '0x10010006': ['SAMD21', 'ATSAMD21G17A', 'D2xNVM', FLASH.SAM_C_D.x17],
    '0x1001000b': ['SAMD21', 'ATSAMD21E17A', 'D2xNVM', FLASH.SAM_C_D.x17],
    '0x10010010': ['SAMD21', 'ATSAMD21G17A-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x17],

    '0x10010000': ['SAMD21', 'ATSAMD21J18A', 'D2xNVM', FLASH.SAM_C_D.x18],
    '0x10010005': ['SAMD21', 'ATSAMD21G18A', 'D2xNVM', FLASH.SAM_C_D.x18],
    '0x1001000a': ['SAMD21', 'ATSAMD21E18A', 'D2xNVM', FLASH.SAM_C_D.x18],
    '0x1001000f': ['SAMD21', 'ATSAMD21G18A-WLCSP', 'D2xNVM', FLASH.SAM_C_D.x18],

}