
//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

import express from 'express';
import { debug, error, trace } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

var lastLogRetrievedTimestamp = "";
var totalLogRetrievals = 0;
var logApiEnabled = process.env.LOGAPI_ENABLED ? true : false;

function getHTML() {
    var now = new Date().toISOString();

    let logEnabledHtml = "";
    if (logApiEnabled == false) {
        logEnabledHtml = "<p><b>Log API is not enabled. Enable it by setting environment variable:<br/>LOGAPI_ENABLED=true</b></p>";
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
<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("Log API", html);
};

router.get('/', function (req, res) {
    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});

router.get('/logentries', function (req, res) {

    if (logApiEnabled == true) {
        lastLogRetrievedTimestamp = new Date().toISOString();
        totalLogRetrievals = totalLogRetrievals + 1
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(Data.state.logEntries));
        res.end();

        debug("Deleting log entries after they were retrieved");
        Data.setState({ logEntries: [] });

    }
    else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write("ERROR 500 - Logging API is not enabled. Enable it by setting environment variable: LOGAPI_ENABLED=true.");
        res.end();
    }


});

export { router };