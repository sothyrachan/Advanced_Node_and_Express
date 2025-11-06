/*global io*/
let socket = io();

$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    socket.on('user count', function(data) {
      console.log(data);
    });

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});