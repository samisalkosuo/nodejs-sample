import express from 'express';
import {debug} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';


var router = express.Router();

router.get('/', function(req, res) {
    Data.setState ({ testRequests: Data.state.testRequests + 1 })     
    let now = (new Date()).toISOString();
    res.writeHead(200, {"Content-Type": "text/html"});
    const html = Utils.getPreHTML("Test page",`${now}: successful test requests: ${Data.state.testRequests}`);
    res.write(html);
    res.end();
});

export { router};