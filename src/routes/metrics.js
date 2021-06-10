import express from 'express';
import { debug } from '../utils/logger.js';
import { Data } from '../utils/data.js';


var router = express.Router();


String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};

/*
ICP/Prometheus custom metrics endpoint
use: /metrics
*/
router.get('/', function (req, res) {

  // metrics label naming
  // https://prometheus.io/docs/practices/naming/

  //generate metrics data 
  //https://prometheus.io/docs/instrumenting/exposition_formats/

  var metric_prefix = Data.state.appName.replace(/[^a-zA-Z0-9]+/g, "_");
  var timestamp = (new Date()).getTime();
  var metricsData = '# HELP {0}_test_requests_total Total number of HTTP requests to /test endpoint.\n\
# TYPE {0}_test_requests_total counter\n\
{0}_test_requests_total {1} {2}\n\n\
'.format(metric_prefix, Data.state.testRequests, timestamp);

  metricsData = metricsData + '# HELP {0}_root_requests_total Total number of HTTP requests to / endpoint.\n\
# TYPE {0}_root_requests_total counter\n\
{0}_root_requests_total {1} {2}\n\n\
'.format(metric_prefix, Data.state.rootRequests, timestamp);

  metricsData = metricsData + '# HELP {0}_calculatepi_requests_total Total number of HTTP requests to /calculatepi endpoint.\n\
# TYPE {0}_calculatepi_requests_total counter\n\
{0}_calculatepi_requests_total {1} {2}\n\n\
'.format(metric_prefix, Data.state.calculatePiRequests, timestamp);

  res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
  res.write(metricsData, "utf-8");
  res.end();

});

export { router };