
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var APP_NAME = process.env.APP_NAME || "nodejs-sample";

var elasticSearchHost = process.env.ELASTICSEARCH_HOST;
var elasticSearchPort = parseInt(process.env.ELASTICSEARCH_PORT, 10) || 9200;
var elasticSearchUser = process.env.ELASTICSEARCH_USER_NAME;
var elasticSearchPassword = process.env.ELASTICSEARCH_USER_PASSWORD;
var elastiSearchIndexName = process.env.ELASTICSEARCH_INDEX_NAME || `app-${APP_NAME}`;
var elasticSearchHTTP = process.env.ELASTICSEARCH_USE_HTTP || "false";

//HOSTNAME in kubernetes is the pod name
var currentHostName = process.env.HOSTNAME || APP_NAME;


if (process.env.HOST_NAME)
{
    currentHostName = process.env.HOST_NAME;
}

//use app name as host name in Elasticsearch JSON
var APP_NAME_EQUALS_HOST_NAME=false;
if (process.env.APP_NAME_EQUALS_HOST_NAME === 'true')
{
    APP_NAME_EQUALS_HOST_NAME=true;
}
var sendLogs_Elasticsearch_always = false;
if (process.env.ELASTICSEARCH_SEND_ALWAYS === 'true')
{
    sendLogs_Elasticsearch_always = true;
}

var https = require('https');
//use HTTP instead of HTTPS
if (elasticSearchHTTP == "true")
{
    https = require('http');
}

let buff = Buffer.from(`${elasticSearchUser}:${elasticSearchPassword}`);
let base64Authentication = buff.toString('base64');

var elasticSearchEnabled = elasticSearchHost == null ? false : true;

var router = express.Router();

var sendlogs_elasticSearch = false || sendLogs_Elasticsearch_always;
var sendErrors_elasticSearch = false;
var sendlogs_elasticSearch_started = null;
var sendErrors_elasticSearch_started = null;
var oneShotErrorSent = null;
var sendNumberOflogs_elasticSearch_started = null;
var sendNumberOflogs_elasticSearch = false;
var checkResponse = null;
var checkTime = null;
const checkUrlPath = "/_cat/indices";


if (elasticSearchEnabled == true && sendlogs_elasticSearch == true) {
    //start sending log entries to Elasticsearch
    sendlogs_elasticSearch_started = new Date().toISOString();
    setTimeout(sendLogEntriesToelasticSearch, 1);
}


let logMessages = ["Customer details found.",
    "Ticket was purchased.",
    "Purchase was canceled.",
    "Seat was selected.",
    "Seat unavailable.",
    "Multiple tickets purchased.",
    "Credit card validation was successful.",
    "Credit card validation failed.",
    "Train was selected.",
    "Airplane was selected.",
    "Bus was selected.",
    "Car was selected.",
    "Bicycle was selected.",
    "Ship was selected.",
    "Transportation method not selected.",
    "Transportation method unavailable.",
    "Destination was selected.",
    "Destination does not exist.",
    "Destination is valid.",
    "Destination out of range."
];

let errorMessages = [
    "OutOfMemoryError",
    "IOException",
    "NullPointerException",
    "ArrayIndexOutOfBoundsException",
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
        hostname: elasticSearchHost,
        port: elasticSearchPort,
        path: `/${elastiSearchIndexName}/_doc`,
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
        hostname: elasticSearchHost,
        port: elasticSearchPort,
//        path: `/${elastiSearchIndexName}/_doc/_bulk`,
        path: `/${elastiSearchIndexName}/_bulk`,
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
            debug(`Log entries sent. Calling sendLogHistory again...`);
            setTimeout(sendLogHistory, 2000);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
    
}

function checkElasticsearch()
{
    // Set up the request
    var options = {
        hostname: elasticSearchHost,
        port: elasticSearchPort,
        path: checkUrlPath,
        method: 'GET',
        headers: {
            'Authorization': `Basic ${base64Authentication}`
        }    
    };
    checkTime = (new Date()).toISOString();
    debug("calling Elasticsearch /_cat/indices...");
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            checkResponse = `${chunk}`
            debug(`calling Elasticsearch /_cat/indices response: ${checkResponse}`);
        });
        
    });

    req.end();
    
}

function getLogEntryJSON(logTimestamp,isError)
{
    var timestamp = new Date().toISOString();
    if (logTimestamp != null)
    {
        timestamp = new Date(logTimestamp).toISOString();
    }
    var entry = randomValue(logMessages);
    var errorLevel = "INFO";
    if (isError == true)
    {
        errorLevel = "ERROR";
        entry = randomValue(errorMessages);

    }
    var appName = APP_NAME;
    var hostName = currentHostName;
    if (APP_NAME_EQUALS_HOST_NAME == true)
    {
        appName = hostName;
    }

    var logEntry = {
        "@timestamp": timestamp,          
        "message": entry,
        "log": {
            "level": errorLevel
        },
        "labels": {
            "application_name": appName,
            "host_name": hostName,
            
        },
        "kubernetes": {
            "namespace_name": appName,
            "pod_name": hostName
        }
      }

    return logEntry;
}

function sendLogEntriesToelasticSearch() {
    if (sendlogs_elasticSearch == true) {
        //send log entries to elasticSearch
        //var entry = getLogEntry();
        //debug(`Sending "${entry}" to elasticSearch...`);
        var logEntry = getLogEntryJSON(null,false);
        /*var timestamp = new Date().toISOString();
        var logEntry = {
            "@timestamp": timestamp,          
            "message": entry,
            "log": {
                "level": "INFO"
            },
            "labels": {
                "application_name": appName,
                "host_name": currentHostName
            }
          }
          */
        sendLogEntryToElasticsearch(logEntry);
        var timeoutValue = Utils.getRndInteger(800, 5000);
        setTimeout(sendLogEntriesToelasticSearch, timeoutValue);
    }

}

function sendErrorEntriesToelasticSearch() {
    if (sendErrors_elasticSearch == true) {
        //send log entries to elasticSearch
        //var timestamp = new Date().toISOString();
        //var entry = randomValue(errorMessages);
        //debug(`Sending error "${entry}" to elasticSearch...`);

        var logEntry = getLogEntryJSON(null,true);
/*
        var logEntry = {
            "@timestamp": timestamp,          
            "message": entry,
            "log": {
                "level": "ERROR"
            },
            "labels": {
                "application_name": appName,
                "host_name": currentHostName
            }
          }
*/
        sendLogEntryToElasticsearch(logEntry);
        var timeoutValue = Utils.getRndInteger(1000, 10000);
        setTimeout(sendErrorEntriesToelasticSearch, timeoutValue);
    }

}

function sendOneShotErrorEntryToelasticSearch() {
    if (elasticSearchEnabled == true) {
        //send log entries to elasticSearch
        var timestamp = new Date().toISOString();
        oneShotErrorSent = timestamp;
  //      var entry = randomValue(errorMessages);
    //    debug(`Sending only one error "${entry}" to elasticSearch...`);
        var logEntry = getLogEntryJSON(null,true);
/*
        var logEntry = {
            "@timestamp": timestamp,          
            "message": entry,
            "log": {
                "level": "ERROR"
            },
            "labels": {
                "application_name": appName,
                "host_name": currentHostName
            }
          }
          */
        sendLogEntryToElasticsearch(logEntry);
    }
}


function sendLogHistory()
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
                var logEntry = getLogEntryJSON(logEntryTimestamp,false);
                /*var entry = getLogEntry();
                var logEntry = {
                    "@timestamp": new Date(logEntryTimestamp).toISOString(),
                    "message": entry,
                    "log": {
                        "level": "INFO"
                    },
                    "labels": {
                        "application_name": appName,
                        "host_name": currentHostName
                    }            
                }
                */
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
            //setTimeout(sendLogHistory, 2000);

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
        <br/>ELASTICSEARCH_PORT=&lt;elasticsearch-port>        
        <br/>ELASTICSEARCH_USER_NAME=&lt;elasticsearch-username>
        <br/>ELASTICSEARCH_USER_PASSWORD=&lt;elasticsearch-password>
        <br/>ELASTICSEARCH_INDEX_NAME=&lt;elasticsearch-index-name> (default: app-${APP_NAME})
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

        var elasticSearchCheckHtml = "";
        if (checkTime != null)
        {
            elasticSearchCheckHtml = `<p>
            Elasticsearch check ${checkUrlPath} : ${checkTime}<br/>
            Response:<br/>
            <pre>
${checkResponse == null ? "(no response yet, refresh page)" : checkResponse}
            </pre>
            </p>
            `;
            //Elasticsearch was checked
        }

        elasticSearchHtml = `<p>
        Elasticsearch logging is enabled.
        <br/>
        Sending logs to elasticSearch: ${sendlogs_elasticSearch} ${startedLogsTime}
        <br/>
        Oneshot error sent to elasticSearch: ~${oneShotErrorSent}
        <br/>
        Sending errors to elasticSearch: ${sendErrors_elasticSearch} ${startedErrorsTime}
        <br/>
        Log history sent to elasticSearch: ${startedNumberOfLogsTime}
        </p>
        `;
    }

    var html = `
<h2>Elasticsearch logging test</h2>
${elasticSearchHtml}
${elasticSearchCheckHtml}
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

router.get('/errors/oneshot', function (req, res) {

    if (elasticSearchEnabled == true && sendErrors_elasticSearch == false) {
        sendOneShotErrorEntryToelasticSearch();
    }
    res.redirect(req.baseUrl);
});

router.get('/history/send', function (req, res) {

    debug(`sendNumberOflogs_elasticSearch: ${sendNumberOflogs_elasticSearch}`);
    if (sendNumberOflogs_elasticSearch == false) {
        sendNumberOflogs_elasticSearch_started = new Date().toISOString();
        sendNumberOflogs_elasticSearch = true;
        
        //send two days of logs to elastic search
        var d = new Date();
        d.setUTCHours(0, 0, 1, 0);
        //              msec   sec  min  hours  days
        var _oneday_ms = 1000 * 60 * 60 * 24;
        //minus  days
        var days = 5;//2
        logHistoryStartTime = d.getTime() - _oneday_ms * days;
        logHistoryEndTime = d.getTime() - 2000;
        logHistoryEndTime = (new Date()).getTime() - 3600000;

        debug(`Log history start    : ${logHistoryStartTime}`);
        debug(`Log history start ISO: ${new Date(logHistoryStartTime).toISOString()}`);        
        debug(`Log history end      : ${logHistoryEndTime}`);
        debug(`Log history end ISO  : ${new Date(logHistoryEndTime).toISOString()}`);        
        logEntryTimestamp = logHistoryStartTime
        debug(`logEntryTimestamp ISO  : ${new Date(logEntryTimestamp).toISOString()}`);        

        setTimeout(sendLogHistory, 1);
    }
    res.redirect(req.baseUrl);
});
/*
router.get('/2daysoflogs/stop', function (req, res) {

    if (sendNumberOflogs_elasticSearch == true) {
        sendNumberOflogs_elasticSearch = false;
        sendNumberOflogs_elasticSearch_started = null;
    }
    res.redirect(req.baseUrl);
});
*/
router.get('/check', function (req, res) {
    if (elasticSearchEnabled == true) {
        checkElasticsearch();
    }
    res.redirect(req.baseUrl);
});

export { router };