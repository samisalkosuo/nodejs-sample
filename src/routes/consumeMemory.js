//code copied shamelessly from https://github.com/Data-Wrangling-with-JavaScript/nodejs-memory-test
//credits to where credits belong


import express from 'express';
import {debug,log} from '../utils/logger.js';
import {Data} from '../utils/data.js';

var router = express.Router();

//
// Keep allocations referenced so they aren't garbage collected.
//
const allocations = []; 

var allocatedMemory = null;

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

    const field = 'heapUsed';
    const mu = process.memoryUsage();
    debug(mu);
    const gbStart = mu[field] / 1024 / 1024 / 1024;
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
        const mu = process.memoryUsage();
        const mbNow = mu[field] / 1024 / 1024 / 1024;

        i = i + 1

        if (i % 500 == 0)
        {
            allocatedMemory = `Allocated ${Math.round((mbNow - gbStart) * 100) / 100} GB`
            log(allocatedMemory);
        }
        setTimeout(consumeMemory, 1);
    };

    //start consuming memory
    setTimeout(consumeMemory, 1);

    // Infinite loop, never get here.
};

router.get('/', function(req, res) {
    log(`Consuming memory...`);
    setTimeout(allocToMax, 10);
    res.writeHead(200, {"Content-Type": "text/plain"});
    if (allocatedMemory)
    {
        res.write(allocatedMemory);
    }
    else
    {
        res.write("Consumimg memory...");
    }
    res.end();

});

export { router};
