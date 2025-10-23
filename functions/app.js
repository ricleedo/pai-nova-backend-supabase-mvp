const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Import your route handlers from src
const Routes = require('/src/server.ts'); // adjust path as needed

app.use('/api', Routes);

module.exports.handler = serverless(app);
