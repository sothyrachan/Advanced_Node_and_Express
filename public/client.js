// client.js

/*global io*/
$(document).ready(function () {
  let socket = io();

  socket.on("user count", function (count) {
    console.log("Current Users:", count);
  });

  // Form submittion with new message in field with id 'm'
  $("form").submit(function () {
    var messageToSend = $("#m").val();
    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});