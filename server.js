'use strict';

require('dotenv').config();
require('socket.io');

const routes = require('./routes.js');
const auths = require('./auth.js')

const express = require('express');
const helmet = require('helmet');
const myDB = require('./connection');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const app = express();
const cors = require('cors');
const session = require('express-session');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views"),   // Pug templates
  path.join(__dirname, "public")   // Static files (CSS, JS)
]);

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 50);
});

// 2. Inject the LiveReload script into the HTML
app.use(connectLivereload());

app.use(helmet());
app.use(cors());
app.set('view engine', 'pug');
app.set('views', './views/pug');
fccTesting(app); // For fCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}));

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  routes(app, myDataBase);
  auths(app, myDataBase);

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
