'use strict';

const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const app = express();
const ent = require('ent');
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */});
app.set('view engine', 'ejs');
const users = [];

app.get('/', (req, res) => {
  res.render('index');
})
app.get('/client', function (req, res) {
  res.sendFile(__dirname + "/client.js")
})

io.on("connection", (socket) => {
  // Private message
  socket.on("private message", (anotherSocketId, message) => {
    console.log(anotherSocketId);
    socket.to(anotherSocketId).emit("private message", message);
  });

  socket.on('disconnect', function (message, username, discussionId) {
    users.forEach(function (user, index) {
      if (user.client === socket.client.id) {
        socket.broadcast.emit('message', {message: user.username + ' is disconnected '});
        // TODO remove user in array
      }
    })
    socket.broadcast.emit(socket.id, {message: username + ' is disconnected '});
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('general', function (username, userId, message) {
    message = ent.encode(message);
    const discussionId = socket.id;
    const client = socket.client.id;
    users.push({username, client});
    socket.broadcast.emit('message', {username, discussionId, message, client});
  });
});

httpServer.listen(3000);
