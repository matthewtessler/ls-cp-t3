var mysql = require('mysql');



//Create the MySQL Connection
var connect = function(){
	var connection = mysql.createConnection({
 		host     : 'largescale-instance.cvux8fdwpgcr.us-east-1.rds.amazonaws.com',
  		user     : 'LargeScaleGroup',
 		password : 'LargeScale2017',
  		database : 'TicTacToeDB',
  		dateStrings: 'date'
	});

	connection.connect(function(err) {
  		if (err) {
    		console.error('error connecting: ' + err.stack);
    		return null;
  		}
  	});
	return connection;
}


//Function to Add a new User to the DB (user table)
var addUser = function(entry, Success, Error){
	//Entry should be an object that has the fields: username, email, location (optional)
	entry.joinDate = (new Date()).toISOString().substring(0, 10);
	var connection = connect();
	if (connection){
		//If username and email do not already exist, add new User to user table
		connection.query('INSERT INTO user SET ?', entry, function(err, result) {
			if (err){
				//Error Handling Here (ie if Username or Email exist in DB already)
				Error();
			}
			else{
				//Account Creation Successful
				Success();
			}
		});
	}
	else{
		//There was an error connecting to the server
	}

	connection.end();
}

//Function to Add a new User to the DB (ranking table)
var addUserRanking = function(entry){
	//Entry should be an object that has the fields: username, email, location (optional)
	entry.joinDate = (new Date()).toISOString().substring(0, 10);
	var connection = connect();
	if (connection){
		//Also add entry to Ranking table, default value as Highest Rank + 1
		connection.query('INSERT INTO rankings (username,rank) SELECT "'+entry.username+'" AS username, MAX(rank)+1 FROM rankings', function(err, result) {
			if (err){
				console.log(err);
				//Error Handling Here (ie if Username or Email exist in DB already)
			}
			else{
				//Account Creation Successful
			}
		});
	}
	else{
		//There was an error connecting to the server
	}

	connection.end();
}


//Function to retrieve User info by username
var getUserByUsername = function(username){
	var connection = connect();
	if (connection){
		connection.query('SELECT * FROM user WHERE username = "'+username+'"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username not found)
			}
			if (result){
				//User successfully retrieved
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
	connection.end();
}

//Function to retrieve User info by email
var getUserByEmail = function(email, redirect, makeAcct){
	var connection = connect();
	if (connection){
		connection.query('SELECT * FROM user WHERE email = "'+email+'"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username not found)
			}
			if (result.length>0){
				redirect(); 
			}
			else{
				makeAcct(); 
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
	connection.end();
}

var displayProfile = function(email, display){
	var connection = connect();
	if (connection){
		connection.query('SELECT * FROM user WHERE email = "'+email+'"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username not found)
			}
			if (result.length>0){
				display(result);
			}
			else{
				
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
	connection.end();
}


//Function to update Ranking for a single User
var updateRanking = function(username,rank){
	var connection = connect();
	if (connection){
		connection.query('UPDATE rankings SET rank = '+ rank + ' WHERE username = "' + username+ '"', function(err, result) {
			if (err){
				console.log(err);
				//Error Handling Here (ie if Username not found)
			}
			if (result){
				//User successfully retrieved
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
	connection.end();
}


//Function to update # of games played by a User and their # of wins
var updateTotals = function(username, score){
	var connection = connect();
	if (connection){

		//Increment games played
		connection.query('SELECT * FROM user WHERE username = "'+username+ '"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username not found)
			}
			if (result){
				//Callback function goes here to perform the update
				updateGamesPlayed(result)
			}
		});

		//Increment Games Won (if necessary)
		if (score==1){
			connection.query('SELECT * FROM user WHERE username = "'+username+ '"', function(err, result) {
				if (err){
					//Error Handling Here (ie if Username not found)
				}
				if (result){
					//Callback function goes here to perform the update
					updateGamesWon(result)
				}
			});
		}
	}
	else{
		//There was an error connecting to the server
	}
	connection.end();
}


//Callback function for the update (games played)
var updateGamesPlayed = function(result){
	var connection = connect();
	if (connection){
		//Add 1 to total games played
		connection.query('UPDATE user SET gamesPlayed = gamesPlayed + 1 WHERE username = "'+ result[0].username+ '"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username or Email exist)
			}
			if (result){
				//Callback function goes here to display results
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
}


//Callback function for the update (games won)
var updateGamesWon = function(result){
	var connection = connect();
	if (connection){
		//Add 1 to total games played
		connection.query('UPDATE user SET gamesWon = gamesWon + 1 WHERE username = "'+ result[0].username+ '"', function(err, result) {
			if (err){
				//Error Handling Here (ie if Username or Email exist)
			}
			if (result){
				//Callback function goes here to display results
			}
		});
	}
	else{
		//There was an error connecting to the server
	}
}


module.exports = {
  connect: connect,
  addUser: addUser,
  addUserRanking: addUserRanking,
  getUserByUsername: getUserByUsername,
  getUserByEmail: getUserByEmail,
  displayProfile: displayProfile,
  updateTotals: updateTotals,
  updateGamesPlayed: updateGamesPlayed,
  updateGamesWon: updateGamesWon,
  updateRanking: updateRanking
};