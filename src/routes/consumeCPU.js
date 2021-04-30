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

async function consumeCPUStop() {
    try {
        const { stdout, stderr } = await exec('sh ./scripts/consume_cpu_stop.sh');
    }catch (err) {
       error(err);
    };
  };
  
async function getTop()
{
    const { stdout, stderr } = await exec('top -b -n 1');
    return stdout;
}

router.get('/', async function(req, res) {
    try{
        const top = await getTop();
        var html = Utils.getHTML(`Consume CPU`,`
        <h2>Consume CPU</h2>
        <p>Consuming CPU: ${consumeCPUStarted}</p>
        <p>Currently running processes:</p>
        <pre>
${top}
        </pre>
            `);
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(html);
        res.end(); 

    }catch (err) {
    error(err);
    res.writeHead(500, {"Content-Type": "text/plain"});
    res.write(`${err}`);
    res.end();
};
});

router.get('/start', function(req, res) {

    if (consumeCPUStarted == false)
    {
        consumeCPUStarted = true;
        consumeCPU();
    }
    res.redirect(req.baseUrl);
});

router.get('/stop', function(req, res) {
    if (consumeCPUStarted == true)
    {
        consumeCPUStarted = false;
        consumeCPUStop();
    }
    res.redirect(req.baseUrl);
});

export { router};
