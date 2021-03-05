import express from 'express';
import {debug} from '../utils/logger.js';
import {Data} from '../utils/data.js';


var router = express.Router();

router.get('/', function(req, res) {
    Data.setState ({ testRequests: Data.state.testRequests + 1 }) 
    let now = (new Date()).toISOString();
    res.send(`${now}: successful test requests: ${Data.state.testRequests}`);
});

export { router};