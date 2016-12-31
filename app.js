var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
var MongoClient = require('mongodb').MongoClient;
var cookieParser = require('cookie-parser');
var hat = require('hat');
const ROOT = "./public";

app.set('views', './views');
app.set('view engine', 'pug');

app.use("*", function (req, res, next) {
	console.log("\n----new request----")
	console.log(req.originalUrl);
	next();
});

app.use(cookieParser());
app.use(express.static("./public"));

// No CSS error is coming from this being called in place of the static
// route for user/kt/style.css I think
/*app.use("/user", function (rec, res, next) {

}*/
app.get("/user/:username", function (req, res) {
	// Request for public user page
	console.log('hello');
	MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
		if (err) {
			console.log("FAILED TO CONNECT TO DATABASE");
		} else {
			db.collection("users").findOne({username: req.params.username}, function (err, result) {
				console.log(result);
				userObj = result;
				db.close();
				res.render('userPage', userObj);
			});
		}
	});
});

app.get("/", function (req, res){
	console.log("in main!");
	// Connect to main page
	if (req.cookies.username === undefined){
		// No previous session found
		res.render('login');
	} else {
		// Previous session found. Authenticate user.
		MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
			if (err) {
				console.log("FAILED TO CONNECT TO DATABASE.");
			} else {
				// login with cookie bug here
				var userObj = db.collection("blogDB").findOne({username: req.cookies.username}, function (err, result) {
					if (err) {
						console.log("User wasn't found.");
						res.render('login');
					} else {
						// also error
						res.render('home', userObj);
					}
				});
				console.log("Connected to database. Checking authentication..");
			}
		});
	}
});
app.use("/makePost", bodyParser.json());
app.post("/makePost", function (req, res) {
	console.log("got into makePost");
	
	MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
		if (err) {
			console.log("FAILED TO CONNECT TO DATABASE.")
		} else {
			// Should instead be checking authentication in cookie!
			// Callback never called. Guess this needs to be wrapped?
			db.collection("users").update({username: req.cookies.username},
				{$push: {posts: { $each: [req.body.msg], $position: 0}}}, function (err, result) {
					// testing
					console.log("blah:");
					console.log(req.body.msg);
				if (err) {
					console.log("Error updating user's posts.");
					res.send(JSON.stringify({text: "Something went wrong :<"}));
				} else {
					console.log(req.body.msg);
					res.send(JSON.stringify({text: req.body.msg}));
				}
				db.close();
			});
		}
	});
});

app.use("/newAcct", bodyParser.urlencoded({extended: true}));
app.post("/newAcct", function (req, res){
	if (req.body.back) {
		res.render('login');
		return;
	}
	MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
		if (err) {
			console.log("FAILED TO CONNECT TO DATABASE.");
		} else {
			// Insert new user into the database
			usrObj = {}
			usrObj.username = req.body.username;
			usrObj.pass = req.body.pass;
			usrObj.posts = [];

			db.collection("users").insertOne(usrObj, function (err, result){
				if (err) {
					db.close();
					res.render('login', {err: "badInsert"});
				} else {
					db.close();
					res.render('login', {msg: "success"});
				}
			});
		}
	});

});


app.get("/logout", function (req, res) {
	res.cookie('auth', "", {expires: new Date(0)});
	res.cookie('username', "", {expires: new Date(0)});
	res.render('login', {msg: "loggedOut"});
});

app.get("/logoutSuccess", function (req, res) {
	res.render('loggedOut');
});

app.use("/login", bodyParser.urlencoded({extended: true}));
app.post("/login", function (req, res){
	if (req.body.new === "true") {
		// User has requested a new account
		res.render('newAcct');
	} else {
		// User has attempted a login
		MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db){
			if (err) {
				console.log("FAILED TO CONNECT TO DATABASE.");
				// Need to send a response!! +++++++++++++++++++++++
			} else {
				// Try to find the user object
				db.collection("users").findOne({username:req.body.username}, function (err, result){
					userObj = result;
					if (userObj == undefined) {
						// Username doesn't exist
						res.render('login', {err: 'uname', name: req.body.username}); // Need to add ++++++++++++++
					} else {
						// Username exists! Check the password.
						if (req.body.pass === userObj.pass) {
							// Password correct. Create session cookies.
/* Callback hell exists */	userObj.authToken = hat();
							res.cookie('auth', userObj.authToken, {path: '/'});
							res.cookie('username', userObj.username, {path: '/'});
							res.render('home', userObj);
						} else {
							// Password is incorrect
							res.render('login', {err: "pass"})
						}
					}
				});
				
			}
		});
	}

});



app.listen(2406, function(){ console.log("Running on 2406.")});

