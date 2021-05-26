//------------------------------------------------------------------------------
// node.js  application 
//------------------------------------------------------------------------------

// enable install locally, without docker
// execute: npm install --save @instana/collector
// uncomment following two lines
//import instana from '@instana/collector';
//instana();// You need to call the exported function *immediately*, before importing anything else.


// This application uses express as its web server
// for more info, see: http://expressjs.com
import express from 'express';
import {debug,log,trace} from './utils/logger.js';
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
Data.setState ({ appName: appName });
Data.setState ({ rootRequests: 0 });
Data.setState ({ testRequests: 0 });
Data.setState ({ calculatePiRequests: 0 });
Data.setState ({ endpointlinks: null });

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

//set log entry data variable
Data.setState ({ logEntries: [] }) ;

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

import {router as disruptserver} from './routes/disrupt.js';
app.use('/disrupt', disruptserver);

import {router as consumememory} from './routes/consumeMemory.js';
app.use('/consumememory', consumememory);

import {router as consumecpu} from './routes/consumeCPU.js';
app.use('/consumecpu', consumecpu);

import {router as calculatepi} from './routes/calculatePi.js';
app.use('/calculatepi', calculatepi);

import {router as env} from './routes/environment.js';
app.use('/env', env);

import {router as systeminfo} from './routes/systemInfo.js';
app.use('/systeminfo', systeminfo);

import {router as error} from './routes/error.js';
app.use('/error', error);

import {router as notfound} from './routes/notfound.js';
app.use('/notfound', notfound);

import {router as instanaintegration} from './routes/instana.js';
app.use('/instana', instanaintegration);

import {router as file} from './routes/file.js';
app.use('/file', file);

import {router as logging} from './routes/logging.js';
app.use('/logging', logging);

import {router as endpoints} from './routes/endpoints.js';
app.use('/endpoints', endpoints);

app.server = null;
app.server = app.listen(serverPort, "0.0.0.0", function() {
    let host = app.server.address().address;
    let port = app.server.address().port;
    log('Server started and listening http://'+host+':'+port)
});


app.server.on('connection', function(socket) {
    trace(`new connection, remote address: ${socket.remoteAddress}`);
});

