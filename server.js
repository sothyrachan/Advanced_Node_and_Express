'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const app = express();
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');

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

  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login'
    });
  });

  // Serialization and deserialization here...
  done(null, user._id);
    passport.serializeUser((user, done) => {
  });

  passport.deserializeUser((id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(doc);
    });
  });

  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});


// app.route('/').get((req, res) => {
//   // Change the response to render the Pug template
//   res.render('index', {title: 'hello', message: 'Please log in'});
//   passport.initialize();
//   passport.session();
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
