import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const all_routes = require('express-list-endpoints');

import express from 'express';
import { debug, trace, logapi_log } from '../utils/logger.js';
import { Data } from '../utils/data.js';



var router = express.Router();

//common routes for all requests

router.use(function (req, res, next) {

    //store endpoints to state
    if (Data.state.endpointlinks == null) {
        let endpointJson = all_routes(req.app);
        var endpoints = [];
        endpointJson.forEach(endpoint => {
            debug("Endpoint:", endpoint);
            endpoint.methods.forEach(method => {
                if (method === "GET")
                {
                    let pathStr = JSON.stringify(endpoint.path).replaceAll("\"", "");
                    endpoints.push(`<a href="${pathStr}">${pathStr}</a>`);    
                }
            });
        });
        endpoints.sort();
        var endpointSubPaths = [];
        var ej2 = endpointJson;
        endpointJson.forEach(endpoint => {
            let pathStr = JSON.stringify(endpoint.path).replaceAll("\"", "");
            ej2.forEach(endpoint2 => {
                let pathStr2 = JSON.stringify(endpoint2.path).replaceAll("\"", "");
                if (pathStr2.lastIndexOf(pathStr) > 0) {
                    if (pathStr2.startsWith(pathStr)) {
                        endpointSubPaths.push(pathStr2);
                    }

                }
            });
        });

        //remove subpaths from links (subpaths like /consumecpu/start)
        endpointSubPaths.forEach(subpath => {
            endpoints = endpoints.filter(item => item.indexOf(subpath) == -1)
        });

        Data.setState({ endpointsubpaths: endpointSubPaths });
        Data.setState({ endpointlinks: endpoints });
    }

    //add url to state, used to check navigation links
    Data.setState({ requestpath: req.originalUrl });

    trace("request URL", req.get('host'), req.method, req.originalUrl);
    logapi_log("request URL", req.method, req.originalUrl);
    next();
})

export { router };
