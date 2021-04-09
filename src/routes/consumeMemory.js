//code copied shamelessly from https://github.com/Data-Wrangling-with-JavaScript/nodejs-memory-test
//credits to where credits belong


import express from 'express';
import {debug,log,trace} from '../utils/logger.js';
import {Data} from '../utils/data.js';
import * as Utils from '../utils/utils.js';

var router = express.Router();

//
// Keep allocations referenced so they aren't garbage collected.
//
var allocations = []; 
var allocations500MB = []; 

var allocatedMemory = null;
var allocatedMemory500MB = null;

var stopAllocatingMemory = false;

const field = 'heapUsed';


function getAllocatedMemoryGB()
{
    const mu = process.memoryUsage();
    trace(mu);
    const gb = mu[field] / 1024 / 1024 / 1024;
    return gb;
}

//
// Allocate a certain size to test if it can be done.
//
function alloc (size) {
    const numbers = size / 8;
    const arr = []
    arr.length = numbers; // Simulate allocation of 'size' bytes.
    for (let i = 0; i < numbers; i++) {
        arr[i] = i;
    }
    return arr;
};

//
// Allocate successively larger sizes, doubling each time until we hit the limit.
//
function allocToMax () {

    debug("Start allocating...");
    const gbStart = getAllocatedMemoryGB();
    allocatedMemory = `Allocated ${Math.round(gbStart * 100) / 100} GB`
    log(allocatedMemory);

    let allocationStep = 200 * 1024;
    var i = 0;

    function consumeMemory()
    {
        // Allocate memory.
        const allocation = alloc(allocationStep);

        // Allocate and keep a reference so the allocated memory isn't garbage collected.
        allocations.push(allocation);

        // Check how much memory is now allocated.
        const mbNow = getAllocatedMemoryGB()

        i = i + 1

        if (i % 500 == 0)
        {
            allocatedMemory = `Allocated ${Math.round((mbNow - gbStart) * 100) / 100} GB`
            log(allocatedMemory);
        }
        if (stopAllocatingMemory == false)
        {
            setTimeout(consumeMemory, 1);
        }
    };

    //start consuming memory
    setTimeout(consumeMemory, 1);

};

function allocTo500MB () {

    debug("Start allocating...");
    const gbStart = getAllocatedMemoryGB()//mu[field] / 1024 / 1024 / 1024;
    allocatedMemory500MB = `Allocated ${Math.round(gbStart * 100) / 100} GB`
    log(allocatedMemory500MB);

    let allocationStep = 200 * 1024;
    var i = 0;

    function consumeMemory()
    {
        // Allocate memory.
        const allocation = alloc(allocationStep);

        // Allocate and keep a reference so the allocated memory isn't garbage collected.
        allocations500MB.push(allocation);

        // Check how much memory is now allocated.
        const mbNow = getAllocatedMemoryGB();

        i = i + 1

        if (i % 500 == 0)
        {
            allocatedMemory500MB = `Allocated ${Math.round((mbNow - gbStart) * 100) / 100} GB`
            log(allocatedMemory500MB);
        }
        trace(`mbNow - gbStart ${mbNow - gbStart}`);
        if ((mbNow - gbStart) < 0.5)
        {
            setTimeout(consumeMemory, 1);
        }
    };

    //start consuming memory
    setTimeout(consumeMemory, 1);

};

router.get('/', function(req, res) {
    const gbStart = getAllocatedMemoryGB();
    var allocatedMemory = `Allocated ${Math.round(gbStart * 100) / 100} GB`

    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(Utils.getPreHTML("allocated memory",allocatedMemory));
    res.end();

});

router.get('/start', function(req, res) {
    log(`Start consuming memory...`);
    if (allocatedMemory == null || stopAllocatingMemory == true)
    {
        stopAllocatingMemory = false;
        setTimeout(allocToMax, 10);
    }

    res.writeHead(200, {"Content-Type": "text/html"});
    if (allocatedMemory)
    {
        res.write(Utils.getPreHTML("allocated memory",allocatedMemory));
    }
    else
    {
        res.write(Utils.getPreHTML("allocated memory","Consumimg memory..."));
    }
    res.end();

});

router.get('/stop', function(req, res) {
    log(`Stop consuming memory...`);
    stopAllocatingMemory = true;
    const gbStart = getAllocatedMemoryGB();
    var content = `Allocated ${Math.round(gbStart * 100) / 100} GB`
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(Utils.getPreHTML("allocated memory",content));
    res.end();

});



router.get('/500mb', function(req, res) {
    log(`Consuming memory to 500MB...`);
    if (allocatedMemory500MB==null)
    {
        setTimeout(allocTo500MB, 10);
    }
    res.writeHead(200, {"Content-Type": "text/html"});
    if (allocatedMemory500MB)
    {
        res.write(Utils.getPreHTML("allocated memory",allocatedMemory500MB));
    }
    else
    {
        res.write(Utils.getPreHTML("allocated memory","Consumimg memory..."));
    }
    res.end();

});

router.get('/free', function(req, res) {
    debug(`Free allocated memory...`);
    allocations = null; 
    allocations500MB = null;
    allocatedMemory = null;
    allocatedMemory500MB = null;
    allocations = []; 
    allocations500MB = [];
    debug("Calling GC...");
    global.gc();

    const gbStart = getAllocatedMemoryGB();
    var content = `Allocated ${Math.round(gbStart * 100) / 100} GB`

    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(Utils.getPreHTML("free allocated memory",content));
    res.end();

});


export { router };
