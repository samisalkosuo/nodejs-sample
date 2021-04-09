import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

function serverKilled()
{
    log(`Server killed`);
}

router.get("/",function(req, res) {
    let now = (new Date()).toISOString();
    const html = `<h2>Server killed at ${now}</h2>`;
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(Utils.getHTML("kill server",html));
    res.end();
    req.app.server.close(serverKilled);
});

export { router};
