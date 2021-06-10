
import express from 'express';
import { debug, error } from '../utils/logger.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

// define the home page route
router.get('/', function (req, res) {

        var notfoundHtml = `<h1>404</h1><p>${req.baseUrl} does not exist</p>`;
        var html = Utils.getHTML("error 404", notfoundHtml);
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write(html);
        res.end();

})

export { router };