import {Data} from '../utils/data.js';

function getCSSStyle()
{
    const css=`<style>
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

function getEndpointLinks()
{
    var linkHtml = "";
    if (Data.state.endpointlinks != null)
    {
        linkHtml = "<table><tr>"
        var i = 1;
        Data.state.endpointlinks.forEach(element => {
            linkHtml = linkHtml + `<td>${element}</td>`;
            if (i % 4 == 0)
            {
                linkHtml = linkHtml + "</tr><tr>";

            }
            i = i + 1;
        });

        linkHtml = linkHtml + "</tr></table>"
    }

    return linkHtml;
}

function getHtmlHeader(title)
{
    const htmlHeader=`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${Data.state.appName} - ${title}</title>
  ${getCSSStyle()}
</head>
<body>
${getEndpointLinks()}
`;
    return htmlHeader;
}

const htmlFooter=`
</body>
</html>
`;

export function getPreHTML(title,content)
{
    const html = `${getHtmlHeader(title)}
<pre>
${content}
</pre>
${htmlFooter}`;
    
    return html;
}

export function getHTML(title,htmlContent)
{
    const html = `${getHtmlHeader(title)}
${htmlContent}
${htmlFooter}`;
    
    return html;
}

export function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }

export function formatBytes2(bytes, decimals = 2, binaryUnits = true) {
    if(bytes == 0) {
        return '0 Bytes';
    }
    var unitMultiple = (binaryUnits) ? 1024 : 1000; 
    var unitNames = (unitMultiple === 1024) ? // 1000 bytes in 1 Kilobyte (KB) or 1024 bytes for the binary version (KiB)
        ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']: 
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