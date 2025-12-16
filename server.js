// Server.js

"use strict";

require("dotenv").config();
require("passport.socketio");
require("connect-mongo");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const myDB = require("./connection");
const routes = require("./routes.js");
const auths = require("./auth.js");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const cookieParser = require("cookie-parser");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: "*",
  }),
);

app.set("view engine", "pug");
app.set("views", "./views/pug");

fccTesting(app);

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  routes(app, myDataBase);
  auths(app, myDataBase);

  let currentUsers = 0;

  io.on("connection", (socket) => {
    currentUsers++;
    io.emit("user count", currentUsers);
    console.log("User connected. Total:", currentUsers);
    console.log("user " + socket.request.user.username + " connected");

    socket.on("disconnect", () => {
      currentUsers--;
      io.emit("user count", currentUsers);
      console.log("User disconnected. Total:", currentUsers);
    });
  });

  io.use(
    passportSocketIo.authorize({
      cookirParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail,
    }),
  );

  io.emit("user", {
    username: socket.request.user.username,
    currentUsers,
    connected: true,
  });
}).catch((e) => {
  app.route("/").get((_req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

function onAuthorizeSuccess(_data, accept) {
  console.log("successful connection to socket.io");
  accept(null, true);
}

function onAuthorizeFail(_data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 5000;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening at http://0.0.0.0:${PORT}`);
});
