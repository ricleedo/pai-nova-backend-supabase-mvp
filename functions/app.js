const serverless = require('serverless-http');
const app = require('../dist/server').default; // Import COMPILED Express app
module.exports.handler = serverless(app);
