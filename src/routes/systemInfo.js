import express from 'express';
import { debug, error } from '../utils/logger.js';
import { Data } from '../utils/data.js';
import * as Utils from '../utils/utils.js';
import * as SystemInformation from 'systeminformation';

var router = express.Router();

function getHTML(systemData) {
    var now = new Date().toISOString();
    var memFree = Utils.formatBytes(systemData.mem.free);
    var memUsed = Utils.formatBytes(systemData.mem.used);
    var memTotal = Utils.formatBytes(systemData.mem.total);
    var networkHtml = ""
    systemData.networkInterfaces.forEach(element => {
        networkHtml = `${networkHtml}
Network: ${element.iface} ${element.ip4}<br/>
`
    });

    var html = `
<h2>System info</h2>
<p>
OS: ${systemData.osInfo.platform} , ${systemData.osInfo.distro} ${systemData.osInfo.release}<br/>
System: ${systemData.system.model} (${systemData.system.manufacturer} version: ${systemData.system.version})<br/>
Memory: free: ${memFree} used: ${memUsed} total: ${memTotal}<br/>
CPU: ${systemData.cpu.manufacturer} ${systemData.cpu.brand}<br/>
Cores: ${systemData.cpu.cores}<br/>
Hostname: ${systemData.osInfo.hostname}<br/>
FQDN: ${systemData.osInfo.fqdn}<br/>
${networkHtml}
</p>
`;
    return Utils.getHTML("system info",html);
};


router.get('/', function (req, res) {
    
    // define all values, you want to get back
    var valueObject = {
        cpu: 'manufacturer, brand,cores',
        mem: 'free, used, total',
        osInfo: 'platform, distro, release, hostname, fqdn',
        system: 'model, manufacturer, version',
        networkInterfaces: 'iface, ip4 | iface'
    };

    SystemInformation.get(valueObject)
        .then(data => {
            //debug(data);
            //debug(data.networkInterfaces[0].ip4,valueObject);
            var html = getHTML(data);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(html);
            res.end();
        })
        .catch(err => {
            error(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.write(JSON.stringify(err, null, 2));
            res.end();
        });
});

export { router };