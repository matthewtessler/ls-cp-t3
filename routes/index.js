var express = require('express');
var router = express.Router();
var db = require('../db.js');
var Memcached = require('memcached');
var memcached = new Memcached('largescalemem.ql9eg3.0001.use1.cache.amazonaws.com:11211', {timeout:5000});


// this was a quick fix for setting the board in the first place, should be replaced
// with actually setting the board when a game starts between two users 
// db.setBoard(board:"000000000", turn:0}, function(){}); // reset board

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.cookies.status=="loggedIn"){
		res.io.on('connection', function(socket) {
			socket.on("sendEmail", function(data) {
				// set the memcached key,value here as "email"->"socket.id"
				memcached.set(data["email"], socket.id, 200000, function (err) { console.log("saved email " + data["email"] + "->socket id " + socket.id + " to memcached");});
				memcached.set(socket.id, data["email"], 200000, function(err) { console.log("saved socket id "+socket.id + "->email " + data["email"] + " to memcached");});

				// update mysql status to logged in
				db.updateStatus(data["email"],"online")
			});

			socket.on("disconnect", function() {
				console.log("got disconnect from " + socket.id)
				// get socket.id, delete that key->value in memcached, then use that email to delete the other reverse store
				memcached.get(socket.id, function(err,data) {
					if(!err) {
						console.log("got socket.id " + socket.id + "->email"+ data + " on disconnect");
						var email = data
						console.log("email: " + email)
						// update mysql status to logged out
 						db.updateStatus(data,"offline")

						memcached.del(email, function(err) {
							if(!err) {
	                                        		console.log("delete email->id")
								memcached.del(socket.id, function(err){
									if (!err) {
										console.log("deleted id->email")
									}
								});
							}
						});
					}
				});
			});
		});

		//Page to display if logged in
		db.displayProfile(req.cookies.email,
			function(result){
				var username = result[0].username;
				db.getOnlineUsers(function(result){
					var onliners = []
					for(var i=0; i < result.length;i++) {
						if( result[i].username !== username) {
							onliners.push(result[i]);
						}
					}
					res.render('index', { title: 'Tic-Tac-Toe', status: req.cookies.status, username: username, onliners:onliners});
				});
			});
	}
 	else{
 		//Page to display if not logged in
 		console.log(req.cookies.status);
 		res.render('index', { title: 'Tic-Tac-Toe'});
 	}
});

//POST home page to check if account exists
router.post('/', function(req, res, next) {
            res.io.on('connection', function(socket){
                      console.log('user / post ->', socket.id);
                      });

            db.getUserByEmail(req.cookies.email, function(){
            	 //Function to call if User is in the DB already
                 res.cookie('status',"loggedIn");
                 res.redirect('/');
                  },
                              function(){
                              //Function to call if we need to create a new account for the user
                              //res.send("False");
                              res.redirect('/signin');
                              });

            });

router.get('/game', function(req,res,next) {
	res.io.on("connection", function(socket){
		console.log("user /game get ->", socket.id);
		socket.on("emitBoard", function(data){
			//console.log(data);
			db.setBoard({turn:data.turn, board:data.board}, function() {
			//	console.log("setting new board");
				db.getBoard(function(result) {
				//	console.log("getting new board", result);
					res.io.emit("hi", result[0]);
				});
			});

		});
	});
	db.getBoard(function(result) {
		console.log(result);
		res.render('game', {title:'Tic-Tac-Toe', board:result[0].board, turn:result[0].turn});
	});
});


router.get('/signin', function(req,res,next){
    res.render('signin_prompt', {title:'Tic-Tac-Toe'});
});

//SignUp for new users
router.post('/signup', function(req,res,next){
    var entry = {
    	username: req.body.username,
    	email: req.cookies.email,
    }
    if (req.body.location){
    	entry.location = req.body.location;
    }
    db.addUser(entry,
    	function(){
    		//Successful Account Creation
    		res.cookie('status',"loggedIn");
    		db.addUserRanking(entry);
    		res.redirect('/');

    	},
    	function(){
    		//Username already exists
    		//res.render('signin_prompt', { title: 'Tic-Tac-Toe', error: true });

    	}
    );

});


module.exports = router;
