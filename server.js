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
  // socket.on("private message", (anotherSocketId, msg) => {
  //   socket.to(anotherSocketId).emit("private message", socket.id, msg);
  // });

  socket.on(socket.id, function (username, discussionId, message) {
    socket.broadcast.emit(socket.id, {username, discussionId, message});
  });

  socket.on('disconnect', function (message, username, discussion_id) {
    socket.broadcast.emit('message', {message: username + ' is disconnected '});
    socket.broadcast.emit(socket.id, {message: username + ' is disconnected '});
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('lobby', function (username, userId, message) {
    message = ent.encode(message);
    const discussionId = socket.id;
    users.push({username, discussionId});
    socket.broadcast.emit('message', {username, discussionId, message});
  });
});

httpServer.listen(3000);
