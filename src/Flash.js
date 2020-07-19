exports.D2xNvmFlash = (client, {pageCount, pageSize, user, stack}) => {
    return ["FLASH"];
}

exports.C2xNvmFlash = exports.D2xNvmFlash;

// exports.Flash = class Flash {
//     constructor(samba, name, addr, pages, size, planes, lockRegions, user, stack) {
//         this.name = name;
//         this.addr = addr;
//         this.pages = pages;
//         this.size = size;
//         this.planes = planes;
//         this.lockRegions = lockRegions;
//         this.user = user;
//         this.stack = stack;
//     }
// }