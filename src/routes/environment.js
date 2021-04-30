import express from 'express';
import {debug} from '../utils/logger.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

// define the home page route
router.get('/', function (req, res) {
    //list environment variables
    var variables = "";
    Object.entries(process.env).forEach(([key, value]) => {
        variables = variables + `${key}=${value}\n`
     });    
     //const html = Utils.getPreHTML("Environment variables",`${variables}`);
     var html = Utils.getHTML(`Environment variables`,`
     <h2>Environment variables</h2>
     <pre>
${variables}
     </pre>
         `);
 
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(html);
     res.end();

})

export { router};