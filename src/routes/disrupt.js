import express from 'express';
import { debug, log } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

var serverStatus = "normal";

function serverKilled() {
    log(`Server killed`);
}

function killServer(req) {
    function _killServer() {
        req.app.server.close(serverKilled);
    }
    setTimeout(_killServer, 1000);
}

function hangServer() {
    function _hangServer() {
        log("Server hangs. Recovery is not possible. Kill this process.");
        while (true);
    }
    setTimeout(_hangServer, 1000);
}

router.get("/", function (req, res) {
    const html = Utils.getHTML("Distrupt server", `<h2>Disrupt server</h2>
    <p>Server status: ${serverStatus}</p>
    <p>
    ${new Date().toISOString()}
    </p>        
    `);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();
});

router.get("/kill-server", function (req, res) {
    serverStatus = "server killed"
    killServer(req);
    res.redirect(req.baseUrl);
});

router.get('/hang-server', function (req, res) {
    serverStatus = "server hangs (it will never respond nor recover, kill the process/container)"
    hangServer();
    res.redirect(req.baseUrl);
    //log(`Server hangs. Application will never respond nor recover. Kill the process/container.`);
    //while(true);
});

export { router };
