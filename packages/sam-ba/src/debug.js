module.exports = {
    enabled: false,
    info: (msg, ...args) => console.log("[I:sam-ba] " + msg, ...args),
    warn: (msg, ...args) => console.warn("[W:sam-ba] " + msg, ...args),
    error: (msg, ...args) => console.error("[E:sam-ba] " + msg, ...args)
};
