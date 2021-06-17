
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var appName = process.env.APP_NAME || "nodejs-sample";

var elasticSearchUrl = process.env.ELASTICSEARCH_HOST
var elasticSearchUser = process.env.ELASTICSEARCH_USER
var elasticSearchPassword = process.env.ELASTICSEARCH_PASSWORD

let buff = Buffer.from(`${elasticSearchUser}:${elasticSearchPassword}`);
let base64Authentication = buff.toString('base64');

var elasticSearchEnabled = elasticSearchUrl == null ? false : true;

var router = express.Router();

var sendlogs_elasticSearch = false ;
var sendErrors_elasticSearch = false;
var sendlogs_elasticSearch_started = null;
var sendErrors_elasticSearch_started = null;
var sendNumberOflogs_elasticSearch_started = null;
var sendNumberOflogs_elasticSearch = false;


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

function sendLogEntryToElasticsearch(logEntry)
{
    // Set up the request
    var post_options = {
        hostname: elasticSearchUrl,
        port: 443,
        path: `/logs-${appName}/_doc`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${base64Authentication}`
        }    
    };
    var post_data = JSON.stringify(logEntry);
    var post_req = https.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            trace(`Log entries sent. Response: ${chunk}`);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
    
}

function sendBulkLogEntryToElasticsearch(logEntries)
{
    // Set up the request
    var post_options = {
        hostname: elasticSearchUrl,
        port: 443,
        path: `/logs-${appName}/_doc/_bulk`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${base64Authentication}`
        }    
    };
    var post_data = logEntries;
    var post_req = https.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            trace(`Log entries sent. Response: ${chunk}`);
            debug(`Log entries sent. Calling send2DaysOfLogs again...`);
            setTimeout(send2DaysOfLogs, 2000);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
    
}

function getLogEntry()
{
    return randomValue(logMessages);;
}

function sendLogEntriesToelasticSearch() {
    if (sendlogs_elasticSearch == true) {
        //send log entries to elasticSearch
        var entry = getLogEntry();
        debug(`Sending "${entry}" to elasticSearch...`);
        
        var timestamp = new Date().toISOString();
        var logEntry = {
            "@timestamp": timestamp,          
            "message": entry,
            "log": {
                "level": "INFO"
            },
            "labels": {
                "application_name": appName
            }            
          }
        sendLogEntryToElasticsearch(logEntry);
        var timeoutValue = Utils.getRndInteger(800, 5000);
        setTimeout(sendLogEntriesToelasticSearch, timeoutValue);
    }

}

function sendErrorEntriesToelasticSearch() {
    if (sendErrors_elasticSearch == true) {
        //send log entries to elasticSearch
        var timestamp = new Date().toISOString();
        var entry = randomValue(errorMessages);
        debug(`Sending error "${entry}" to elasticSearch...`);
        var logEntry = {
            "@timestamp": timestamp,          
            "message": entry,
            "log": {
                "level": "ERROR"
            },
            "labels": {
                "application_name": appName
            }            
          }

        sendLogEntryToElasticsearch(logEntry);
        var timeoutValue = Utils.getRndInteger(1000, 10000);
        setTimeout(sendErrorEntriesToelasticSearch, timeoutValue);
    }

}

function send2DaysOfLogs()
{
    if (sendNumberOflogs_elasticSearch == true)
    {
        var logEntriesArray = [];
        var createLineString = JSON.stringify({ "create": { } });
        if (logEntryTimestamp < logHistoryEndTime)
        {
            //number of log entries in bulk request
            let max = 10000;
            for (let index = 0; index < max; index++) {
                logEntriesArray.push(createLineString);
                var timeoutValue = Utils.getRndInteger(800, 5000);
                logEntryTimestamp = logEntryTimestamp + timeoutValue;
                var entry = getLogEntry();
                var logEntry = {
                    "@timestamp": new Date(logEntryTimestamp).toISOString(),
                    "message": entry,
                    "log": {
                        "level": "INFO"
                    },
                    "labels": {
                        "application_name": appName
                    }            
                }
                var entryStr = JSON.stringify(logEntry);
                logEntriesArray.push(entryStr);
                trace(`log entry to send: ${entryStr}`);
                if (logEntryTimestamp > logHistoryEndTime)
                {
                    break;
                }
            }
            var logEntriesString = logEntriesArray.join("\n") + "\n";
            debug(`sending ${logEntriesArray.length} to Elasticsearch...`);
            sendBulkLogEntryToElasticsearch(logEntriesString);
            //call this function in sendBulkLogEntryToElasticsearch-function
            //setTimeout(send2DaysOfLogs, 2000);

        }
        else
        {
            //2 days of logs sent
            sendNumberOflogs_elasticSearch = false;
            //sendNumberOflogs_elasticSearch_started = null;
        }
    }

}


function getHTML() {
    var now = new Date().toISOString();

    let elasticSearchHtml = "";
    if (elasticSearchEnabled == false) {
        elasticSearchHtml = `<p><b>Elasticsearch is not enabled. Enable it by setting environment variables:
        <br/>ELASTICSEARCH_HOST=&lt;elasticsearch-host>
        <br/>ELASTICSEARCH_USERNAME=&lt;elasticsearch-username>
        <br/>ELASTICSEARCH_PASSWORD=&lt;elasticsearch-password>
        
        </b></p>`;
    }
    else {
        //set elasticSearch info
        var startedLogsTime = sendlogs_elasticSearch_started == null ? "" : `(started ${sendlogs_elasticSearch_started})`;
        var startedErrorsTime = sendErrors_elasticSearch_started == null ? "" : `(started ${sendErrors_elasticSearch_started})`;
        var startedNumberOfLogsTime = sendNumberOflogs_elasticSearch_started == null ? "" : `(started ${sendNumberOflogs_elasticSearch_started})<br/>
        <pre>
        Current log entry time: ${new Date(logEntryTimestamp).toISOString()}
        Log entry start: ${new Date(logHistoryStartTime).toISOString()}
        Log entry end: ${new Date(logHistoryEndTime).toISOString()}
        </pre>`;
        elasticSearchHtml = `<p>
        Elasticsearch logging is enabled.
        <br/>
        Sending logs to elasticSearch: ${sendlogs_elasticSearch} ${startedLogsTime}
        <br/>
        Sending errors to elasticSearch: ${sendErrors_elasticSearch} ${startedErrorsTime}
        <br/>
        Sending 2 days of logs to elasticSearch: ${sendNumberOflogs_elasticSearch} ${startedNumberOfLogsTime}
        </p>
        `;
    }

    var html = `
<h2>Elasticsearch logging test</h2>
${elasticSearchHtml}

<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("elasticSearch test", html);
};

router.get('/', function (req, res) {
    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});


router.get('/start', function (req, res) {

    debug(`elasticSearchEnabled: ${elasticSearchEnabled}`);
    if (elasticSearchEnabled == true && sendlogs_elasticSearch == false) {
        sendlogs_elasticSearch_started = new Date().toISOString();
        //start sending log entries to elasticSearch
        sendlogs_elasticSearch = true;
        setTimeout(sendLogEntriesToelasticSearch, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/stop', function (req, res) {

    if (elasticSearchEnabled == true) {
        //stop sending log entries to elasticSearch
        sendlogs_elasticSearch = false;
        sendlogs_elasticSearch_started = null;
    }
    res.redirect(req.baseUrl);
});

router.get('/errors/start', function (req, res) {

    if (elasticSearchEnabled == true && sendErrors_elasticSearch == false) {
        sendErrors_elasticSearch_started = new Date().toISOString();
        //start sending log entries to elasticSearch
        sendErrors_elasticSearch = true;
        setTimeout(sendErrorEntriesToelasticSearch, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/errors/stop', function (req, res) {

    if (elasticSearchEnabled == true) {
        //stop sending log entries to elasticSearch
        sendErrors_elasticSearch = false;
        sendErrors_elasticSearch_started = null;
    }
    res.redirect(req.baseUrl);
});

router.get('/2daysoflogs/start', function (req, res) {

    debug(`sendNumberOflogs_elasticSearch: ${sendNumberOflogs_elasticSearch}`);
    if (sendNumberOflogs_elasticSearch == false) {
        sendNumberOflogs_elasticSearch_started = new Date().toISOString();
        sendNumberOflogs_elasticSearch = true;
        
        //send two days of logs to elastic search
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

        setTimeout(send2DaysOfLogs, 1);
    }
    res.redirect(req.baseUrl);
});

router.get('/2daysoflogs/stop', function (req, res) {

    if (sendNumberOflogs_elasticSearch == true) {
        sendNumberOflogs_elasticSearch = false;
        sendNumberOflogs_elasticSearch_started = null;
    }
    res.redirect(req.baseUrl);
});


export { router };