const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors');
const path = require('path');

app.use(cors());

// Almacenamiento de mensajes
const messages = [];
const users = {}; // Almacenamiento de nombres de usuario
const typingUsers = {}; // Almacenamiento de usuarios escribiendo

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index.html'));
});

// Eventos de conexión y desconexión
io.on('connection', (socket) => {
  console.log(socket.id); // Muestra el ID del socket conectado en la consola del servidor

  // Evento para registrar un nuevo usuario
  socket.on('new user', (username) => {
    users[socket.id] = username;
  });

  // Evento para manejar cuando un usuario comienza a escribir
  socket.on('typing', () => {
    typingUsers[socket.id] = users[socket.id];
    io.emit('typing', typingUsers);
  });

  // Evento para manejar cuando un usuario deja de escribir
  socket.on('stop typing', () => {
    delete typingUsers[socket.id];
    io.emit('typing', typingUsers);
  });

  // Envía los mensajes almacenados al cliente cuando se conecta
  socket.emit('load old msgs', messages);

  // Evento para el envío y recepción de mensajes de chat
  socket.on('chat message', (msg) => {
    const username = users[socket.id] || 'Anónimo'; // Obtener el nombre de usuario o establecerlo como "Anónimo" si no existe
    const messageWithUsername = `${username}: ${msg}`;
    messages.push(messageWithUsername); // Almacena el mensaje en el array de mensajes
    io.emit('chat message', messageWithUsername); // Envía el mensaje a todos los clientes conectados
    console.log(messages); // Muestra todos los mensajes almacenados en la consola del servidor
  });

  // Evento de desconexión
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id); // Muestra que un usuario se desconectó en la consola del servidor, junto con su ID de socket
    const disconnectedUser = users[socket.id];
    if (disconnectedUser) {
        delete users[socket.id]; // Eliminar al usuario del almacenamiento al desconectarse
        delete typingUsers[socket.id]; // Eliminar al usuario de los usuarios escribiendo al desconectarse
        const disconnectedMessage = `${disconnectedUser} se ha desconectado - ${new Date().toLocaleString()}`;
        messages.push(disconnectedMessage); // Agrega el mensaje de desconexión al array de mensajes
        io.emit('chat message', disconnectedMessage); // Envía el mensaje de desconexión a todos los clientes conectados
        io.emit('typing', typingUsers); // Actualiza el estado de usuarios escribiendo para todos los clientes
    }
});
});

// Inicia el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('listening on *:3000');
});