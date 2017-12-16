var express = require('express');
var router = express.Router();
var db = require('../db.js');
var Memcached = require('memcached');
var memcached = new Memcached('largescalemem.ql9eg3.0001.use1.cache.amazonaws.com:11211', {timeout:5000});
var randomID = require('random-id');

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

			socket.on("sendRequest", function(data) {

				console.log("sendRequest received " + data.requestedUser)


				// get user email corresponding to username
				db.getUserByUsername(data.requestedUser, function(result) {
					console.log("corresponding username is " + result[0].email);
					memcached.get(result[0].email, function(err,data) {
						if(!err) {
							var sendTo = data;
							memcached.get(sendTo,function(err,data) {

								// nest this within a db call that gets the username so the email isn't completely exposed
								db.getUserByEmail(data, function(result) {
									socket.broadcast.to(sendTo).emit('wannaPlay',{"idOfChallenger":socket.id,"username":result[0].username});
								},function(result){
									console.log("could not find corresponding user by email");
								});
							});
						}
					});
				});

			});

			// the id @ socket.id accepts the request from data.idOfChallenger
			socket.on("accept", function(data) {
				console.log(socket.id + " accepted the request from " + data.idOfChallenger);
				var challengerId = data.idOfChallenger;
				// generate random key with randomID for this game state, and set an empty board in memcached
				var id = randomID(10, "aA0");
				console.log("generated id " + id);
				memcached.set(id,"000000000",200000,function(){

					// get email of both socket ids through memcached -> for some reason, something's being called twice and they get separate ids
					memcached.get(socket.id, function(err,data) {
						challengee = data
						memcached.get(challengerId, function(err,data) {
							db.updateGameID(challengee, data,id);
							db.setOpponentSocketID(challengee, challengerId);
							db.setOpponentSocketID(data,socket.id);
							if (Math.floor(Math.random() * 2) == 1) {
								db.updateXO(challengee,"x")
								db.updateXO(data,"o")
							}
							else {
								db.updateXO(challengee,"o")
								db.updateXO(data,"x")
							}

							socket.broadcast.to(challengerId).emit("toGame",{})

						});
					});
				});

			});

			// the id @ socket.id declines the request from data.idOfChallenger
			socket.on("decline", function(data) {
				console.log(socket.id + " declined the request from " + data.idOfChallenger);
				socket.broadcast.to(data.idOfChallenger).emit('challengeeDeclined',{"response":"no thanks"});

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
					db.getMatches(username,function(result){
						res.render('index', { title: 'Tic-Tac-Toe', status: req.cookies.status, username: username, onliners:onliners, matches: result[0]});
					})
					
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

// check if the user has a game associated with them for memcached, if they do display that game
// have the first person pick x or o then the other is the other
router.get('/game', function(req,res,next) {
	res.render("game", {title:'Tic-Tac-Toe'});
	res.io.on("connection", function(socket) {
		socket.on("pageLoaded", function(data) {
			console.log("on /game with socket.id " + socket.id);
			memcached.get(socket.id, function(err,data) {
				if (!err) {
					console.log("retrieving user email for socket.id " + socket.id);
					var userEmail = data;
					db.getUserByEmail(userEmail, function(result) {
						console.log("got user information for " + result[0].email);
						if(result[0].gameID){
							console.log("sending " + result[0].email + " the board");
							memcached.get(result[0].gameID, function(err,data) {
								console.log("retrieved the board from memcached and sending it now");
								socket.broadcast.to(socket.id).emit("getUserBoardInformation",{board:data,turn:result[0].xo});
							});
						}
						else {
							socket.broadcast.to(socket.id).emit("getUserBoardInformation",{board:data, turn:"redirect"});
						}
					}, function(){});

				}
		});
		});
		socket.on("emitBoard",function(data) {
			console.log("got emitBoard call " + data.board);
			var boardState = data.board;
			memcached.get(socket.id,function(err,data) {
				if (!err) {
					var userEmail = data;
					db.getUserByEmail(userEmail,function(result) {
						memcached.set(result[0].gameID, boardState);
						socket.to(result[0].oppenentSocketID).emit("getUserBoardInformation",{board:boardState,turn:result[0].xo});

					}, function(){});
				}
			});

		});

	});
/*	res.io.on("connection", function(socket){
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
	});*/
	// memcached socket id -> email

		// mysql email -> user object
			// if user object has a game going on, let them into the game

			// if they don't have a game, redirect to the home page
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
    		db.addUserMatches(entry);
    		res.redirect('/');

    	},
    	function(){
    		//Username already exists
    		//res.render('signin_prompt', { title: 'Tic-Tac-Toe', error: true });

    	}
    );

});


module.exports = router;
