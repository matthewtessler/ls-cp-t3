var express = require('express');
var router = express.Router();
var db = require('../db.js');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.io.on('connection', function(socket){
	  console.log('a user connected');
	});
 	res.render('index', { title: 'Tic-Tac-Toe' });
});

/* POST home page to check if account exist*/
router.post('/', function(req, res, next) {
	res.io.on('connection', function(socket){
	  console.log('a user connected');
	});

	db.getUserByEmail(req.body.email, function(){
		//Function to call if User is in the DB already
		res.render('index', { title: 'Tic-Tac-Toe' });
	},
	function(){
		//Function to call if we need to create a new account for the user
        res.render('signin_prompt', { title: 'Tic-Tac-Toe' });
		console.log("TEST");
	});
	
});

router.get('/game', function(req,res,next) {
	res.render('game', {title:'Tic-Tac-Toe'});
});


router.get('/signin', function(req,res,next){
    res.render('signin_prompt', {title:'Tic-Tac-Toe'});
});


module.exports = router;
