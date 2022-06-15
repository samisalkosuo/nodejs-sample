//these two lines needed to use require in Node.js >14
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import { debug, log, error } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';
import * as SystemInformation from 'systeminformation';
const si = require('systeminformation');
const fs = require('fs');
//import { existsSync, realpathSync } from 'fs';

var router = express.Router();

var fsInfo = null;
var writingFile = false;

//directory to hold files
var dataDir = fs.existsSync("/data") == true ? "/data" : fs.realpathSync(".");

//return line of 1 or 0 characters
function getLine(chars = 128) {
    var dataArray = [];
    for (let index = 0; index < chars - 1; index++) {

        var data = Math.random() < 0.5 ? "1" : "0";
        dataArray.push(data);

    }
    dataArray.push("\n");
    return dataArray.join('');

}
function startWritingFile(totalMB = 1)
{
    if (writingFile == false) {
        writingFile = true;
        setTimeout(function() {
            writeFile(totalMB);
        }, 100);
    }

}

function writeFile(totalMB = 1) {
    var bytesToWritePerLine = 1024;
    var totalLines = 1024;
    var i = totalLines * totalMB; //1 MB
    debug('enter function writeFile()');
    let writer = fs.createWriteStream(`${dataDir}/${(new Date()).toISOString()}.txt`);
    do {
        i--;
        var data = getLine(bytesToWritePerLine);
        if (i === 0) {
            // Last time!
            writer.write(data, "utf8", () => {
                writingFile = false;
                debug('wrote file');
            });
        } else {
            // See if we should continue, or wait.
            // Don't pass the callback, because we're not done yet.
            writer.write(data, "utf8");
        }
    } while (i > 0);
}


async function getFSInfo(req, res, next) {
    try {
        const data = await si.fsSize();
        /*
        file system info 
        for example:
[
  {
    "fs": "C:",
    "type": "NTFS",
    "size": 506072133632,
    "used": 475832754176,
    "available": 30239379456,
    "use": 94.02,
    "mount": "C:"
  }
]
        */
        return data;

    }
    catch (e) {
        error(e);
        return null;
    }


}

function getTableRow(columns, isHeader) {
    var row = "<tr>";
    columns.forEach(text => {
        row = row + `<td>`;
        if (isHeader == true) {
            row = row + `<b>`;
        }
        row = row + `${text}`;
        if (isHeader == true) {
            row = row + `</b>`;
        }
        row = row + `</td>`;
    });
    row = row + "</tr>";
    return row;
}

router.get('/', async function (req, res, next) {

    next();
});

router.get('/dir', async function (req, res, next) {

    var html = "<table>";
    html = html + getTableRow(["File name", "File size"], true);
    var files = fs.readdirSync(dataDir);
    files.forEach(file => {
        var stats = fs.statSync(dataDir + "/" + file);
        debug(stats);
        html = html + getTableRow([file, Utils.formatBytes(stats.size)]);

    });
    html = html + "</table>";
    res.locals.dir = html;
    next();
});

router.get('/fsinfo', async function (req, res, next) {

    var fsInfo = await getFSInfo(req, res, next);
    var fsHtml = "";
    if (fsInfo != null) {
        fsHtml = "<h3>Filesystem info</h3><p><table>";
        fsHtml = fsHtml + getTableRow(["Mount point", "File system", "Type", "Used %", "Free", "Used", "Size"], true);
        fsInfo.forEach(fs => {
            fsHtml = fsHtml + getTableRow([fs.mount, fs.fs, fs.type, `${fs.use}%`,
            Utils.formatBytes(fs.available),
            Utils.formatBytes(fs.used),
            Utils.formatBytes(fs.size)],
                false);
        });

        fsHtml = fsHtml + "</table></p>";
    }
    res.locals.fsinfo = fsHtml;
    next();
});

router.get('/write/1mb', async function (req, res, next) {
    startWritingFile(1);
    res.redirect(req.baseUrl);
});

router.get('/write/10mb', async function (req, res, next) {
    startWritingFile(10);
    res.redirect(req.baseUrl);
});

router.get('/write/100mb', async function (req, res, next) {
    startWritingFile(100);
    res.redirect(req.baseUrl);
});

router.use(function (req, res, next) {
    //write html
    var html = "";
    if (res.locals.fsinfo) {
        html = res.locals.fsinfo;
    }
    if (res.locals.dir) {
        html = res.locals.dir;
    }
    var html = Utils.getHTML(`Files`, `
    <h2>Files</h2>
    <p>
    Writing file: ${writingFile}
    </p>
    <p>
    Data dir: ${dataDir}
    </p>
    ${html}
    <p>
    ${new Date().toISOString()}
    </p>
    `);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
    res.end();
});


export { router };
