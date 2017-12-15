$("#game-table").click(function(){
	var currentBoard = "";
	for (var i =0; i < currentBoard.length; i++) {
		currentBoard += $("#" + i).html();
	}
	if ($("#" + event.target.id).html() == "") {
		var player_turn = null;
		if ($("#player-turn").html() == "x") {
			player_turn = "x";
		}
		else if ($("#player-turn").html() == "o") {
			player_turn = "o";
		}
		else {
			console.log("could not get player turn");
		}
		var board = currentBoard.substring(0, event.target.id) + player_turn + currentBoard.substring(parseInt(event.target.id)+1);

		socket.emit("emitBoard", {board:board, turn:player_turn});
	}

});

socket.on("getUserBoardInformation", function(data) {
	if(turn=="redirect") {
		window.location.href = "http://tictactoemania.com:3000/";
	}
	else {
		document.getElementById("messageToUser").html = "You are " + data[turn];
		document.getElementById("player-turn").html = data[turn];
		var currentBoard = data[board];
		for (var i = 0; i < currentBoard.length; i++) {
			if (currentBoard[i] !== "0") {
				var id = (i).toString();
				$("#" + id).html(currentBoard[i]);
			}
		}
	}
});
