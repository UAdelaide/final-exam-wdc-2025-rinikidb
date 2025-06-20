const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

const session = require('express-session');


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Export the app instead of listening here
module.exports = app;