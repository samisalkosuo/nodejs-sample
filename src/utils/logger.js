import { Data } from '../utils/data.js';

function getString(argArray) {
    //if argArray includes only string, return as it is
    //otherwise prettypring array objects
    var isObject = false;
    argArray.forEach(element => {
        if (typeof element != 'string') {
            isObject = true;
        }
    });

    if (isObject == true) {
        //argArray = JSON.stringify(argArray);
        argArray = JSON.stringify(argArray, undefined, 2);
    }

    return argArray
}

function addLogEntry(msg) {
    if (process.env.LOGAPI_ENABLED === 'true') {
        var logEntries = Data.state.logEntries
        let entry = {
            "@timestamp": Date.now(),
            application: Data.state.appName,
            "@rawstring": msg
        };
        logEntries.push(entry);
        Data.setState({ logEntries: logEntries });
    }
}

export function debug(...args) {
    if (process.env.DEBUG === 'true') {
        let now = (new Date()).toISOString();
        console.log(`${now} DEBUG `, getString(args));
    }


};

export function logapi_log(...args) {
    addLogEntry(`${getString(args).join(" ")}`)
};

export function trace(...args) {
    if (process.env.TRACE === 'true') {
        let now = (new Date()).toISOString();
        console.log(`${now} TRACE `, getString(args));
    }
};


export function log(...args) {
    let now = (new Date()).toISOString();
    console.log(`${now} `, getString(args));
};

export function error(...args) {
    let now = (new Date()).toISOString();
    console.log(`${now} ERROR `, getString(args));
    addLogEntry(`ERROR ${getString(args).join(" ")}`)
};
