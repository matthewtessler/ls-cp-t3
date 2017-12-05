var express = require('express');
var router = express.Router();
var db = require('../db.js');
var Memcached = require('memcached');

//Memcached Code ======================================================================

/* GET home page. */
router.get('/', function(req, res, next) {
	var info = {
	user1: "Wazir",
	user2: "Matthew",
	board: ['X','O','X']
	}
	//Set a key
	console.log("BEGIN");
	var memcached = new Memcached('largescalecache.ql9eg3.0001.use1.cache.amazonaws.com:11211', {timeout:5000});

	memcached.set('game1', "info", 200000, function (err) { console.log("TEST", err);});
	console.log("END");

	//Get value from key
	// memcached.get('game1', function (err, data) {
	//   console.log(data);
	// });
	/*
	res.io.on('connection', function(socket){ // testing s.io
	  console.log('a user connected');
	});*/
	if (req.cookies.status=="loggedIn"){
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
                      console.log('a user connected');
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
		console.log("connected");
		socket.on("emitBoard", function(data){
			console.log(data);
			db.setBoard({turn:data.turn, board:data.board}, function() {
				db.getBoard(function(result) {
					console.log(result);
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
