import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';

var router = express.Router();

function serverKilled()
{
    log(`Server killed`);
}

router.get("/",function(req, res) {
    let now = (new Date()).toISOString();
    var html = `<html><body>
<h2>Server killed at ${now}</h2>
</body></html>`;
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(html);
    res.end();
    req.app.server.close(serverKilled);
});

export { router};
