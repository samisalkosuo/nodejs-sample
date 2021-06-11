
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
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
};
const LOGDNALOGGER = logdna.createLogger(ingestionKey, options);
var logDNAEnabled = ingestionKey == "na" ? false : true;
const sendLogs_LogDNA_always = process.env.LOGDNA_SEND_ALWAYS ? true : false;

var sendlogs_LogDNA = false || sendLogs_LogDNA_always;
var sendErrors_LogDNA = false;
var sendlogs_LogDNA_started = null;
var sendErrors_LogDNA_started = null;
var sendNumberOflogs_LogDNA_started = null;
var sendNumberOflogs_LogDNA = false;
var logEntryIndex = 0;

if (logDNAEnabled == true && sendlogs_LogDNA == true) {
    //start sending log entries to logdna
    setTimeout(sendLogEntriesToLogDNA, 1);
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

var todayAtOne = null;
var logEntryTimestamp = null;

let buff = Buffer.from(`${ingestionKey}:`);
let base64IngestionKey = buff.toString('base64');
let hostName = process.env.HOSTNAME || "NODEJS_SAMPLE";
const maxEntriesInOneRequest = 500;
const totalLogEntries = 5000;

async function sendLogEntriesViaAPI() {
    if (sendNumberOflogs_LogDNA == true) {
        if (todayAtOne == null) {
            var d = new Date();
            d.setUTCHours(1, 0, 0, 0);
            todayAtOne = d.getTime();
            debug(`Today at 01:00: ${todayAtOne}`);
        }
        if (logEntryTimestamp == null) {
            logEntryTimestamp = todayAtOne
        }

        if (logEntryIndex < totalLogEntries) {
            debug(`Sending ${maxEntriesInOneRequest} log entries via REST API...`);
            var entries = [];
            for (let index = 1; index <= maxEntriesInOneRequest; index++) {
                logEntryTimestamp = logEntryTimestamp + 1000 * Utils.getRndInteger(1, 3);
                entries.push({
                    "timestamp": logEntryTimestamp,
                    "line": `${randomValue(logMessages)}`,
                    "app": `${Data.state.appName}`,
                    "level": "INFO"
                });
            }

            // Set up the request
            var post_options = {
                hostname: "logs.logdna.com",
                port: 443,
                path: `/logs/ingest?hostname=${hostName}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${base64IngestionKey}`
                }
            };
            var post_data = JSON.stringify({ "lines": entries });
            var post_req = https.request(post_options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    debug(`Log entries sent. Response: ${chunk}`);
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
            logEntryIndex = logEntryIndex + maxEntriesInOneRequest;
            setTimeout(sendLogEntriesViaAPI, 1500);

        }
        else {
            sendNumberOflogs_LogDNA = false;
            sendNumberOflogs_LogDNA_started = null;
            todayAtOne = null;
            logEntryTimestamp = null;

        }

    }
}


function sendLogEntriesToLogDNA() {
    if (sendlogs_LogDNA == true) {
        //send log entries to logDNA
        var entry = randomValue(logMessages);
        debug(`Sending "${entry}" to logDNA...`);
        LOGDNALOGGER.log(entry);
        var timeoutValue = Utils.getRndInteger(10, 3000);
        setTimeout(sendLogEntriesToLogDNA, timeoutValue);
    }

}

function sendErrorEntriesToLogDNA() {
    if (sendErrors_LogDNA == true) {
        //send log entries to logDNA
        var entry = randomValue(errorMessages);
        debug(`Sending error "${entry}" to logDNA...`);
        LOGDNALOGGER.error(entry);
        var timeoutValue = Utils.getRndInteger(1000, 10000);
        setTimeout(sendErrorEntriesToLogDNA, timeoutValue);
    }

}

function getHTML() {
    var now = new Date().toISOString();

    let logDNAHtml = "";
    if (logDNAEnabled == false) {
        logDNAHtml = "<p><b>LogDNA is not enabled. Enable it by setting environment variable:<br/>LOGDNA_INGESTION_KEY=&lt;logdna-ingestion-key></b></p>";
    }
    else {
        //set logDNA info
        var startedLogsTime = sendlogs_LogDNA_started == null ? "" : `(started ${sendlogs_LogDNA_started})`;
        var startedErrorsTime = sendErrors_LogDNA_started == null ? "" : `(started ${sendErrors_LogDNA_started})`;
        var started10000LogsTime = sendNumberOflogs_LogDNA_started == null ? "" : `(started ${sendNumberOflogs_LogDNA_started})`;
        logDNAHtml = `<p>
        LogDNA is enabled.
        <br/>
        Sending logs to LogDNA: ${sendlogs_LogDNA} ${startedLogsTime}
        <br/>
        Sending errors to LogDNA: ${sendErrors_LogDNA} ${startedErrorsTime}
        <br/>
        Sending ${totalLogEntries} log entries to LogDNA: ${sendNumberOflogs_LogDNA} ${started10000LogsTime}
        </p>
        `;
    }

    var html = `
<h2>LogDNA test</h2>
${logDNAHtml}

<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("LogDNA test", html);
};

router.get('/', function (req, res) {
    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});


router.get('/start', function (req, res) {

    debug(`logDNAEnabled: ${logDNAEnabled}`);
    if (logDNAEnabled == true && sendlogs_LogDNA == false) {
        sendlogs_LogDNA_started = new Date().toISOString();
        //start sending log entries to logdna
        sendlogs_LogDNA = true;
        setTimeout(sendLogEntriesToLogDNA, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/stop', function (req, res) {

    if (logDNAEnabled == true) {
        //stop sending log entries to logdna
        sendlogs_LogDNA = false;
        sendlogs_LogDNA_started = null;
    }
    res.redirect(req.baseUrl);
});

router.get('/5000logs', function (req, res) {

    debug(`sendNumberOflogs_LogDNA: ${sendNumberOflogs_LogDNA}`);
    if (sendNumberOflogs_LogDNA == false) {
        sendNumberOflogs_LogDNA_started = new Date().toISOString();
        sendNumberOflogs_LogDNA = true;
        logEntryIndex = 0;
        setTimeout(sendLogEntriesViaAPI, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/errors/start', function (req, res) {

    if (logDNAEnabled == true && sendErrors_LogDNA == false) {
        sendErrors_LogDNA_started = new Date().toISOString();
        //start sending log entries to logdna
        sendErrors_LogDNA = true;
        setTimeout(sendErrorEntriesToLogDNA, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/errors/stop', function (req, res) {

    if (logDNAEnabled == true) {
        //stop sending log entries to logdna
        sendErrors_LogDNA = false;
        sendErrors_LogDNA_started = null;
    }
    res.redirect(req.baseUrl);
});

export { router };