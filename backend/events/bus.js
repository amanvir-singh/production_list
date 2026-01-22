const { EventEmitter } = require("events");

const bus = new EventEmitter();
bus.setMaxListeners(15);

module.exports = bus;
