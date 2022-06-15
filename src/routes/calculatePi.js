//code copied shamelessly from http://ajennings.net/blog/a-million-digits-of-pi-in-9-lines-of-javascript.html
//credits to where credits belong


import express from 'express';
import { debug, log } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

function calculatePiDigits(digits) {
    let i = 1n;
    //let x = 3n * (10n ** 1020n);
    let x = 3n * (10n ** (digits + 20n));
    let pi = x;
    while (x > 0) {
        x = x * i / ((i + 1n) * 4n);
        pi += x / (i + 2n);
        i += 2n;
    }
    let piDigits = pi / (10n ** 20n);
    return piDigits;
}

router.get('/', function (req, res) {
    debug(`Calculating pi...`);
    Data.setState({ calculatePiRequests: Data.state.calculatePiRequests + 1 })
    var digits = BigInt(Utils.getRndInteger(31, 20000));
    debug(`req.query.digits: ${req.query.digits}`);
    if (req.query.digits) {
        digits = BigInt(req.query.digits);
    }
    debug(`Calculating ${digits} digits of pi...`);
    let startTime = Date.now();
    let piDigits = calculatePiDigits(digits);
    let endTime = Date.now();
    let elapsedSecs = (endTime - startTime) / 1000.0;

    debug(`Calculating ${digits} digits of pi...done.`);
    var html = Utils.getHTML(`PI ${digits} digits`, `
    <h2>PI digits</h2>
    <p>
    Digits: ${digits} (set 'digits' parameter set number of digits, /calculatepi?digits=20000)
    </p>
    <p>
    Calculated in ${elapsedSecs} seconds.
    </p>
    <pre>
    ${piDigits}
    </pre>
        `);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();

});

export { router };
