
import express from 'express';
import {debug,log,error} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';

import * as SystemInformation from 'systeminformation';

const SEVERITY_CHANGE=-1;
const SEVERITY_WARNING=5;
const SEVERITY_CRITICAL=10;

var router = express.Router();

var agentHost="127.0.0.1";
var agentPort=42699;
var agentPath=`/com.instana.plugin.generic.event`;

var eventsSentChange=0;
var eventSentWarning=0;
var eventSentCritical=0;

async function sendEvent(title,text,severity,isIncident,duration)
{
    debug("Posting event...");
    const res = await Utils.httpPostJSONData({
            hostname: agentHost,        
            port: agentPort,
            path: agentPath,
            body: JSON.stringify(
                {
                    "title": title,
                    "text": text,
                    "severity": severity,
                    "incident": isIncident,
                    "timestamp": new Date().getTime(),
                    "duration": duration
                }
            )
        });

}

async function incidentLoop()
{
    //send incidents while incidents are true
    if (Data.state.instanaincident == true)
    {
        sendEvent("Node.js Incident", "Incident in node-js sample application",SEVERITY_CRITICAL,true,10000);

        setTimeout(incidentLoop, 8000);
    }
}

async function startIncident()
{
    
    //start sending events
    setTimeout(incidentLoop, 1000);

}


router.use(function (req, res, next) { 

    if (Data.state.instanaincident === undefined)
    {
        Data.setState({ instanaincident: false });
        debug("set instanaincident: false");
    }

    next();
});
  
router.get('/', function(req, res, next) {
    next();
});

router.get('/incident-enable', function(req, res, next) {
    Data.setState({ instanaincident: true });
    startIncident();

    res.redirect(req.baseUrl);
});

router.get('/incident-disable', function(req, res, next) {
    Data.setState({ instanaincident: false });
    res.redirect(req.baseUrl);
});


router.get('/send-event-change', function(req, res, next) {

    res.locals.title="Node.js Change Event";
    res.locals.text="Change event in node-js sample application";
    res.locals.severity=SEVERITY_WARNING;
    eventsSentChange = eventsSentChange + 1;
    res.locals.eventsSent = eventsSentChange;
    res.locals.eventType = "change";

    next();
});

router.get('/send-event-warning', function(req, res, next) {

    res.locals.title="Node.js Warning Event";
    res.locals.text="Warning event in node-js sample application";
    res.locals.severity=SEVERITY_WARNING;
    eventSentWarning = eventSentWarning + 1;
    res.locals.eventsSent = eventSentWarning;
    res.locals.eventType = "warning";

    next();
});

router.get('/send-event-critical', function(req, res, next) {

    res.locals.title="Node.js Critical Event";
    res.locals.text="Critical event in node-js sample application";
    res.locals.severity=SEVERITY_CRITICAL;
    eventSentCritical = eventSentCritical + 1;
    res.locals.eventsSent = eventSentCritical;
    res.locals.eventType = "critical";

    next();
});

router.use(function (req, res, next) { 
    var eventHtml="";
    if (res.locals.title)
    {
        //send event
        sendEvent(res.locals.title, res.locals.text, res.locals.severity,false,1000);
        eventHtml = `<h3>Sent ${res.locals.eventType} event</h3>
        <p>
        <ul>
            <li>Title: ${res.locals.title}</li>
            <li>Text: ${res.locals.text}</li>
        </ul>
        </p>
        `;
    }

    res.locals.html=Utils.getHTML("Instana testing",`<h2>Instana testing</h2>
        <p>
        Instana incident is enabled: ${Data.state.instanaincident}
        </p>
        ${eventHtml}
        <p>
        Change events sent: ${eventsSentChange}<br/>
        Warning events sent: ${eventSentWarning}<br/>
        Critical events sent: ${eventSentCritical}<br/>
        </p>
        <p>
        Events sent to <a href="https://www.instana.com/docs/api/agent" target="_blank">Instana agent REST API</a>.<br/>
        Default agent REST API URL: <i>http://${agentHost}:${agentPort}${agentPath}</i>
        </p>
        <p>
        ${new Date().toISOString()}
        </p>

        `);    
    next();
});

router.use(function (req, res, next) { 

    var html=null;
    if (res.locals.html)
    {
        html = res.locals.html
    }
    else
    {
        html = "no html, check the code";
    }
    res.writeHead(200, {'content-type' : 'text/html'});
    res.write(html);
    res.end();

});

export { router };
