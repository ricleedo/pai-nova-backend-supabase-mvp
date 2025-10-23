// netlify/functions/api.js
const serverless = require('serverless-http');
const app = require('../dist/server').default; // Adjust if your main compiled Express export differs
module.exports.handler = serverless(app);
