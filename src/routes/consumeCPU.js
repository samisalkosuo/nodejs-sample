//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import {debug,log,error} from '../utils/logger.js';
import {Data} from '../utils/data.js';

var router = express.Router();

const util = require('util');
const exec = util.promisify(require('child_process').exec);

//consume all CPU
async function consumeCPU() {
  try {
      const { stdout, stderr } = exec('sh ./scripts/consume_cpu.sh');
  }catch (err) {
     error(err);
  };
};

async function topCPU(res) {
    try {
        const { stdout, stderr } = await exec('top -b -n 1');
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write(`${stdout}`);
        res.end();
    }catch (err) {
       error(err);
       res.writeHead(500, {"Content-Type": "text/plain"});
       res.write(`${err}`);
       res.end();
   };
  };

async function stopConsumeCPU(res) {
    try {
        const { stdout, stderr } = await exec('sh ./scripts/consume_cpu_stop.sh');
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write(`${stdout}`);
        res.end();
    }catch (err) {
       error(err);
       res.writeHead(500, {"Content-Type": "text/plain"});
       res.write(`${err}`);
       res.end();
   };
  };

router.get('/', function(req, res) {
    topCPU(res);
});

router.get('/start', function(req, res) {
    consumeCPU();
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Consumimg CPU...");
    res.end();
});

router.get('/stop', function(req, res) {
    stopConsumeCPU(res);
});

export { router};
