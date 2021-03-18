//------------------------------------------------------------------------------
// node.js  application 
//------------------------------------------------------------------------------


// This application uses express as its web server
// for more info, see: http://expressjs.com
import express from 'express';
import {debug,log} from './utils/logger.js';
import {Data} from './utils/data.js'

// catch SIGINT and SIGTERM and exit
// Using a single function to handle multiple signals
function handle(signal) {
    log(`Received ${signal}. Exiting...`);
    process.exit(1)
  }  
//SIGINT is typically CTRL-C
process.on('SIGINT', handle);
//SIGTERM is sent to terminate process, for example docker stop sends SIGTERM
process.on('SIGTERM', handle);

//init variables
var appName = process.env.APP_NAME || "nodejs-sample";
Data.setState ({ appName: appName }) 
Data.setState ({ rootRequests: 0 }) 
Data.setState ({ testRequests: 0 }) 
Data.setState ({ calculatePiRequests: 0 }) 

var serverPort = 8080;

//read build time from txt file
import fs from 'fs';
try {
    var data = fs.readFileSync('buildtime.txt', 'utf8');
    Data.setState ({ buildTime: data }) 
} 
catch(e) {
    //ignore any errors while reading file, it's not so important
    Data.setState ({ buildTime: "N/A" }) 
}

// create a new express server
var app = express();

//request logger
import {router as requestLogger} from './routes/requestLogger.js';
app.use(requestLogger);

import {router as index} from './routes/index.js';
app.use('/', index);

import {router as health} from './routes/health.js';
app.use('/health', health);

import {router as metrics} from './routes/metrics.js';
app.use('/metrics', metrics);

import {router as test} from './routes/test.js';
app.use('/test', test);

import {router as hangserver} from './routes/hangServer.js';
app.use('/hangserver', hangserver);

import {router as consumememory} from './routes/consumeMemory.js';
app.use('/consumememory', consumememory);

import {router as calculatepi} from './routes/calculatePi.js';
app.use('/calculatepi', calculatepi);

import {router as killserver} from './routes/killServer.js';
app.use('/killserver', killserver);

import {router as endpoints} from './routes/endpoints.js';
app.use('/endpoints', endpoints);

app.server = null;
app.server = app.listen(serverPort, "0.0.0.0", function() {
    let host = app.server.address().address;
    let port = app.server.address().port;
    log('Server started and listening http://'+host+':'+port)
});

app.server.on('connection', function(socket) {
    debug(`new connection, remote address: ${socket.remoteAddress}`);
});
