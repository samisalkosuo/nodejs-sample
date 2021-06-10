import express from 'express';
import { debug } from '../utils/logger.js';


var router = express.Router();

// define the home page route
router.get('/', function (req, res) {
    //Kubernetes health probe endpoint
    //any code 200 >= code < 400 is success
    //all other fail

    //TODO: do some status check and set status code
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("OK");
    res.end();

})

export { router };