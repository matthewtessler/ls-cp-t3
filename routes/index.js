var express = require('express');
var router = express.Router();
var db = require('../db.js');

/* GET home page. */
router.get('/', function(req, res, next) {
	/*
	res.io.on('connection', function(socket){ // testing s.io
	  console.log('a user connected');
	});*/
	if (req.cookies.status=="loggedIn"){
		//Page to display if logged in
		db.displayProfile(req.cookies.email,
			function(result){
				//username = result[0].username;
				res.render('index', { title: 'Tic-Tac-Toe', status: req.cookies.status, username: result[0].username});
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
	res.render('game', {title:'Tic-Tac-Toe'});
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
    		res.render('signin_prompt', { title: 'Tic-Tac-Toe', error: true });

    	}
    );

});



module.exports = router;
