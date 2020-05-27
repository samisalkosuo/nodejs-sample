//------------------------------------------------------------------------------
// node.js  application 
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// catch SIGINT and SIGTERM and exit
// Using a single function to handle multiple signals
function handle(signal) {
    console.log(`Received ${signal}. Exiting...`);
    process.exit(1)
  }  
//SIGINT is typically CTRL-C
process.on('SIGINT', handle);
//SIGTERM is sent to terminate process, for example docker stop sends SIGTERM
process.on('SIGTERM', handle);


var appName = process.env.APP_NAME || "nodejs-sample";
var serverPort = 6001;
var DEBUG = process.env.DEBUG || false;

// create a new express server
var app = express();

var rootRequests = 0
var testRequests = 0


String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
      if (m == "{{") { return "{"; }
      if (m == "}}") { return "}"; }
      return args[n];
    });
  };


app.get('/', function(req, res) {
    rootRequests = rootRequests + 1
    //var now = (new Date()).getTime();
    var now = new Date().toISOString();
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<html><body>");
    res.write("<h2>App name: "+appName+"</h2>");
    res.write('<a href="/test">Test link</a><br/>');
    res.write(`<br/><p>Current time UTC: ${now}</p>`);
    res.write("</body></html>");
    res.end(); 

});


app.get('/health', function(req, res) {
    //Kubernetes health probe endpoint
    //any code 200 >= code < 400 is success
    //all other fail

    //do some status check and set status code
    var statusCode=204//no content
    
    res.writeHead(statusCode);
    res.end(); 

});


app.get('/test', function(req, res) {
    testRequests = testRequests + 1
    var now = (new Date()).getTime();
    res.send('Successful test requests: '+now);

});


/*
ICP/Prometheus custom metrics endpoint
*/
app.get('/metrics', function(req, res) {

    // metrics label naming
    // https://prometheus.io/docs/practices/naming/

    //generate metrics data 
    //https://prometheus.io/docs/instrumenting/exposition_formats/

    var metric_prefix=appName.replace(/[^a-zA-Z0-9]+/g,"_");
    var timestamp = (new Date()).getTime();    
    var metricsData='# HELP {0}_test_requests_total Total number of HTTP requests to /test endpoint.\n\
# TYPE {0}_test_requests_total counter\n\
{0}_test_requests_total {1} {2}\n\n\
'.format(metric_prefix,testRequests,timestamp);

    metricsData=metricsData+'# HELP {0}_root_requests_total Total number of HTTP requests to / endpoint.\n\
# TYPE {0}_root_requests_total counter\n\
{0}_root_requests_total {1} {2}\n\n\
'.format(metric_prefix,rootRequests,timestamp);

    res.writeHead(200, {"Content-Type": "text/plain; version=0.0.4"});
    res.write(metricsData, "utf-8");
    res.end(); 

});


const server = app.listen(serverPort, "0.0.0.0", function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Server started and listening http://'+host+':'+port)
});

if (DEBUG == "true")
{
    server.on('connection', function(socket) {
        console.log(`new connection, remote address: ${socket.remoteAddress}`);
    });
}
