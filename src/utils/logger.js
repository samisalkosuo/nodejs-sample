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

export function debug(...args) {
    if (process.env.DEBUG) {
        let now = (new Date()).toISOString();
        console.log(`${now} DEBUG `, getString(args));
    }
};

export function log(...args) {
    let now = (new Date()).toISOString();
    console.log(`${now} `, getString(args));
};

export function error(...args) {
    let now = (new Date()).toISOString();
    console.log(`${now} ERROR `, getString(args));
};
