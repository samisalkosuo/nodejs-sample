import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

import { Data } from '../utils/data.js';
import { debug, trace } from './logger.js';

function getInstanaIntegration() {
    //http://instana.forum.fi.ibm.com:2999
    //sCxck5r4TIKb3mGXIkHE_g
    var instanaHtml = "";
    if (process.env.INSTANA_URL && process.env.INSTANA_KEY) {
        instanaHtml = `<script>
(function(s,t,a,n){s[t]||(s[t]=a,n=s[a]=function(){n.q.push(arguments)},
n.q=[],n.v=2,n.l=1*new Date)})(window,"InstanaEumObject","ineum");
      
ineum('reportingUrl', '${process.env.INSTANA_URL}');
ineum('key', '${process.env.INSTANA_KEY}');
ineum('trackSessions');
</script>
<script defer crossorigin="anonymous" src="${process.env.INSTANA_URL}/eum.min.js"></script>`;
    }
    return instanaHtml;
}

function getCSSStyle() {
    const css = `<style>
body {
  background-color:#282828;
  color:#33ff33;
}  
a:link {
  color: gold;
}
a:visited {
  color: gold;
}
pre {
    overflow-x: auto;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
 }
 table {
    width: 100%;
  }
 </style>`;

    return css;
}

function getEndpointLinks() {
    var linkHtml = "";
    if (Data.state.endpointlinks != null) {
        linkHtml = "<table><tr>"
        var i = 1;
        Data.state.endpointlinks.forEach(element => {
            linkHtml = linkHtml + `<td>${element}</td>`;
            if (i % 4 == 0) {
                linkHtml = linkHtml + "</tr><tr>";

            }
            i = i + 1;
        });

        linkHtml = linkHtml + "</tr></table>"
    }

    //add sub navigation
    var currentUrl = Data.state.requestpath
    linkHtml = `${linkHtml}
    <p>`;
    if (currentUrl != null && currentUrl != "/") {
        var paths = [];
        debug(`currentUrl: ${currentUrl}`);
        if (currentUrl.lastIndexOf("/") > 0) {
            debug(`currentUrl.indexOf("/",1): ${currentUrl.indexOf("/", 1)}`);
            currentUrl = currentUrl.substring(0, currentUrl.indexOf("/", 1));
        }
        paths.push(currentUrl);

        Data.state.endpointsubpaths.forEach(path => {
            if (path.indexOf(currentUrl) == 0) {
                paths.push(path);
            }
        });

        if (paths.length > 1) {
            paths.forEach(path => {

                var pathToShow = path;
                if (path.lastIndexOf("/") > 0) {
                    pathToShow = path.replaceAll(currentUrl, "");
                }
                trace(`pathToShow: ${pathToShow}`);

                linkHtml = `${linkHtml} <a href="${path}">${pathToShow}</a>`;

            });
        }

    }
    linkHtml = `${linkHtml}
    </p>`;

    return linkHtml;
}

function getHtmlHeader(title) {
    const htmlHeader = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${Data.state.appName} - ${title}</title>
  ${getCSSStyle()}
  ${getInstanaIntegration()}
</head>
<body>
${getEndpointLinks()}
`;
    return htmlHeader;
}

function getHtmlFooter() {
    var now = new Date().toISOString();
    const htmlFooter = `
    
    <pre>
Page generated: ${now}
Host name     : ${process.env.HOSTNAME}
Version       : ${process.env.PACKAGE_VERSION}
    </pre>
    </body>
    </html>
    `;

    return htmlFooter;
}

export function getPreHTML(title, content) {
    const html = `${getHtmlHeader(title)}
<pre>
${content}
</pre>
${getHtmlFooter()}`;

    return html;
}

export function getHTML(title, htmlContent) {
    const html = `${getHtmlHeader(title)}
${htmlContent}
${getHtmlFooter()}`;

    return html;
}

export function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function formatBytes2(bytes, decimals = 2, binaryUnits = true) {
    if (bytes == 0) {
        return '0 Bytes';
    }
    var unitMultiple = (binaryUnits) ? 1024 : 1000;
    var unitNames = (unitMultiple === 1024) ? // 1000 bytes in 1 Kilobyte (KB) or 1024 bytes for the binary version (KiB)
        ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'] :
        ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var unitChanges = Math.floor(Math.log(bytes) / Math.log(unitMultiple));
    return parseFloat((bytes / Math.pow(unitMultiple, unitChanges)).toFixed(decimals || 0)) + ' ' + unitNames[unitChanges];
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function httpPostJSONData({ body, ...options }) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            method: 'POST',
            ...options,
        }, res => {
            const chunks = [];
            res.on('data', data => chunks.push(data))
            res.on('end', () => {
                let body = Buffer.concat(chunks);
                switch (res.headers['content-type']) {
                    case 'application/json':
                        body = JSON.parse(body);
                        break;
                }
                resolve(body)
            })
        })
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    })
}