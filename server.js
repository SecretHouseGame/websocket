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
  socket.on("private message", (username, toUserId, fromUserId, message, partyId) => {
    socket.broadcast.emit(toUserId, {username: username, message: message, toUserId: toUserId, fromUserId: fromUserId});
  });

  socket.on('disconnect', function (message, username) {
    users.forEach(function (user) {
      if (user.client === socket.client.id) {
        socket.broadcast.emit('message', {message: user.username + ' is disconnected '});

        for (let i=0; i < users.length; i++) {
          if (users[i] === user) {
            users.splice(i, 1);
            break;
          }
        }

      }
    })
    socket.broadcast.emit(socket.id, {message: username + ' is disconnected '});
  });

  socket.on('event', function (username, toUserId, fromUserId, message, partyId) {
    console.log(username, toUserId, fromUserId, message, partyId);
    message = ent.encode(message);
    users.push({username, fromUserId});
    let type = 'event';

    socket.broadcast.emit('message_' + partyId,{username, toUserId, fromUserId, message, partyId, type});
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('tab-general', function (username, toUserId, fromUserId, message, partyId) {
    message = ent.encode(message);
    users.push({username, fromUserId});

    console.log(username, toUserId, fromUserId, message, partyId);

    socket.broadcast.emit('message_' + partyId,{username, toUserId, fromUserId, message, partyId, type: 'message'});
  });
});

httpServer.listen(3000);
