import express from 'express';
import {debug} from '../utils/logger.js';
import {Data} from '../utils/data.js';


var router = express.Router();

router.get('/', function(req, res) {
    Data.setState ({ rootRequests: Data.state.rootRequests + 1 }) 
    //rootRequests = rootRequests + 1
    //var now = (new Date()).getTime();
    var now = new Date().toISOString();
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<html><body>");
    res.write("<h2>App name: "+Data.state.appName+"</h2>");
    res.write('<a href="/test">Test link</a><br/>');    
    res.write(`<br/><p>Current time UTC: ${now}<br/>Build time: ${Data.state.buildTime}</p>`);
    res.write("</body></html>");
    res.end(); 

});

export { router};