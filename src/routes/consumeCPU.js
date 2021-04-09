//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import {debug,log,error} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

const util = require('util');
const exec = util.promisify(require('child_process').exec);

var consumeCPUStarted = false

//consume all CPU
async function consumeCPU() {
  try {
      const { stdout, stderr } = exec('sh ./scripts/consume_cpu.sh');
  }catch (err) {
     error(err);
  };
};

async function getTop()
{
    const { stdout, stderr } = await exec('top -b -n 1');
    return stdout;
}

async function topCPU(res) {
    try {
        const top = await getTop();
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(`${Utils.getPreHTML("top",top)}`);
        res.end();
    }catch (err) {
       error(err);
       res.writeHead(500, {"Content-Type": "text/plain"});
       res.write(`${err}`);
       res.end();
   };
  };

async function startConsumeCPU(res) {
    try {
        consumeCPUStarted = true;
        consumeCPU();
        const content = "Consumimg all available CPU...";
        const top = await getTop();
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(`${Utils.getPreHTML("start consume CPU",`${content}\n\n${top}`)}`);
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
        const top = await getTop();
        res.writeHead(200, {"Content-Type": "text/html"});        
        res.write(`${Utils.getPreHTML("stop consume CPU",`${stdout}\n\n${top}`)}`);
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

    if (consumeCPUStarted == false)
    {
        consumeCPUStarted = true;
        startConsumeCPU(res);
    }
    else
    {
        topCPU(res);
    }
});

router.get('/stop', function(req, res) {
    consumeCPUStarted = false;
    stopConsumeCPU(res);
});

export { router};
