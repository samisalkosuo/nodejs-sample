//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const all_routes = require('express-list-endpoints');

import express from 'express';
import { debug, error } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

function getHTML() {
    var now = new Date().toISOString();

    var html = `
<h2>App name: ${Data.state.appName}</h2>
<p>Hello World!</p>
<a href="/test">Test page</a><br/>
<a href="/calculatepi">Calculate digits of Pi</a><br/>
<a href="/systeminfo">System info</a><br/>
<a href="/endpoints">Endpoints</a><br/>
<br/>
<p>
Current time UTC: ${now}<br/>
Build time: ${Data.state.buildTime}
</p>
`;
    return Utils.getHTML("home",html);
};

function getEndPoints(req)
{
    //store endpoints to state
    if (Data.state.endpointlinks == null)
    {
        let endpointJson = all_routes(req.app);
        var endpoints = [];
        endpointJson.forEach(endpoint => {
            endpoint.methods.forEach(method => {
                let pathStr = JSON.stringify(endpoint.path).replaceAll("\"","");
                endpoints.push(`<a href="${pathStr}">${pathStr}</a>`)
            });
        });
        endpoints.sort();
        var endpointSubPaths = [];
        var ej2 = endpointJson;
        endpointJson.forEach(endpoint => {
            let pathStr = JSON.stringify(endpoint.path).replaceAll("\"","");
            ej2.forEach(endpoint2 => {
                let pathStr2 = JSON.stringify(endpoint2.path).replaceAll("\"","");
                if (pathStr2.lastIndexOf(pathStr) > 0)
                {
                    if (pathStr2.startsWith(pathStr) )
                    {
                        endpointSubPaths.push(pathStr2);
                        //console.log(pathStr2);
                    }
    
                }
        });
        });
        debug(endpointSubPaths);

        //remove subpaths from links (subpaths like /consumecpu/start)
        endpointSubPaths.forEach(subpath => {
            endpoints = endpoints.filter(item => item.indexOf(subpath) == -1 )

        });

        Data.setState({ endpointsubpaths: endpointSubPaths });
        Data.setState({ endpointlinks: endpoints });
    }


}

router.get('/', function (req, res) {
    Data.setState({ rootRequests: Data.state.rootRequests + 1 });
    
    //get all endpoints and save to state
    getEndPoints(req);

    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();
    
});

export { router };