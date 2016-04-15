var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var config = require("./config");

var app = express();

//Real Time Environment
var http = require('http').Server(app);
var io = require('socket.io')(http);


mongoose.connect(config.database, function (err) {

    if (err) {
        console.log(err);
    } else {
        console.log("Connected to the database");
    }


});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(express.static(__dirname + '/public'));

var api = require('./app/routes/api.js')(app, express, io);
app.use('/api', api);

app.get("*", function (req, res) {

    res.sendFile(__dirname + '/public/app/views/index.html');

});

/*app.listen(config.port, function (err) {

    if (err) {
        console.log(err)
    } else {
        console.log("Listening on port 3000");
    }

});*/

//To work with socket io app should be replaced with http var create at the top
http.listen(config.port, function (err) {

    if (err) {
        console.log(err)
    } else {
        console.log("Listening on port 3000");
    }

});