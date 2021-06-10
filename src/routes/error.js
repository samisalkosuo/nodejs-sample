import express from 'express';
import { debug, error } from '../utils/logger.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

// define the home page route
router.get('/', function (req, res) {
     try {
          //javascript error
          const html = Utils.getPreHTML("error", `${variableThatDoesNotExist}`);
     } catch (err) {
          error(`${err}`);
          var errorHtml = `<h2>500 Internal Server Error</h2><p>${err}</p>`;
          var html = Utils.getHTML("error 500", errorHtml);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.write(html);
          res.end();
     };

})

export { router };