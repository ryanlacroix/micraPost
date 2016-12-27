$(document).ready(function() {
	$('#newPost').click(showNewPostArea);
});

var postAreaVisible = false;
function showNewPostArea() {
	if (postAreaVisible === false){
		// Create post area and submit button
		var newPostArea = $("<textarea id='tArea' rows='4' columns='300'></textarea>");
		newPostArea.insertBefore($('#postControls'));
		postAreaVisible = true;	
		var sendButton = $("<button id='submitPost'>Post!</button>");
		sendButton.insertBefore($('#newPost'));
		$('#submitPost').click(sendPost);
		$("<br id='brk'>").insertAfter($('#tArea'));
		$('#newPost').text("Cancel");
	} else {
		// Undo post area. Reset buttons etc.
		$('#tArea').remove();
		$('#submitPost').remove();
		$('#brk').remove();
		$('#newPost').text("Create new post");
		// Need to add listener remover for sendButton click
		postAreaVisible = false;
	}
	
}

function sendPost() {
	var postText = $('#tArea').val();
	$.ajax ({
		method: "POST",
		dataType   : 'json',
   		contentType: 'application/json; charset=UTF-8',
		data: JSON.stringify({msg: postText}),
		url: "/makePost",
		success: addPost
	});
}
function addPost(data) {
	// needs: data.date
	//        data.text
	$("#posts").prepend("<p>" + data.text + "</p>");;
	$('#tArea').remove();
	$('#submitPost').remove();
	$('#brk').remove();
	$('#newPost').text("Create new post");
		// Need to add listener remover fow sendButton click
	postAreaVisible = false;
}