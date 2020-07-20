exports.BaseFlash = class BaseFlash {
	constructor(client, {address, pageCount, pageSize, planeCount, lockRegionCount, user, stack}) {
		this._client = client;

		this.address = address;
		this.pageCount = pageCount;
		this.pageSize = pageSize;
		this.planeCount = planeCount;
		this.lockRegionCount = lockRegionCount;
		this.user = user;
		this.stack = stack;

		this._onBufferA = true;
	}
}