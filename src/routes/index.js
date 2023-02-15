
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
<p>VERSION: ${process.env.PACKAGE_VERSION}</p>
<p>
    <a href="/test">Test page</a><br/>
    <a href="/calculatepi">Calculate digits of Pi</a><br/>
    <a href="/systeminfo">System info</a><br/>
    <a href="/endpoints">Endpoints</a><br/>
</p>
<p>
Build time: ${Data.state.buildTime}
</p>
<p>
Current time UTC: ${now}<br/>
</p>
`;
    return Utils.getHTML("home", html);
};

router.get('/', function (req, res) {
    Data.setState({ rootRequests: Data.state.rootRequests + 1 });

    var html = getHTML();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});

export { router };