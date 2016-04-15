var User = require('../models/user');
var Story = require('../models/story');

var config = require('../../config');

var secretKet = config.secretKet;

var jsonwebtoken = require('jsonwebtoken');

function createToken(user) {
    var token = jsonwebtoken.sign({
        id: user._id,
        name: user.name,
        username: user.username
    }, secretKet, {
        expiresInMinute: 1440
    });

    return token;
}

module.exports = function (app, express, io) {
    
    var api = express.Router();

    //Destination A - Without validating token
    
    api.get('/all_stories', function(req, res){
        
        Story.find({}, function(err, stories){
            if(err) {
                res.send(err);
                return;
            }
            
            res.json(stories);            
        });
        
    });

    api.post('/signup', function (req, res) {

        var user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
        });

        var token = createToken(user);

        user.save(function (err) {
            if (err) {
                res.send(err);
                return;
            }
            res.json({
                success: true,
                message: "User has been created successfully",
                token: token
            });
        });

    });

    api.get('/users', function (req, res) {

        User.find({}, function (err, users) {

            if (err) {
                res.send(err);
                return;
            }

            res.json(users)

        });

    });

    api.post('/login', function (req, res) {

        User.findOne({
            username: req.body.username
        })
                .select('name username password').exec(function (err, user) {
            if (err) {
                throw err;
            }

            if (!user) {
                res.send({message: "User doesn't exists"});
            } else if (user) {
                var validPassword = user.comparePassword(req.body.password);

                if (!validPassword) {
                    res.send({message: "Invalid password"})
                } else {

                    var token = createToken(user);

                    res.json({
                        success: true,
                        message: "Login successful",
                        token: token
                    });
                }
            }
        });

    });

    //Middlewire

    api.use(function (req, res, next) {

        console.log("Somebody just accessed the app");

        //console.log(req.body);
        //console.log(req.param);

        var token = req.body.token || req.param('token') || req.headers['x-access-token'] || req.query('token');

        if (token) {

            jsonwebtoken.verify(token, secretKet, function (err, decoded) {
                if (err) {
                    res.status(403).send({success: false, message: "Failed to authenticate"});
                } else {
                    console.log(decoded);
                    req.decoded = decoded;
                    next();
                }
            });

        } else {
            res.status(403).send({success: false, message: "No token provided"});
        }

    });

    //Destination B - Valid token needed to access this areas

    /*api.get('/', function(req, res){
     res.json("Hello World");
     });*/

    api.route('/')

            .post(function (req, res) {
                var story = new Story({
                    creator: req.decoded.id,
                    content: req.body.content
                });

                story.save(function (err, newStory) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    io.emit('story', newStory);
                    res.json({message: "Story posted..."});
                });

            })

            .get(function (req, res) {

                Story.find({creator: req.decoded.id}, function (err, stories) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    res.json(stories);
                });

            });

    api.get('/me', function (req, res) {
        res.json(req.decoded);
    });

    return api;
}