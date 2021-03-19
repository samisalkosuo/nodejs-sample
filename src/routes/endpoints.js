//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';

const all_routes = require('express-list-endpoints');

var router = express.Router();


function getHTML(endpointJson) {

    var endpoints = [];
    endpointJson.forEach(endpoint => {
        endpoint.methods.forEach(method => {
            let methodStr = JSON.stringify(method).replaceAll("\"","");
            let pathStr = JSON.stringify(endpoint.path).replaceAll("\"","");
            endpoints.push(`<a href="${pathStr}">${methodStr} ${pathStr}</a></br/>`)
        debug(`${method} ${endpoint.path}`)
        });
    });

    var html = `<html><head><meta charset="UTF-8"><title>${Data.state.appName} - endpoints</title></head><body>
<h2>${Data.state.appName} - endpoints</h2>
    <p>
    ${endpoints.join("\n")}
    </p>
</body>
</html>
    `;
    return html
};

router.get('/', function(req, res) {
    let endpointJson = all_routes(req.app);
    let html = getHTML(endpointJson)
    res.writeHead(200, {'content-type' : 'text/html'});
    res.write(html);
    res.end();
});

export { router};
