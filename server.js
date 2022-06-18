'use strict';
const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const app = express();
const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");
const ent = require('ent');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origins: ['http://localhost:4200']
  }
});

Sentry.init({
  dsn: "https://ac5eefb263564a459ed5fb089aceecd2@o1064146.ingest.sentry.io/6511891",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


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

  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });

  // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
  socket.on('tab-general', function (username, toUserId, fromUserId, message, partyId) {
    console.log(message);
    console.log(username);
    users.push({username, fromUserId});

    socket.broadcast.emit('message_' + partyId,{username, toUserId, fromUserId, message, partyId});
  });
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

httpServer.listen(3000);
