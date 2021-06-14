//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

var bodyParser = require('body-parser');
import express from 'express';
import { debug, log } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';


var router = express.Router();

router.use(express.text({type:"*/*"}));

router.get('/', function (req, res,next) {
    next();
});

router.post('/', function (req, res,next) {
    next();
});

router.use(function (req, res,next) {

    var headerStrings = [];
    Object.entries(req.headers).forEach(([key, value]) => {
        headerStrings.push(`  ${key}: ${value}`);
     });
     
    var requestInfo = `Hostname: ${req.hostname} (${req.ip})
Request: ${req.method} ${req.originalUrl}
Headers:
${headerStrings.join("\n")}
Body:
${req.body}`
;    
    debug("Echo - request",requestInfo.split("\n"));
    //console.log(req.body);
    var html = Utils.getHTML(`Echo`, `
    <h2>Echo</h2>
    <pre>
${requestInfo}
    </pre>
    <p>
    ${new Date().toISOString()}
    </p>

`);
    res.writeHead(200, { 'content-type': 'text/html' });
    res.write(html);
    res.end();
});

export { router };
