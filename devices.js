const SAM_C_FLASH = {
	'x18': {
		pageCount: 4096,
		pageSize: 64
	},
	'x17': {
		pageCount: 2048,
		pageSize: 64
	},
	'x16': {
		pageCount: 1024,
		pageSize: 64
	},
	'x15': {
		pageCount: 512,
		pageSize: 64
	}
}

module.exports = {
	ATSAMC20J18A: {
		id: '0x11000400',
		flash: SAM_C_FLASH.x18
	}
};