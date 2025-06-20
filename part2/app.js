const express = require('express');
const path = require('path');
require('dotenv').config();

const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Session setup (before routes)
app.use(session({
  secret: 'walk-the-dog-secret', // 🔐 use .env for production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true only if using HTTPS
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;