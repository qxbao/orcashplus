const app = require('express')();
const http_server = require('http').createServer(app);
const io = require('socket.io')(http_server);
require('./p2p.cjs').ioHandler(io);

module.exports = { io, http_server, app }