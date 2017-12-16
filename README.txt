Large Scale Web Applications
Course Project - Team 3

Tic-Tac-Toe Mania!

The project is mainly written in JavaScript and the backend is implemented via the web framework Express.js.

The code organization is as follows:

User Authentication------------------------------
Tic-Tac-Toe Mania supports federated login by Google and the relevant code is located in
•	views/index.hbs: The sign-in button is displayed by default.
•	views/layout.hbs: If the user signed in, sign-out button is displayed, and if not, the button is not displayed. Google API is loaded to set up login logic and the sign-out logic is also implemented here.
•	views/signin_prompt.hbs: New user registers Tic-Tac-Toe account.
•	public/scripts/signIn.js: Access profile info after user signs in
•	db.js: Google sign-in info is used to register to MySQL database
-------------------------------------------------

Database

Views--------------------------------------------
•	views/index.hbs: Homepage where the user can sign in with his Google account
•	views/game.hbs: Game page where users play Tic-Tac-Toe
•	views/layout.hbs: Template for all views; Sets up integration with Google API
•	views/signin_prompt.hbs: Registration page for new users
•	views/error.hbs: Error message page
-------------------------------------------------

Batch Processing

We use Google Cloud Dataflow SDK to run the batch processing with Java and Eclipse. Google Cloud Platform plugin for Eclipse is required.

•I/O is used to read and write to our MYSQL database on JDBC using the following "org.apache.beam.sdk.io.java.jdbc". Dependencies can be downloaded at "https://jar-download.com/?detail_search=g%3A%22org.apache.beam%22%20AND%20a%3A%22beam-sdks-java-io-jdbc%22&search_type=av&a=beam-sdks-java-io-jdbc"
•	The code get the scores from the user table, sorts it and updates ranking and suggestions on the database.
• At the moment it only works when run on local machine.

Real Time Interaction

We are able to send requests to online players, that are not already playing a game, and invite them to play. 

