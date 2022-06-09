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
  socket.on("private message", (username, userId, message, partyId) => {
    console.log('userId : ' + userId);
    console.log('partyId : ' + partyId);
    console.log('username : ' + username);
    console.log('message : ' + message);
    console.log('                                           ');
    console.log(partyId + "_pm_" + userId);
    socket.to(partyId + "_pm_" + userId).emit(message);
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

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('tab-general', function (username, userId, message, partyId) {
    message = ent.encode(message);
    console.log('PartyId : ' + partyId);
    console.log('username : ' + username);
    console.log('userID : ' + userId);
    console.log('message : ' + message);
    console.log('                                           ');
    const client = socket.client.id;
    users.push({username, userId, client});
    socket.broadcast.emit('message_' + partyId,{username, userId, message, client});
  });
});

httpServer.listen(3000);
