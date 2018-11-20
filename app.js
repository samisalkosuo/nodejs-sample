//------------------------------------------------------------------------------
// node.js  application 
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var uuid = require('uuid');
var request = require('request');


var totalAnalysisRequests = 0;
var completeAnalysisRequests = 0;

var rootDir = './uploads';
var MIN_TILE_SIZE = 200;

console.log(process.env)
var appName=process.env.APP_NAME;


// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

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
    var now = (new Date()).getTime();

    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<html><body>");
    res.write("<h2>App name: "+appName+"</h2>");
    res.write('<a href="/test">Test link</a><br/>');
    res.write("</body></html>");
    res.end(); 


});


app.get('/health', function(req, res) {

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
ICP/Prometheus Metrics endpoint
*/
app.get('/metrics', function(req, res) {

    // metrics label naming
    // https://prometheus.io/docs/practices/naming/

    //generate metrics data 
    //https://prometheus.io/docs/instrumenting/exposition_formats/
    var metric_prefix=appName.replace("/[^a-zA-Z0-9]+/g","_");
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

    //res.setHeader('content-type', 'text/plain; version=0.0.4');
    //res.send(metricsData)
});

var http = require('http').Server(app);

// start the server
http.listen(appEnv.port, function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

