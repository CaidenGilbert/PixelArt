const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
//initialize a new instance of socket.io by passing the server object
const { Server } = require("socket.io");
let rooms = new Map();
let socketsToRooms = new Map();
const io = new Server(server);

//This is the homepage and only page for this MVP
app.get('/', (req,res) => {
    res.sendFile(__dirname + '/index.html');
});
//This server side code will proccess the transmitted information from the client side and then broadcast the information out to the appropriate websockets
io.on('connection', (socket) => {
    socket.on('room num', (sockId, msg) => {
        console.log("here");
        console.log("directed to " + sockId);
        console.log("User id: "+ socket.id);
        console.log("message: "+ msg);
        if(!socketsToRooms.has(sockId)) //new room
        {
            socket.rooms.clear();
            socket.join(sockId);  //joining new room
            socketsToRooms.set(sockId, [socket.id]);  //adding socket to room record
            rooms.set(sockId,[msg]); // adding message to message log
            console.log(rooms.get(sockId));
            io.to(sockId).emit("chat message", rooms.get(sockId));  //boradcasting the massage to all websockets in room
        }
        else
        {   //This loop is going to check to see if websocket is in room
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
                socket.join(sockId);  //adding websocket to room
                io.to(socket.id).emit("chat message", rooms.get(sockId));  //getting newly added websocket up to speed by 'pushing' the rooms record to it
                socketsToRooms.get(sockId).push(socket.id);  //adding websocket to room record
            }
            else
            {
                rooms.get(sockId).push(msg);  //adding message to record
                io.to(sockId).emit("chat message", [msg]);  //broadcasting message to everyone in room
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