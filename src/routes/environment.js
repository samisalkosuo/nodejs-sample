import express from 'express';
import {debug} from '../utils/logger.js';

var router = express.Router();

// define the home page route
router.get('/', function (req, res) {
    //list environment variables
    res.writeHead(200, {"Content-Type": "text/plain"});
    Object.entries(process.env).forEach(([key, value]) => {
        res.write(`${key}=${value}\n`);
     });    
    res.end();

})

export { router};