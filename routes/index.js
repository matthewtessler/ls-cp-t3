var express = require('express');
var router = express.Router();


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
	console.log(req.body.email);
 	res.render('index', { title: 'Tic-Tac-Toe' });
});

router.get('/game', function(req,res,next) {
	res.render('game', {title:'Tic-Tac-Toe'});
});

router.get('/signin', function(req,res,next){
    res.render('signin_prompt', {title:'Tic-Tac-Toe'});
});

module.exports = router;
