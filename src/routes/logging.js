
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

var generateLogEntriesOnStart = false;
if (process.env.LOGGING_GENERATE_ALWAYS === 'true')
{
    generateLogEntriesOnStart = true;
}

var addTimeToLogEntry = true;
if (process.env.LOGGING_ADD_TIME_TO_LOG_ENTRY === 'false')
{
    addTimeToLogEntry = false;
}


var lastLogRetrievedTimestamp = "";
var totalLogRetrievals = 0;
var logEntriesGenerated = 0;
var errorLogEntriesGenerated = 0;
var loggingStarted = false;
var loggingStartedTimestamp = null;
var errorLoggingStarted = false;
var errorLoggingStartedTimestamp = null;
let hostName = process.env.HOSTNAME || "NODEJS_SAMPLE";

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
    //if logging enabled, call this function again
    if (loggingStarted == true) {
        //print log entries
        var entry = randomValue(logMessages);

        logEntriesGenerated = logEntriesGenerated + 1;
        if (addTimeToLogEntry == true)
        {
            var now = new Date().toISOString()
            console.log(`${now}: ${entry}`);
        }
        else
        {
            console.log(`${entry}`);
        }
        var timeoutValue = Utils.getRndInteger(900, 3500);
        setTimeout(generateLogEntries, timeoutValue);
    }

}

function generateErrorLogEntries()
{
    if (errorLoggingStarted == true) {
        //send log entries to logDNA
        var entry = randomValue(errorMessages);

        errorLogEntriesGenerated = errorLogEntriesGenerated + 1;
        if (addTimeToLogEntry == true)
        {
            var now = new Date().toISOString()
            console.log(`${now}: ERROR ${entry}`);
        }
        else
        {
            console.log(`ERROR ${entry}`);

        }

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
Prints log/error entries to system.out.
</p>
<p>
Host name: ${hostName}
</p>
<p>
Logging started: ${loggingStarted} ${timeStartedString}<br/>
Log entries generated: ${logEntriesGenerated}<br/>
Error logging started: ${errorLoggingStarted} ${errorTimeStartedString}<br/>
Error Log entries generated: ${errorLogEntriesGenerated}<br/>
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