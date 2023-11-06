const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors');

app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const messages = [];

io.on('connection', (socket) => {
    console.log(socket.id);

    socket.on('chat message', (msg) => {
        messages.push(msg);
        io.emit('chat message', msg);
      });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });

})

server.listen(3000, () => {
  console.log('listening on *:3000');
});
