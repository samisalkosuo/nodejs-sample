
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import { debug, error,trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

const logdna = require('@logdna/logger')
const ingestionKey = process.env.LOGDNA_INGESTION_KEY ? process.env.LOGDNA_INGESTION_KEY : "na";
//get app name from env variable here, in order to set it in logDNA options
var appName = process.env.APP_NAME || "nodejs-sample";
const options = {
    app: appName,
    level: 'info' // set a default for when level is not provided in function calls
  } ;
const LOGDNALOGGER = logdna.createLogger(ingestionKey, options);
var logDNAEnabled = ingestionKey == "na" ? false: true;
const sendLogs_LogDNA_always = process.env.LOGDNA_SEND_ALWAYS ? true : false;

var lastLogRetrievedTimestamp = "";
var totalLogRetrievals = 0;
var logApiEnabled = process.env.LOGAPI_ENABLED ? true: false;

var sendlogs_LogDNA = false || sendLogs_LogDNA_always;
var sendErrors_LogDNA = false;
var sendlogs_LogDNA_started = null;
var sendErrors_LogDNA_started = null;
var send10000logs_LogDNA_started = null;
var send10000logs_LogDNA = false;
var logEntryIndex = 0;

if (logDNAEnabled == true && sendlogs_LogDNA == true)
{
    //start sending log entries to logdna
    setTimeout(sendLogEntriesToLogDNA, 1);
}


let logMessages = [ "Customer detail found.",
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

function sendLogEntriesToLogDNA()
{
    if (sendlogs_LogDNA == true)
    {
        //send log entries to logDNA
        var entry = randomValue(logMessages);
        debug(`Sending "${entry}" to logDNA...`);
        LOGDNALOGGER.log(entry);
        var timeoutValue =  Utils.getRndInteger(10,3000);
        setTimeout(sendLogEntriesToLogDNA, timeoutValue);
    }
    
}

function sendErrorEntriesToLogDNA()
{
    if (sendErrors_LogDNA == true)
    {
        //send log entries to logDNA
        var entry = randomValue(errorMessages);
        debug(`Sending error "${entry}" to logDNA...`);
        LOGDNALOGGER.error(entry);
        var timeoutValue =  Utils.getRndInteger(1000,10000);
        setTimeout(sendErrorEntriesToLogDNA, timeoutValue);
    }
    
}

function send10000LogEntriesToLogDNA()
{
    if (send10000logs_LogDNA == true)
    {
        //send log entries to logDNA
        var entry = randomValue(logMessages);
        debug(`Sending index ${logEntryIndex} "${entry}" to logDNA...`);
        LOGDNALOGGER.log(entry);
        if (logEntryIndex < 10000)
        {
            setTimeout(send10000LogEntriesToLogDNA, 10);
            logEntryIndex = logEntryIndex + 1
        }
        else
        {
            send10000logs_LogDNA = false;
            send10000logs_LogDNA_started = null;
        }
    }
    
}


function getHTML() {
    var now = new Date().toISOString();

    let logEnabledHtml = "";
    if (logApiEnabled == false)
    {
        logEnabledHtml = "<p><b>Log API is not enabled. Enable it by setting environment variable:<br/>LOGAPI_ENABLED=true</b></p>";
    }

    let logDNAHtml = "";
    if (logDNAEnabled == false)
    {
        logDNAHtml = "<p><b>LogDNA is not enabled. Enable it by setting environment variable:<br/>LOGDNA_INGESTION_KEY=&lt;logdna-ingestion-key></b></p>";
    }
    else
    {
        //set logDNA info
        var startedLogsTime = sendlogs_LogDNA_started == null ? "" : `(started ${sendlogs_LogDNA_started})`;
        var startedErrorsTime = sendErrors_LogDNA_started == null ? "" : `(started ${sendErrors_LogDNA_started})`;
        var started10000LogsTime = send10000logs_LogDNA_started == null ? "": `(started ${send10000logs_LogDNA_started})`;
        logDNAHtml = `<p>
        LogDNA is enabled.
        <br/>
        Sending logs to LogDNA: ${sendlogs_LogDNA} ${startedLogsTime}
        <br/>
        Sending errors to LogDNA: ${sendErrors_LogDNA} ${startedErrorsTime}
        <br/>
        Sending 10,000 log entries to LogDNA: ${send10000logs_LogDNA} ${started10000LogsTime}
        </p>
        `;
    }

    var html = `
<h2>Logging test</h2>
${logEnabledHtml}
<p>
Log entries: ${Data.state.logEntries.length}
<br/>
Logs have been retrieved via /logentries ${totalLogRetrievals} times.
<br/>
Last log retrieval:  ${lastLogRetrievedTimestamp}
</p>
${logDNAHtml}

<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("Log API",html);
};

router.get('/', function (req, res) {
    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();
    
});

router.get('/logentries', function (req, res) {
    
    if (logApiEnabled == true)
    {
        lastLogRetrievedTimestamp = new Date().toISOString();
        totalLogRetrievals = totalLogRetrievals + 1
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(Data.state.logEntries));
        res.end();
       
        debug("Deleting log entries after they were retrieved");
        Data.setState ({ logEntries: [] }) ;
    
    }
    else
    {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write("ERROR 500 - Logging API is not enabled. Enable it by setting environment variable: LOGAPI_ENABLED=true.");
        res.end();
    }    


});

router.get('/logdna/start', function (req, res) {

    debug(`logDNAEnabled: ${logDNAEnabled}`);
    if (logDNAEnabled == true && sendlogs_LogDNA == false)
    {
        sendlogs_LogDNA_started = new Date().toISOString();
        //start sending log entries to logdna
        sendlogs_LogDNA = true;
        setTimeout(sendLogEntriesToLogDNA, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/logdna/stop', function (req, res) {

    if (logDNAEnabled == true)
    {
        //stop sending log entries to logdna
        sendlogs_LogDNA = false;
        sendlogs_LogDNA_started = null;
    }
    res.redirect(req.baseUrl);
});

router.get('/logdna/10000logs', function (req, res) {

    debug(`send10000logs_LogDNA: ${send10000logs_LogDNA}`);
    if (send10000logs_LogDNA == false)
    {
        send10000logs_LogDNA_started = new Date().toISOString();
        send10000logs_LogDNA = true;
        logEntryIndex = 0;
        setTimeout(send10000LogEntriesToLogDNA, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/logdna/errors/start', function (req, res) {

    if (logDNAEnabled == true && sendErrors_LogDNA == false)
    {
        sendErrors_LogDNA_started = new Date().toISOString();
        //start sending log entries to logdna
        sendErrors_LogDNA = true;
        setTimeout(sendErrorEntriesToLogDNA, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/logdna/errors/stop', function (req, res) {

    if (logDNAEnabled == true)
    {
        //stop sending log entries to logdna
        sendErrors_LogDNA = false;
        sendErrors_LogDNA_started = null;
    }
    res.redirect(req.baseUrl);
});

export { router };