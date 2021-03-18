//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';

const all_routes = require('express-list-endpoints');

var router = express.Router();

router.get('/', function(req, res) {
    res.status(200).send(all_routes(req.app));
    //res.writeHead(200, {'content-type' : 'text/plain'});
    //res.end("Endpoints:\n\n"+JSON.stringify(all_routes(app),null,2)+'\n');
});

export { router};
