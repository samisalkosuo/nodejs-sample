import express from 'express';
import {debug} from '../utils/logger.js';


var router = express.Router();

// define the home page route
router.get('/', function (req, res) {
    //Kubernetes health probe endpoint
    //any code 200 >= code < 400 is success
    //all other fail

    debug("healthcheck");
    //do some status check and set status code
    var statusCode=204//no content
    res.writeHead(statusCode);
    res.end(); 
})

export { router};