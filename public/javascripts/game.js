socket.emit("pageLoaded",{});

$("#game-table").click(function(){
	var currentBoard = "";
	for (var i =0; i < 9; i++) {
		if ($("#" + i).html() != "") {
			currentBoard += $("#" + i).html();
		}
		else {
			currentBoard += "0";
		}
	}
	console.log("currentBoard before change is " + currentBoard);
	if ($("#" + event.target.id).html() == "") {
		console.log("picked an empty spot")
		var player_turn = $("#player-turn").html();
		var board = currentBoard.substring(0, event.target.id) + player_turn + currentBoard.substring(parseInt(event.target.id)+1);
		console.log("going to send the board " + board + " from player " + player_turn);
		socket.emit("emitBoard", {board:board, turn:player_turn});
	}

});

socket.on("getUserBoardInformation", function(data) {
	if(turn=="redirect") {
		window.location.href = "http://tictactoemania.com:3000/";
	}
	else {
		console.log("setting up board and player-turn with " + data.board + " and " + data.turn);
		document.getElementById("messageToUser").html = "You are " + data.turn;
		document.getElementById("player-turn").html = data.turn;
		var currentBoard = data[board];
		for (var i = 0; i < currentBoard.length; i++) {
			if (currentBoard[i] !== "0") {
				var id = (i).toString();
				$("#" + id).html(currentBoard[i]);
			}
		}
	}
});
