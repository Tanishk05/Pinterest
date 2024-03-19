const io = require( "socket.io" )();
const userModel = require(`./routes/users`);

const socketapi = {
    io: io
};


io.on( "connection", function(socket) {
    console.log("user connected ");
    
});



io.on(`disconnect`, function( socket ){
    console.log("user disconnected ");
})



module.exports = socketapi;