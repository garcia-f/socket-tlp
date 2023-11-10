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
const usuarioEscribiendo = {}; // Almacenamiento de usuarios escribiendo

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// Eventos de conexión y desconexión
io.on('connection', (socket) => {
  console.log(socket.id); // Muestra el ID del socket conectado en la consola del servidor

  socket.on('nuevo-usuario', (username) => {
    users[socket.id] = username;
    const userJoinedMessage = `${username}: Se ha unido al chat `;
    messages.push(userJoinedMessage); // Agrega el mensaje de unión al array de mensajes
    socket.broadcast.emit('mensaje-chat', userJoinedMessage); // Envía el mensaje de unión a todos los clientes conectados
  });


  // Evento para el envío y recepción de mensajes de chat
  socket.on('mensaje-chat', (msg) => {
    const username = users[socket.id] || 'Anónimo'; // Obtener el nombre de usuario o establecerlo como "Anónimo" si no existe
    const messageWithUsername = `${username}: ${msg}`;
    messages.push(messageWithUsername); // Almacena el mensaje en el array de mensajes
    io.emit('mensaje-chat', messageWithUsername); // Envía el mensaje a todos los clientes conectados
    console.log(messages); // Muestra todos los mensajes almacenados en la consola del servidor
  });

  // Envía los mensajes almacenados al cliente cuando se conecta
  socket.emit('carga-mensajes-viejos', messages);





  // Evento para manejar cuando un usuario comienza a escribir
  socket.on('escribiendo', () => {
    usuarioEscribiendo[socket.id] = users[socket.id];
    socket.broadcast.emit('escribiendo', usuarioEscribiendo);
  });

  // Evento para manejar cuando un usuario deja de escribir
  socket.on('parar-escribir', () => {
    delete usuarioEscribiendo[socket.id];
    io.emit('escribiendo', usuarioEscribiendo);
  });




  // Evento de desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado', socket.id); // Muestra que un usuario se desconectó en la consola del servidor, junto con su ID de socket
    const disconnectedUser = users[socket.id];
    if (disconnectedUser) {
      delete users[socket.id]; // Eliminar al usuario del almacenamiento al desconectarse
      delete usuarioEscribiendo[socket.id]; // Eliminar al usuario de los usuarios escribiendo al desconectarse
      const disconnectedMessage = `${disconnectedUser}: Se ha desconectado`;
      messages.push(disconnectedMessage); // Agrega el mensaje de desconexión al array de mensajes
      io.emit('mensaje-chat', disconnectedMessage); // Envía el mensaje de desconexión a todos los clientes conectados
      io.emit('escribiendo', usuarioEscribiendo); // Actualiza el estado de usuarios escribiendo para todos los clientes
    }
  });
});

// Inicia el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor en el puerto 3000');
});