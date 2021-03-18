import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';

var router = express.Router();

router.get('/', function(req, res) {
    log(`Server hangs. Application will never respond nor recover. Kill the process/container.`);
    while(true);
});

export { router};
