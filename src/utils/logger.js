export function debug (...args)  {
    if (process.env.DEBUG)
    {
        let now = (new Date()).toISOString();
        console.log(`${now} DEBUG ` ,args);
    }
};

