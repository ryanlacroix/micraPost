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

app.use(cookieParser());

app.get("/", function(req, res){
	// Connect to main page
	if (req.cookies.username === undefined){
		// No previous session found
		res.render('login');
	} else {
		// Previous session found. Authenticate user.
		//var user = req.cookies.username;
		MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
			if (err) {
				console.log("FAILED TO CONNECT TO DATABASE.");
			} else {
				var userObj = db.collection("blogDB").findOne({username: req.cookies.username}, function (err, result) {
					if (err) {
						console.log("User wasn't found.");
						res.render('login');
					} else {
						res.render('home', userObj);
					}
				});
				console.log("Connected to database. Checking authentication..");


				/*
				cursor.each(function(err, document){
					if (document != null) {
						if (document.auth == user.auth) {
							// Match found, send user's homepage
							var userInfo = {};
							userInfo.name = document.name;
							// Eventually need document.posts
							res.render('home', userInfo);
						}
					}// This could probably be optimized with a findOne call
				}); //                and no each loop. Woops! */
			}
		});
	}
	//res.render('index');
});
app.use("/makePost", bodyParser.json());
app.post("/makePost", function (req, res) {
	console.log("got into makePost");
	
	MongoClient.connect("mongodb://localhost:27017/blogDB", function (err, db) {
		if (err) {
			console.log("FAILED TO CONNECT TO DATABASE.")
		} else {
			// Should instead be checking authentication in cookie!
			// req.body.username doesn't exist, need to check cookie
			db.collection("users").update({username: req.cookies.username},
				{$push: {posts: { $each: [req.body.msg], $position: 0}}}, function (err, result) {
				if (err) {
					console.log("Error updating user's posts.");
					db.close();
					res.send(JSON.stringify({text: "Something went wrong :<"}));
				} else {
					db.close();
					res.send(JSON.stringify({text: req.body.msg}));
				}
			});
			/* Need to add a response!!!
			db.collection("users").findOne({username: req.cookies.username}, function (err, result) {
				if (err) {
					console.log("A post failed");
				} else {
					// This crashes the server when result is null
					console.log(req.body.msg);
					console.log(result.username);
					console.log(req.body.msg);
					//result.posts.push(req.body.msg);// Need to use mongo api

					res.send(JSON.stringify({text: req.body.msg}));
				}
			}) */
		}
	});
});

app.use("/newAcct", bodyParser.urlencoded({extended: true}));
app.post("/newAcct", function (req, res){
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
			} else {
				// Try to find the user object
				console.log(req.body.username);
				db.collection("users").findOne({username:req.body.username}, function (err, result){
					userObj = result;
					if (userObj == undefined) {
						// Username doesn't exist
						res.render('sorry', {username: req.body.username}); // Need to add ++++++++++++++
					} else {
						// Username exists! Check the password.
						if (req.body.pass === userObj.pass) {
							// Password correct. Create session cookies.
							userObj.authToken = hat();
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

app.use(express.static("./public"));

app.listen(2406, function(){ console.log("Running on 2406.")});