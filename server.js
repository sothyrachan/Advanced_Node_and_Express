// Server.js

"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const myDB = require("./connection");
const routes = require("./routes.js");
const auths = require("./auth.js");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

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

fccTesting(app); // ffc test runner

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
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

    socket.on("disconnect", () => {
      currentUsers--;
      io.emit("user count", currentUsers);
      console.log("User disconnected. Total:", currentUsers);
    });
  });
}).catch((e) => {
  app.route("/").get((_req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening at http://0.0.0.0:${PORT}`);
});
