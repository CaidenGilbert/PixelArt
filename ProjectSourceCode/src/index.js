const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
//initialize a new instance of socket.io by passing the server object
const { Server } = require("socket.io");
let rooms = new Map();
let socketsToRooms = new Map();
const io = new Server(server);

app.get('/', (req,res) => {
    res.sendFile(__dirname + '/index.html');

});

io.on('connection', (socket) => {
    socket.on('room num', (sockId, msg) => {
        console.log("here");
        console.log("directed to " + sockId);
        console.log("User id: "+ socket.id);
        console.log("message: "+ msg);
        if(!socketsToRooms.has(sockId)) // new room
        {
            socket.rooms.clear();
            socket.join(sockId);
            socketsToRooms.set(sockId, [socket.id]);
            rooms.set(sockId,[msg]);
            console.log(rooms.get(sockId));
            io.to(sockId).emit("chat message", rooms.get(sockId));
        }
        else
        {
            let inList = false;
            for(const x of socketsToRooms.get(sockId))
            {
                if(x == socket.id)
                {
                    inList = true;
                    break;
                }
            }
            
            if(!inList)
            {
                socket.rooms.clear();
                console.log(socketsToRooms.get(sockId));
                console.log("here comes to tricky part "+ rooms.get(sockId));
                socket.join(sockId);
                io.to(socket.id).emit("chat message", rooms.get(sockId));
                socketsToRooms.get(sockId).push(socket.id);
            }
            else
            {
                rooms.get(sockId).push(msg);
                io.to(sockId).emit("chat message", [msg]);
            }
        }
        
        
    });
});
// listen on the connect even for incoming sockers and log it to the console
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log("message: "+ msg);
        io.emit('chat message', [msg]);
    });
  });

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('disconnect',() =>{
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});