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
     res.writeHead(200, {"Content-Type": "text/html"});
     const html = Utils.getPreHTML("Environment variables",`${variables}`);
     res.write(html);
     res.end();

})

export { router};