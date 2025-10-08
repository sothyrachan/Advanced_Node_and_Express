'use strict';
require('dotenv').config();
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
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');

const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, "views"),   // Pug templates
  path.join(__dirname, "public")   // Static files (CSS, JS)
]);

// 🔁 Trigger refresh when livereload connects
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
}))


myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true
    });
  });

  app.route('/login').post(passport.authenticate('local', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/profile');
  });

  app
   .route('/profile')
   .get(ensureAuthenticated, (req,res) => {
      res.render('profile', {username: req.user.username});
   });

  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
  });

  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));

  // Serialization and deserialization
  passport.serializeUser((user, done) => {  
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
