//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';


var router = express.Router();

//directory to hold files
var fileDir="/data"


//list files in file directory
router.get('/', function(req, res) {
    let html = getHTML(endpointJson)
    res.writeHead(200, {'content-type' : 'text/html'});
    res.write(html);
    res.end();
});

export { router};
