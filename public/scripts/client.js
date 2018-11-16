var id =new Date().getTime();

var colors=["#0000ff","#00ff00","#ff0000","#bc8f8f","#0e2f44","#8a2be2","#b6313e"];

var updateRow=1;

Dropzone.options.uploader = {
    acceptedFiles: "image/jpeg,image/jpg",
    uploadMultiple: false,
    sending: function(file, xhr, formData) {
        console.log("sending")
        formData.append('sessionId', id);
    },
    drop: function(event) {
        this.removeAllFiles();
        resetView();
    }
}


var io = io();
io.on('connect', function() {
    console.log("socket connect")

    io.emit('upgrade', id);
});


io.on('disconnect', function() {
    console.log('socket disconnect');
});


io.on('update', function(data) {
    var feedback = $("#feedback");
    var innerHTML = feedback.html();
    innerHTML += "<br/>" + updateRow+": "+data.toString();
    updateRow++;
    feedback.html(innerHTML);

    feedback.scrollTop(feedback.prop("scrollHeight"));
});

io.on('clearFeedback', function(data) {
    var feedback = $("#feedback");
    var innerHTML = feedback.html();
    innerHTML = "";
    updateRow=1;
    feedback.html(innerHTML);

    feedback.scrollTop(feedback.prop("scrollHeight"));
});


io.on("processingComplete", function(data) {
    console.log("processing complete");
    renderResult(data);
    //debug()
});

function debug() {
    renderResult('{"imagePath":"./uploads/12377b3c-7561-47ce-8a43-814aec8dabbf/image.jpg","jsonPath":"./uploads/12377b3c-7561-47ce-8a43-814aec8dabbf/image.json"}')
}


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//set API key to form and set client ID
function setAPIKey()
{
    var apiKey=getCookie("watsonApiKey");
    if (apiKey!=="")
    {
        //console.log("apiKey: "+apiKey);
        document.getElementById('watsonApiKeyForm').value=apiKey;
        document.getElementById('watsonApiKey').value=apiKey;
    }

}

function resetView() {
    $("#render").empty();
    $("#feedback").html("");
}

function renderResult(dataStr) {
    var data = JSON.parse(dataStr)
    console.log(data)

    var renderContainer = $("#render");

    $.ajax({
            type: 'GET',
            url: data.jsonPath
        })
        .done(function(result) {
            //console.log(result)
            var table = constructDiv(result,data.imagePath);
            console.log("table: "+table);
            renderContainer.prepend(table);

            $("#classification").removeClass("hidden");
            //$("#overlayToggle").bootstrapToggle('on');

            $("#legend").removeClass("hidden");
            $("#render-parent").removeClass("hidden");
            $("#footerControls").removeClass("hidden");
            $("#content").addClass("hidden");

        })
        .fail(function(jqXHR, status) {
            console.log("Request failed: " + status);
        });
}

function constructDiv(data,imagePath) {
    console.log("constructDiv");
    console.log(JSON.stringify(data, null, 2));
//    <div style="position: relative; background: url(path to image); width: (width)px; height: (height)px;">
    var div = $("<div>");
    
    //check error
    var error = data.tiles[0][0].analysis.error;
    if (error !== undefined)
    {
        var feedback = $("#feedback");
        var innerHTML = feedback.html();
        innerHTML += "<br/>" + '<span style="color:#ff0000;">ERROR<br/>'+error.error+'<br/>Code: '+error.code+"</span>";
        feedback.html(innerHTML);
    
        feedback.scrollTop(feedback.prop("scrollHeight"));
        return div;
    }
    
    console.log("");
        
    console.log(JSON.stringify(data.tiles[0][0].analysis.images, null, 2));
    //assume one image
    image = data.tiles[0][0].analysis.images[0]
    console.log(JSON.stringify(image, null, 2));
        
    console.log(JSON.stringify(image.faces, null, 2));
    var facesLength=image.faces.length;
    
    //result table
    var table = $("<table>");
    var row = $("<tr>");
    var cell = $("<td>");
    var imageDiv = $('<div class="imageDiv">');
    imageDiv.append($("<img class='' src='" + imagePath + "' width='640px' />"));
    for (var i=0 ;i<facesLength ; i++)
    {
        var facedata=image.faces[i];
        var faceTop=facedata.face_location.top;
        var faceLeft=facedata.face_location.left;
        var faceWidth=facedata.face_location.width;
        var faceHeight=facedata.face_location.height;
        var faceBox=$("<div>");
        var color="#000000"
        if (i<7)
        {
            color=colors[i];
        }
        faceBox.css("position", "absolute");
        faceBox.css("top", faceTop+"px");
        faceBox.css("left", faceLeft+"px");
        faceBox.css("width", faceWidth+"px");
        faceBox.css("height", faceHeight+"px");
        faceBox.css("border", "2px solid "+color);
        faceBox.css("background-color", "transparent");
        imageDiv.append(faceBox);
    }
    cell.append(imageDiv);
    row.append(cell);
    table.append(row);  

    if (facesLength==0)
    {
        row = $("<tr>");
        cell = $("<td>");
        cell.append($("<span>No faces detected.</span>"));
        row.append(cell);
        table.append(row);  
    }
    else
    {
        for (var i=0 ;i<facesLength ; i++)
        {
            row = $("<tr>");
            cell = $("<td>");
            var facedata=image.faces[i];
            console.log(JSON.stringify(facedata, null, 2));
            var ageMin=facedata.age.min
            var ageMax=facedata.age.max
            var ageScore=facedata.age.score
            var gender=facedata.gender.gender
            var genderScore=facedata.gender.score
            var color="#000000"
            if (i<7)
            {
                color=colors[i];
            }
            cell.append($('<span style="color:'+color+';">'+gender+" ("+genderScore+")<br/>Age: "+ageMin+" - "+ageMax+" ("+ageScore+")<br/></span>"));
            //cell.html=gender+" ("+genderScore+")<br/>Age: "+ageMin+" - "+ageMax+" ("+ageScore+")";
            row.append(cell);
            table.append(row);  
        }
    }
    console.log("");

    //classification data
    console.log(JSON.stringify(data.tiles[0][0].analysis_classify.images, null, 2));
    //assume one image
    image = data.tiles[0][0].analysis_classify.images[0];
    var classifiers=image.classifiers;
    var classifiersLength=image.classifiers.length;
    
    for (var i=0 ;i<classifiersLength ; i++)
    {
        var classes=classifiers[i].classes;
        var classesLength=classes.length;
        for (var j=0;j<classesLength;j++)
        {
            row = $("<tr>");
            cell = $("<td>");
            console.log("class: "+classes[j].class+" "+classes[j].score);
            var type_hierarchy= classes[j].type_hierarchy ? classes[j].type_hierarchy: "";            
            cell.append($("<span>"+classes[j].class+" ("+classes[j].score+")<br/>"+type_hierarchy+"</span>"));
            row.append(cell);
            table.append(row);  
                    
        }
    }

    div.append(table);
    return div;
}
