//code copied shamelessly from http://ajennings.net/blog/a-million-digits-of-pi-in-9-lines-of-javascript.html
//credits to where credits belong


import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

router.get('/', function(req, res) {
    log(`Calculating pi...`);
    Data.setState ({ calculatePiRequests: Data.state.calculatePiRequests + 1 }) 
    var digits = BigInt(Utils.getRndInteger(31,20000));
    debug(`req.query.digits: ${req.query.digits}`);
    if (req.query.digits)
    {
        digits = BigInt(req.query.digits);
    }
    log(`Calculating ${digits} digits of pi...`);
    let startTime = Date.now();
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
    let endTime = Date.now();
    let elapsedSecs = (endTime - startTime)/1000.0;

    log(`Calculating ${digits} digits of pi...done.`);
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write(`${digits} digits of Pi calculated in ${elapsedSecs} seconds:\n\n`, "utf-8");
    res.write(`${piDigits}`, "utf-8");
    res.end(); 

});

export { router};
