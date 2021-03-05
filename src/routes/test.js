import express from 'express';
import {debug} from '../utils/logger.js';
import {Data} from '../utils/data.js';


var router = express.Router();

router.get('/test', function(req, res) {
    Data.setState ({ testRequests: Data.state.testRequests + 1 }) 
//    testRequests = testRequests + 1
    var now = (new Date()).getTime();
    res.send('Successful test requests: '+now);

});

export { router};