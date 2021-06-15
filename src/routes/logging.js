
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

const generateLogEntriesOnStart = process.env.LOGGING_GENERATE_ALWAYS ? true : false;


var logEntriesArray = [];
var lastLogRetrievedTimestamp = "";
var totalLogRetrievals = 0;
var logEntriesGenerated = 0;
var errorLogEntriesGenerated = 0;
var loggingStarted = false;
var loggingStartedTimestamp = null;
var errorLoggingStarted = false;
var errorLoggingStartedTimestamp = null;
let hostName = process.env.HOSTNAME || "NODEJS_SAMPLE";
var appName = process.env.APP_NAME || "nodejs-sample";

if (generateLogEntriesOnStart == true)
{
    loggingStarted = true;
    loggingStartedTimestamp = new Date().toISOString();
    setTimeout(generateLogEntries, 1);
}

let logMessages = ["Customer detail found.",
    "Ticket was purchased.",
    "Ticket was canceled.",
    "Seat was selected.",
    "Multiple tickets purchased.",
    "Credit card validation was successful.",
    "Credit card validation failed.",
    "Train was selected.",
    "Airplane was selected.",
    "Bus was selected.",
    "Car was selected.",
    "Transportation method not selected.",
    "Destination was selected.",
    "Destination does not exist.",
    "Destination out of range."
];

let errorMessages = [
    "OutOfMemoryError",
    "IOException",
    "NullPointerException",
    "UnexpectedUserBehaviourException"
];

const randomValue = (list) => {
    return list[Math.floor(Math.random() * list.length)];
};

function generateLogEntries()
{
    //generate log entries every 1 ..3 seconds
    //JSON format
    //if logging enabled, call this function again
    if (loggingStarted == true) {
        //send log entries to logDNA
        var entry = randomValue(logMessages);
        debug(`Message: "${entry}". Generating log JSON...`);
        var now = new Date();

        var logJSON = {
            _host: `${hostName}`,
            _line: `${entry}`,
            level: "INFO",
            _ts: now.getTime(),
            _app: `${appName}`
        };
        logEntriesArray.push(logJSON);
        logEntriesGenerated = logEntriesGenerated + 1;
        //console.log(logJSON);
        var timeoutValue = Utils.getRndInteger(900, 3500);
        setTimeout(generateLogEntries, timeoutValue);
    }

}

function generateErrorLogEntries()
{
    if (errorLoggingStarted == true) {
        //send log entries to logDNA
        var entry = randomValue(errorMessages);
        debug(`Message: "${entry}". Generating error log JSON...`);
        var now = new Date();

        var logJSON = {
            _host: `${hostName}`,
            _line: `${entry}`,
            level: "ERROR",
            _ts: now.getTime(),
            _app: `${appName}`
        };
        logEntriesArray.push(logJSON);
        errorLogEntriesGenerated = errorLogEntriesGenerated + 1;

        var timeoutValue = Utils.getRndInteger(1500, 8500);
        setTimeout(generateErrorLogEntries, timeoutValue);
    }

}

function getHTML() {
    var now = new Date().toISOString();

    var timeStartedString = loggingStartedTimestamp == null ? "" : `(${loggingStartedTimestamp})`
    var errorTimeStartedString = errorLoggingStartedTimestamp == null ? "" : `(${errorLoggingStartedTimestamp})`
    var html = `
<h2>Logging test</h2>
<p>
Logging started: ${loggingStarted} ${timeStartedString}<br/>
Log entries generated: ${logEntriesGenerated}<br/>
Error logging started: ${errorLoggingStarted} ${errorTimeStartedString}<br/>
Error Log entries generated: ${errorLogEntriesGenerated}<br/>
<br/>
Logs have been retrieved via /logentries ${totalLogRetrievals} times.<br/>
Last log retrieval:  ${lastLogRetrievedTimestamp}
</p>
<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("Logging test", html);
};

router.get('/', function (req, res) {
    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});

router.get('/logentries', function (req, res) {

    lastLogRetrievedTimestamp = new Date().toISOString();
    totalLogRetrievals = totalLogRetrievals + 1;

    res.json(logEntriesArray);
    logEntriesArray = [];

});

router.get('/start', function (req, res) {

    if (loggingStarted == false)
    {
        loggingStartedTimestamp = new Date().toISOString();
        loggingStarted = true;
        setTimeout(generateLogEntries, 1);

    }
    res.redirect(req.baseUrl);
});

router.get('/stop', function (req, res) {
    if (loggingStarted == true)
    {
        loggingStarted = false;
        loggingStartedTimestamp = null;
    }
    res.redirect(req.baseUrl);

});

router.get('/error/start', function (req, res) {
    if (errorLoggingStarted == false)
    {
        errorLoggingStartedTimestamp = new Date().toISOString();
        errorLoggingStarted = true;
        setTimeout(generateErrorLogEntries, 1);

    }
    res.redirect(req.baseUrl);
});

router.get('/error/stop', function (req, res) {
    if (errorLoggingStarted == true)
    {
        errorLoggingStartedTimestamp = null;
        errorLoggingStarted = false;
    }
    res.redirect(req.baseUrl);
});

export { router };