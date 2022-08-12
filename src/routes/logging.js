
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
const fs = require('fs');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';
import { time } from 'systeminformation';

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

var jsonLogEntry = false;
if (process.env.LOGGING_LOG_ENTRY_IS_JSON === 'true')
{
    jsonLogEntry = true;
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


var logHistoryStartTime = null;
var logHistoryEndTime = null
var logEntryTimestamp = null;
var twodaysoflogsPrinted = false;
var twodaysoflogsInProgress = false;

//directory to hold files
var dataDir = fs.existsSync("/data") == true ? "/data" : fs.realpathSync(".");


function getLogEntry(isError = false, timestamp)
{
    var entry = "";

    if (isError == false)
    {
        entry = randomValue(logMessages);
    }
    else
    {
        entry = randomValue(errorMessages);
        entry = `ERROR ${entry}`;   
    }

    if (timestamp)
    {
        timestamp = new Date(timestamp);
    }
    else
    {
        timestamp = new Date();
    }
    
    if (jsonLogEntry == true)
    {
        var jsonEntry = {
            "time": timestamp.getTime(),
            "message": entry
        };
        entry = JSON.stringify(jsonEntry);
    
    }
    else
    {
        if (addTimeToLogEntry == true)
        {
            var ts = timestamp.toISOString();
            entry = `${ts}: ${entry}`;
        }    
    }

    return entry;
}

function print2DaysOfLogs()
{
    twodaysoflogsInProgress = true;
    var logEntriesArray = [];
    while (logEntryTimestamp < logHistoryEndTime)
    {
        var timeoutValue = Utils.getRndInteger(800, 5000);
        logEntryTimestamp = logEntryTimestamp + timeoutValue;

        var entry = getLogEntry(false,logEntryTimestamp);            

        logEntriesArray.push(entry);
    }

    var logEntriesString = logEntriesArray.join("\n") + "\n";
    fs.writeFileSync(`${dataDir}/2daysoflogs.txt`, logEntriesString);
    
    console.log(logEntriesString);

    twodaysoflogsPrinted = true;
    twodaysoflogsInProgress = false;
}

function generateLogEntries()
{
    //generate log entries every 1 ..3 seconds
    //if logging enabled, call this function again
    if (loggingStarted == true) {
        //print log entries
        var entry = getLogEntry();  
        logEntriesGenerated = logEntriesGenerated + 1;
        console.log(`${entry}`);
        var timeoutValue = Utils.getRndInteger(900, 3500);
        setTimeout(generateLogEntries, timeoutValue);
    }

}

function generateErrorLogEntries()
{
    if (errorLoggingStarted == true) {
        var entry = getLogEntry({isError: true}

        );
        errorLogEntriesGenerated = errorLogEntriesGenerated + 1;
        console.log(entry);
        var timeoutValue = Utils.getRndInteger(1500, 8500);
        setTimeout(generateErrorLogEntries, timeoutValue);
    }

}

function getHTML() {
    var now = new Date().toISOString();

    var timeStartedString = loggingStartedTimestamp == null ? "" : `(${loggingStartedTimestamp})`
    var errorTimeStartedString = errorLoggingStartedTimestamp == null ? "" : `(${errorLoggingStartedTimestamp})`
    var twodaysinprogress = "";
    if (twodaysoflogsInProgress == true)
    {
        twodaysinprogress = "(PRINTING IN PROGRESS)";
    }
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
2 days of logs printed: ${twodaysoflogsPrinted} ${twodaysinprogress}<br/>
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

router.get('/print2daysoflogs', function (req, res) {

    if (loggingStarted == false) {
       
        //print two days of logs to to system out
        var d = new Date();
        d.setUTCHours(0, 0, 1, 0);
        //              msec   sec  min  hours  days
        var _oneday_ms = 1000 * 60 * 60 * 24;
        //minus 2 days
        logHistoryStartTime = d.getTime() - _oneday_ms * 2;
        logHistoryEndTime = d.getTime() - 2000;
        //for testing
        //logHistoryEndTime = logHistoryStartTime + 1000 * 20; 
        debug(`Log history start    : ${logHistoryStartTime}`);
        debug(`Log history start ISO: ${new Date(logHistoryStartTime).toISOString()}`);        
        debug(`Log history end      : ${logHistoryEndTime}`);
        debug(`Log history end ISO  : ${new Date(logHistoryEndTime).toISOString()}`);        
        logEntryTimestamp = logHistoryStartTime
        debug(`logEntryTimestamp ISO  : ${new Date(logEntryTimestamp).toISOString()}`);        

        setTimeout(print2DaysOfLogs, 1);
    }
    res.redirect(req.baseUrl);
});


export { router };