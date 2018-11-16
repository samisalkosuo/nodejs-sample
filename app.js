/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js  application 
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var fs = require('fs-extra');
var fileUpload = require('express-fileupload');
var uuid = require('node-uuid');
var gm = require('gm').subClass({
    imageMagick: true
});
var request = require('request');
var async = require("async");
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var jimp = require('jimp');

var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');


var totalAnalysisRequests = 0;
var completeAnalysisRequests = 0;

var rootDir = './uploads';
var MIN_TILE_SIZE = 200;

var WATSON_KEY = "THIS IS RECEIVED FROM CLIENT WHEN IMAGE UPLOADED";

//when upload is received this is updated
var visual_recognition = new VisualRecognitionV3({
    api_key: WATSON_KEY,
    version_date: '2016-05-19'
});

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

//setting up socket.io for realtime communication
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(fileUpload());

// serve the files out of ./public as our main files
app.use("/",express.static(__dirname + '/public'));
app.use('/uploads', express.static(rootDir));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var testRequests = 0

app.get('/test', function(req, res) {
    testRequests = testRequests + 1
    var now = Math.floor(new Date() / 1000);
    res.send('Test request succesfull: '+now);

});


/*
ICP/Prometheus Metrics endpoint
*/
app.get('/metrics', function(req, res) {

    //generate metrics data 
    //https://prometheus.io/docs/instrumenting/exposition_formats/
    var metricsData='# HELP test_requests_total Total number of HTTP requests to /test endpoint.\n\
# TYPE test_requests_total counter\n\
test_requests_total{method="get",code="200"} '+testRequests+' ' + (new Date()) +' \n \
';

    res.writeHead(200, {"Content-Type": "text/plain; version=0.0.4"});
    res.write(metricsData, "utf-8");
    res.end(); 

    //res.setHeader('content-type', 'text/plain; version=0.0.4');
    //res.send(metricsData)
});



/*
Delete upload directory
*/
app.get('/delete-uploads', function(req, res) {
    
    fs.remove(rootDir, err => {
        if (err) return console.error(err);
        console.log("Removed dir: "+rootDir);
        res.send('Removed '+rootDir+' directory.');
        
        }); 
         
    
});

app.post('/file-upload', function(req, res) {
    var sampleFile;
    var id = uuid.v4();
    var sessionId = req.body.sessionId;
    completeAnalysisRequests = 0;

    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    clearFeedback(sessionId, "clear feedback");
    

    var uploadDir = rootDir + "/" + id;
    var imagePath = uploadDir + "/image.jpg";
    var jsonPath = uploadDir + "/image.json";

    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
    }

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    var tileWidth = req.body.tileWidth ? req.body.tileWidth : MIN_TILE_SIZE;
    var tileHeight = req.body.tileHeight ? req.body.tileHeight : MIN_TILE_SIZE;
    WATSON_KEY = req.body.watsonApiKey;
    if (WATSON_KEY === undefined || WATSON_KEY === "")
    {
        WATSON_KEY="N/A";
    }
    visual_recognition = new VisualRecognitionV3({
        api_key: WATSON_KEY,
        version_date: '2016-05-19'
    });
            
    if (tileWidth < MIN_TILE_SIZE) {
        tileWidth = MIN_TILE_SIZE
    }
    if (tileHeight < MIN_TILE_SIZE) {
        tileHeight = MIN_TILE_SIZE
    }


    sampleFile = req.files.file;
    sampleFile.mv(imagePath, function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send('File uploaded!');
            jimp.read(imagePath).then(function (image) {
                image.exifRotate(function(err, image) {
                //resize image
                image.resize(640, jimp.AUTO).write(imagePath,function(err,image){    
                        //update(sessionId, "file uploaded and saved to " + imagePath)
                        update(sessionId, "file uploaded")
                        generateImageTiles(sessionId, {
                            rootDir: rootDir,
                            id: id,
                            imagePath: imagePath,
                            imageDir: uploadDir,
                            tileWidth: tileWidth,
                            tileHeight: tileHeight
                        }, function(err, imageData) {
                            if (err) {
                                update(sessionId, "parsing error: " + err.toString())
                            } else {
                                //update(sessionId, "parsing complete")
                                var imageData = imageData;
                                imageData.imagePath = imagePath;
                                processImages(sessionId, imageData, function(updatedImageData) {
                                    update(sessionId, "analysis complete")
            
            
                                    var json = JSON.stringify(updatedImageData);
            
                                    fs.writeFile(jsonPath, json, function(err) {
                                        if (err) return update(sessionId, err);
                                        //update(sessionId, 'wrote json data');
            
                                        var result = {
                                            imagePath: imagePath,
                                            jsonPath: jsonPath
                                        }
                                        dispatch(sessionId, "processingComplete", JSON.stringify(result))
                                    });
            
                                });
                            }

                        })
                });//end resize
            });//end exifRotate
        }).catch(function (err) {
                // handle an exception 
                console.log(err);
            });
        }
    });
});


function generateImageTiles(sessionId, options, callback) {
    //TODO: refactor this function away
    var imageSize = {};
    var parseData = {};
    parseData.tiles = [];
    parseData.tiles[0] = [];
    parseData.tiles[0][0] = {};
    //file path
    parseData.tiles[0][0].path = options.imagePath;
    var childProcessError = undefined;
    
    callback(childProcessError, parseData);

}

function processImages(sessionId, imageData, callback) {
    update(sessionId, "performing analysis on images...")

    //this is for debug
/*    if (1===1)
    {
        callback(imageData);
        return;
    }
*/
    totalAnalysisRequests = 0;
    completeAnalysisRequests = 0;
    var requests = [];
    //TODO: refactor this
    //loop over cols
    for (var r = 0; r < imageData.tiles.length; r++) {

        //loop over rows
        for (var c = 0; c < imageData.tiles[r].length; c++) {

            var image = imageData.tiles[r][c];

            requests.push(analyzeImage(sessionId, image));

        }
    }

    async.parallelLimit(requests, 8, function() {
        totalAnalysisRequests++;
        callback(imageData);
    })

}


function analyzeImage(sessionId, _image) {
    totalAnalysisRequests++;
    return function(analyze_callback) {

        var fileName = _image.path;
        var analysis = {}

        var params = {
            images_file: fs.createReadStream(fileName)
        };

        update(sessionId, "detecting faces...");
        visual_recognition.detectFaces(params, function(err, res) {
            completeAnalysisRequests++;
            if (err) {
                update(sessionId, "Face Detection:" + JSON.stringify(err));
                analysis = {
                    error: err
                }
            } else {
                //update(sessionId, "Classified: " + completeAnalysisRequests + " of " + totalAnalysisRequests)
                analysis = res;
            }
            console.log("face detection: "+JSON.stringify(analysis, null, 2));
            _image.analysis = analysis;

            //call classify
            params = {
                images_file: fs.createReadStream(fileName)
                //classifier_ids: [WATSON_CLASSIFIER],
                //threshold: 0.0
            };
            update(sessionId, "classifying...");
            visual_recognition.classify(params, function(err, res) {

                completeAnalysisRequests++;
                if (err) {
                    update(sessionId, "Image Classifier: " + JSON.stringify(err));
                    analysis = {
                        error: err
                    }
                } else {
                    //update(sessionId, "Classified: " + completeAnalysisRequests + " of " + totalAnalysisRequests)
                    analysis = res;
                }
                console.log("classification: "+JSON.stringify(analysis, null, 2));
                _image.analysis_classify = analysis;
                    analyze_callback();
            });
            

        });



    }
}



io.on('connection', function(socket) {
    appSocket = socket
    console.log('a user connected');

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });



    socket.on('upgrade', function(id) {
        console.log('upgrade event received for id: ' + id);
        socket.join(id);
        socketMap[id] = socket;
    });

});


var socketMap = {};

function update(id, data) {
    //console.log(data)
    if (id && socketMap[id]) {
        socketMap[id].emit("update", data)
    }
}

function clearFeedback(id, data) {
    //console.log(data)
    if (id && socketMap[id]) {
        socketMap[id].emit("clearFeedback", data)
    }
}


function dispatch(id, event, data) {
    //console.log(data)
    if (id && socketMap[id]) {
        socketMap[id].emit(event, data)
    }
}

// start the server
http.listen(appEnv.port, function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

