var currentBoard = $("#invisiboard").html();
for (var i =0; i < currentBoard.length ;i++) {
	if (currentBoard[i] !== "0") {
		var id = (i+1).toString();
		$("#" + id).html(currentBoard[i]);
	}
}

$("#game-table").click(function(){
	if ($("#" + event.target.id).html() == "") {
		var player_turn = null;
		if ($("#player-turn").html() == "0") {
			player_turn = "X";
		}
		else if ($("#player-turn").html() == "1") {
			player_turn = "O";
		}
		else {
			console.log("could not get player turn");
		}
		var board = currentBoard.substring(0, event.target.id) + player_turn + currentBoard.substring(parseInt(event.target.id)+1);
		console.log(board);
		socket.emit("emitBoard", {board:board});
	}
	
});

// make a socket.io function that accepts the board from the server and updates it