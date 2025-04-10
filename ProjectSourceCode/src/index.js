// *****************************************************
// <!-- Import Dependencies -->
// *****************************************************

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const http = require('http');
const server = http.createServer(app);
//initialize a new instance of socket.io by passing the server object
const { Server } = require("socket.io");
const io = new Server(server); // socket instance

// *****************************************************
// <!-- Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };

const db = pgp(dbConfig);
  
// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- App Settings -->
// *****************************************************

const user = {
    username: undefined,
    password: undefined
  };

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use("/js",express.static(path.join(__dirname, 'public/js')));
app.use("/css",express.static(path.join(__dirname, 'public/css')));

app.get("/",(req,res) => 
{
  if(req.session.user)
  {
    res.render("./pages/altLogin", { message: `Already logged in as, ${user.username}` } );
  }
  else
  {
    res.render("./pages/login",{});
  }
});

app.get("/homeCanvas", (req, res) => 
{
    res.render("./pages/homeCanvas");
});

app.get("/login", (req, res) => 
{
  if(req.session.user)
  {
    res.render("./pages/altLogin",{ message: `Already logged in as, ${user.username}` } );
  }
  else
  {
    res.render("./pages/login",{});
  }
});

app.get('/pixel-art', (req, res) => {
  console.log('Pixel art route accessed!');
  const canvasRows = [];
  const canvasWidth = 32;
  const canvasHeight = 32;
  
  for (let i = 0; i < canvasHeight; i++) {
      const row = [];
      for (let j = 0; j < canvasWidth; j++) {
          row.push({});
      }
      canvasRows.push(row);
  }
  
  // Change this line to match your folder structure
  res.render('./pages/pixel-art', {
      title: 'Pixel Art Creator',
      canvasRows: canvasRows
  });
});

app.get('/test-login', (req, res) => {
  // Create a test user session
  req.session.user = {
    username: "admin",
    password: "admin"
  };
  res.redirect('/pixel-art');  // Redirect to pixel art page after "logging in"
});

app.post("/login", async(req, res) => 
{
console.log("In post login")
const query = `select password from users where username= ${req.body.username};`;
try
{
    const results = await db.any(query);
    const match = await bcrypt.compare(req.body.password, results[0].password);
    
    if(match === true)
    {
    user.password = req.body.password;
    user.username = req.body.username;
    req.session.user = user;
    req.session.save();
    res.redirect("/homeCanvas");

    }
    else
    {
    
    res.status(400).render("./pages/login",{message:"Incorrect username or password"});
    }
}
catch(err)
{
    res.redirect("/register");
    console.log(err);
}
});

app.get("/register", (req, res) => 
{
  res.render("./pages/register",{});
});

app.post("/register", async (req,res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = `Insert into users (username,password) values ( ${req.body.username}, ${hash} );`
  const testUsername = req.body.username.replace(/\s/g,"");
  try
  {
    if(testUsername.length !== 0)
    {
        db.any(query);
        res.redirect("./pages/login");
    }
    else
    {
      res.status(400).render("./pages/register");
    }
  }
  catch(err)
  {
    res.status(400).render("./pages/register");
  }

});

app.get('/color_picker', (req, res) => {
    res.render('./pages/color_picker.hbs');
});

app.get('/logout', (req, res) => {
    const saveUsername = user.username;
    req.session.destroy( (err) => {
        res.render('./pages/logout',{username: saveUsername});
    });
});
    
//add variable to save last room

app.post("/canvas", async(req, res) => {
    console.log("---------------------------------------------------");
    const inRoom = false;
    //io.on('connection', (socket) => {if(socket.rooms.has(req.body.roomName)){inRoom = true;} else { inRoom = false;}});
    if(!inRoom) {
        const roomId = await req.body.roomInput;
        req.body.roomInput = '';
        res.render('./pages/privateCanvas',{canvasNumber: roomId});
        console.log("here comes the tricky part");
        let entered = false
        io.on('connection', (socket) => {
          if(entered === false){
            designateRoom(socket,roomId);  // this function should only be called once per post request
            entered = true;
        }});
    }
});
// *****************************************************
// <!-- LAB 11 -->
// *****************************************************

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

// *****************************************************
// <!-- Authentication middleware. -->
// *****************************************************

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
app.use(auth);

const rooms = new Map();
const socketsToRooms = new Map();

function roomOrganizer(socket,roomName)
{
  if(socketsToRooms.has(roomName))
  {
    const sockets = [];
    for (const socketIn of socketsToRooms.get(roomName))
      {
        if(socketIn !== socket.id)
          {
            sockets.push(socketIn);
          }
      }
    if(sockets.length === 0)
    {
      console.log("deleting");
      socketsToRooms.delete(roomName);
      rooms.delete(roomName);
    }
    else
    {
      socketsToRooms.set(roomName,sockets);
    }
  }
}
//This server side code will proccess the transmitted information from the client side and then broadcast the information out to the appropriate websockets

function designateRoom(socket,newRoom)
{
  console.log(`im here now ${socket.id} with room name ${newRoom}`);


  if(!socketsToRooms.has(newRoom)) //new room
  {
      console.log("NEW ROOM CREATED");
      socket.join(newRoom); //joining new room
      //socket.rooms.add(newRoom);
      socketsToRooms.set(newRoom, [socket.id]);  //adding socket to room record
      console.log(socketsToRooms);
  }
  else
  {   //This loop is going to check to see if websocket is in room
      socket.join(newRoom);  //adding websocket to room
      //socket.rooms.add(newRoom);
      console.log("UPDATING LOG");
      io.to(socket.id).emit("chat message", rooms.get(newRoom));  //getting newly added websocket up to speed by 'pushing' the rooms record to it
      socketsToRooms.get(newRoom).push(socket.id);  //adding websocket to room record
  }
}
// boradcasting message to the room/s that the socket is in. However sockets will only ever be in one room
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {

        for(const roomName of socket.rooms)
        {
          if(roomName !== socket.id)
          {
            console.log(`Chatting to room ${roomName}`);
            if(!rooms.has(roomName))
            {
                rooms.set(roomName,[msg]); // adding message to message log
                io.to(roomName).emit("chat message", [msg]);  //broadcasting message to everyone in room
            }
            else
            {
                rooms.get(roomName).push(msg);  //adding message to record
                io.to(roomName).emit("chat message", [msg]);  //broadcasting message to everyone in room
            }
            break;
          }
          
        }
    });
  });

io.on("connection", socket => {
  socket.on("disconnecting", () => {
    for(const roomName of socket.rooms)
      {
        roomOrganizer(socket,roomName);
      }
  });
});

io.on('connection', (socket) => {
    console.log('User connected');
    
});

module.exports = server.listen(3000, () => {
  console.log("listening on *:3000");
});
