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
    host: process.env.POSTGRES_HOST, // the database server
    port: process.env.POSTGRES_PORT, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };

const db = pgp(dbConfig);
  
// test database
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

//only used in login when creating user session
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

//if already logged in tell the user. Otherwise go to login page
app.get("/",(req,res) => 
{
  if(req.session.user)
  {
    res.render("./pages/altLogin", { message: `Already logged in as, ${req.session.user.username}` , username: req.session.user.username} );
  }
  else
  {
    res.render("./pages/login",{});
  }
});

app.get("/homeCanvas", (req, res) => 
{
  if(req.session.user)
  {
    res.render("./pages/homeCanvas",{username: req.session.user.username});
  }
  else
  {
    res.render("./pages/login",{});
  }

});

app.get("/login", (req, res) => 
{
  if(req.session.user)
  {
    res.render("./pages/altLogin",{ message: `Already logged in as, ${req.session.user.username}` , username: req.session.user.username} );
  }
  else
  {
    res.render("./pages/login",{});
  }
});

//The following app.get initializes all required items for a canvas to be created
app.get('/pixel-art', async(req, res) => {
  const canvasRows = [];
  const canvasWidth = 32;
  const canvasHeight = 32;
  const paletteRows = [];
  const paletteWidth = 5;
  const paletteHeight = 5;

  for (let i = 0; i < canvasHeight; i++) {
    const row = [];
    for (let j = 0; j < canvasWidth; j++) {
        row.push({});
    }
    canvasRows.push(row);
  }

  for (let i = 0; i < paletteHeight; i++) {
    const row = [];
    for (let j = 0; j < paletteWidth; j++) {
        row.push({});
    }
    paletteRows.push(row);
  }

  if(req.session.user)
  {
    console.log('Rendered: /pixel-art');

      console.dir(paletteHeight,paletteRows,canvasHeight,canvasRows)
      res.status(200).render('./pages/pixel-art', {
      title: 'Pixel Art Creator',
      canvasRows: canvasRows,
      paletteRows: paletteRows,
      saved_canvas: req.session.saved_canvas,
      artwork_id: req.session.artwork_id,
      artwork_name: req.session.artwork_name,
      username: req.session.user.username
  });
  }
  else
  {
    res.render("./pages/login",{});
  }

});


app.post("/login", async(req, res) => 
{
const query = "select password from users where username = '"+req.body.username+"';";
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
  const query = "Insert into users (username,password) values ( '"+req.body.username+"','"+ hash + "');";
  const testUsername = req.body.username.replace(/\s/g,"");
  try
  {
    if(testUsername.length !== 0)
    {
        await db.any(query);
        
        user.password = req.body.password;
        user.username = req.body.username;
        req.session.user = user;
        req.session.save();
        res.redirect("/homeCanvas");

        if(req.body.username == 'John Doe')
        {
          db.any("DELETE FROM users WHERE username = 'John Doe';");
        }
    }
    else
    {
      res.status(400).render("./pages/register",{message:"Invalid Username"});
    }
  }
  catch(err)
  {
    res.status(400).render("./pages/register",{message: "Username is not valid"});
  }

});
/**
 * /save_canvas will save artwork to the artwork database. 
 * It also adds a linking entry into users_to_artwork which connects user to their artwork.
 * Artwork is saved using JSON.Stringify( argx ). argx is a 2D array with the HEX format.
 * If an artwork created by a user has the same name as another peice of their art, then the previous peice of art will be updated.
 */
app.post('/save_canvas', async(req, res) => {
  
  const removeSpace = req.body.name.replace(/\s/g,"");
  let saveUser = '';
  try
  {
    saveUser = req.session.user.username;
  }
  catch
  {
    res.render("./pages/login",{});
  }
  if(saveUser != undefined && removeSpace.length > 0)
  {
  const searchForSameName = "select Count(*) from users left join users_to_artwork on users.username = users_to_artwork.username left join artwork on artwork = artwork.artwork_id where users.username = '"+saveUser+"' AND artwork.artwork_name = '"+req.body.name+"';";
  const countExistingArt = await db.any(searchForSameName);

  if(countExistingArt[0].count == 1)
  {
    const searchForArtId = "select artwork.artwork_id from users left join users_to_artwork on users.username = users_to_artwork.username left join artwork on artwork = artwork.artwork_id where users.username = '"+saveUser+"' AND artwork.artwork_name = '"+req.body.name+"';";
    const getArtId = await db.any(searchForArtId);
    const updateExistingQuery = "update artwork set properties = '"+JSON.stringify(req.body.properties)+"' where artwork.artwork_id = "+getArtId[0].artwork_id+";";
    await db.none(updateExistingQuery);
  }
  else
  {
    const query = `
    INSERT INTO artwork (artwork_name, properties)
    VALUES ('${req.body.name}', '${JSON.stringify(req.body.properties)}');`;

    try {
        await db.none(query);
        const artworkPrimaryKey = 'select Count(*) from artwork;';
        const countArt = await db.any(artworkPrimaryKey);
        const addLinkFromUserToArt = "insert into users_to_artwork(username,artwork) values ('"+saveUser+"',"+countArt[0].count+");";
        await db.none(addLinkFromUserToArt);
        res.status(204);
    }
    catch (err) {
        res.status(400);  
    }
  }
}
});

app.get('/logout', (req, res) => {
  if(req.session.user)
  {
    const PastUser = req.session.user.username;
    req.session.destroy( (err) => {
        res.render('./pages/logout',{Loggedout: PastUser});
        user.password = undefined;  // reseting pasword feild
        user.username = undefined;  // reseting username feild
    });
  }
  else
  {
    res.render("./pages/login",{});
  }
});
/**
 * /save_thumbnail will update the thumbnail column of the artwork table with the new thumbnail if the artwork exists. 
 * If it does not exist, then a new entry with the artwork name will be added to the artwork table along with a new enrty 
 * into the linking table users_to_artwork.
 */
app.post('/save_thumbnail', async(req, res) => {
  let theCountOfSameNameArt = 0;
  try
  {
    const checkForDuplicates = "select Count(*) from users left join users_to_artwork on users.username = users_to_artwork.username left join artwork on artwork = artwork.artwork_id where users.username = '"+req.session.user.username+"' AND artwork.artwork_name = '"+req.body.theName+"';";
    const countDuplicates = await db.any(checkForDuplicates);
    theCountOfSameNameArt = countDuplicates[0].count
    if(req.session.artwork_id != -1 && theCountOfSameNameArt == 0)
    {
      req.session.artwork_id = -1;
    }
    console.log("artwork_id: "+ req.session.artwork_id + " theCountOfSameNameArt: "+ theCountOfSameNameArt);
  }
  catch(err)
  {
    res.status(400);
  }
  if(req.session.artwork_id == -1 && theCountOfSameNameArt == 0)
  {
    const insertQuery = `
    INSERT INTO artwork (artwork_name, thumbnail)
    VALUES ('${req.body.theName}','${req.body.image}');`;
    try {
          await db.none(insertQuery);
          const getArtworkKey = 'select Count(*) from artwork;';
          const countArt = await db.any(getArtworkKey);
          req.session.artwork_id = countArt[0].count;
          const insertUserToArt = "insert into users_to_artwork(username,artwork) values ('"+req.session.user.username+"',"+countArt[0].count+");";
          await db.none(insertUserToArt);
    }
    catch (err) {
        res.status(400);  
    }
  }
  else
  {
    if(req.session.artwork_id == -1 && theCountOfSameNameArt != 0)
    {
      const findId = "select artwork_id from users left join users_to_artwork on users.username = users_to_artwork.username left join artwork on artwork = artwork.artwork_id where users.username = '"+req.session.user.username+"' AND artwork.artwork_name = '"+req.body.theName+"';";
      const lookForId = await db.any(findId);
      req.session.artwork_id = lookForId[0].artwork_id;
    }
    const query = `
    UPDATE artwork
    SET thumbnail = '${req.body.image}'
    WHERE artwork_id = ${req.session.artwork_id};
  `;
  //could check to see if session.artwork_id == TheId
  try {
    await db.none(query);
    res.status(201);
  }
  catch (err) {
    console.log(err);
    res.status(400);
  }   
  }
});
    

/**
 * If a user enters an exclusive canvas then /canvas will create the nessesary items for a collaborative canvas and send 
 * that to pixel-art.hbs
 */
app.post("/canvas", async(req, res) => {
  if(true) // change to req.session.user on production version
    {
      req.session.saved_canvas = false;
      req.session.artwork_id = -1;
      req.session.artwork_name = "";

      const roomId = await req.body.roomInput;
      req.body.roomInput = '';
      const canvasRows = [];
      const canvasWidth = 32;
      const canvasHeight = 32;
      const paletteRows = [];
      const paletteWidth = 5;
      const paletteHeight = 5;
    
      for (let i = 0; i < canvasHeight; i++) {
        const row = [];
        for (let j = 0; j < canvasWidth; j++) {
            row.push({});
        }
        canvasRows.push(row);
      }
    
      for (let i = 0; i < paletteHeight; i++) {
        const row = [];
        for (let j = 0; j < paletteWidth; j++) {
            row.push({});
        }
        paletteRows.push(row);
      }
    //SETTING UP CANVAS
      if(req.session.user)
      {
        console.log('Rendered: /pixel-art');
    
          console.dir(paletteHeight,paletteRows,canvasHeight,canvasRows)
          res.render('./pages/pixel-art', {
          title: 'Pixel Art Creator',
          canvasRows: canvasRows,
          paletteRows: paletteRows,
          saved_canvas: req.session.saved_canvas,
          artwork_id: req.session.artwork_id,
          artwork_name: req.session.artwork_name,
          username: req.session.user.username,
          canvasNumber: roomId
      });
      }
      else
      {
        res.render("./pages/login",{});
      }
    
      // when entering a room, the new websocket either should create a now room or get updated on all changes in existing room
      let entered = false
      io.on('connection', (socket) => {
        if(entered === false){
          designateRoom(socket,roomId);  // this function should only be called once per post request
          entered = true;
      }});
    }
    else
    {
      res.render("./pages/login",{});
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
/**
 * Private Gallary will get all artworks pertaining to the logged 
 * in user from the artwork table and send them in a list to privateGallery.hbs page
 */
app.get('/private_gallery', async (req, res) => {
    const COLS_PER_ROW = 3;
    const query = `
        WITH user_artwork_ids AS (
          SELECT artwork FROM users_to_artwork
          WHERE username = '${req.session.user.username}'
        )
        SELECT * 
        FROM artwork INNER JOIN user_artwork_ids
        ON artwork.artwork_id = user_artwork_ids.artwork;
    `;
    
    try {
        const results = await db.any(query);
        const num_rows = Math.floor(results.length / COLS_PER_ROW) + 1;
        const split_results = [];
        for (let i = 0; i < num_rows; i++) {
            split_results[i] = results.slice(i * COLS_PER_ROW, i * COLS_PER_ROW + COLS_PER_ROW);
        }   
        res.status(200).render('./pages/privateGallery.hbs', {
            artworks: split_results,
            username: req.session.user.username
        });
    }
    catch (err) {
        res.status(404).render('./pages/privateGallery.hbs', {
            artworks: [],
            username: req.session.user.username
        });
    }
});

app.post('/load_canvas', (req, res) => {

  if ("new_canvas" in req.body) {
      req.session.saved_canvas = false;
      req.session.artwork_id = -1;
      req.session.artwork_name = "";
  }
  else {
      req.session.saved_canvas = true;
      req.session.artwork_id = req.body.artwork_id;
      req.session.artwork_name = req.body.artwork_name;
  }

  res.status(200).redirect('/pixel-art')
});
// get('/load_canvas') will search for artwork by name and artwork id from the artworks table in users_db. 
// This will then be sent to the front end to load the canvas.
app.get('/load_canvas', async (req, res) => {
  const query = `
      WITH user_artwork_ids AS (
        SELECT artwork FROM users_to_artwork
        WHERE username = '${req.session.user.username}'
      ),
      user_artworks AS (
        SELECT * 
        FROM artwork INNER JOIN user_artwork_ids
        ON artwork.artwork_id = user_artwork_ids.artwork
      )
      SELECT * FROM user_artworks
      WHERE user_artworks.artwork_id = '${req.session.artwork_id}';
  `;

  try {
      const result = await db.one(query);
      console.dir(result, {depth: null});
      res.status(200).send(result);
  }
  catch (err) {
      res.status(400);
  }
});

const rooms = new Map();
const socketsToRooms = new Map();

/**
 * This function cleans up after a socket has been disconnected from a room.
 * If a room(Exclusive canvas) is empty then the canvas will be deleted from rooms
 */
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

      socketsToRooms.delete(roomName);
      rooms.delete(roomName);
      return true;
    }
    else
    {
      socketsToRooms.set(roomName,sockets);
    }
    return false;
  }
}
//This server side code will proccess the transmitted information from the client side and then broadcast the information out to the appropriate websockets

function designateRoom(socket,newRoom)
{
  console.log("Socket ID: "+ socket.id + " Is In Room:"+ newRoom);
  console.log("User is updated");
  if(!socketsToRooms.has(newRoom)) //new room
  {
      socket.join(newRoom); //joining new room
      socketsToRooms.set(newRoom, [socket.id]);  //adding socket to room record
  }
  else
  {   //This loop is going to check to see if websocket is in room
      socket.join(newRoom);  //adding websocket to room
      io.to(socket.id).emit("update all", rooms.get(newRoom));  //getting newly added websocket up to speed by 'pushing' the rooms record to it
      socketsToRooms.get(newRoom).push(socket.id);  //adding websocket to room record
  }
}

// boradcasting update to the room/s that the socket is in. However sockets will only ever be in one room
io.on('connection', (socket) => {
    socket.on('update', (row, col, chosen_color, canvasHeight, canvasWidth) => {

        for(const roomName of socket.rooms)
        {
          if(roomName !== socket.id)
          {
            console.log(`painting in room ${roomName}`);
            if(!rooms.has(roomName))
            {
              const canvasData = [];
              for (let i = 0; i < canvasHeight; i++) {
                  const row = [];
                  for (let j = 0; j < canvasWidth; j++) {
                      row.push(0); // 0 means white/empty, 1 means black/filled
                  }
                  canvasData.push(row);
              }
              canvasData[row][col] = chosen_color;
              rooms.set(roomName,canvasData); // adding message to message log
              io.to(roomName).emit("update", row, col, chosen_color);  //broadcasting message to everyone in room
            }
            else
            {
                rooms.get(roomName)[row][col] = chosen_color  //adding message to record
                io.to(roomName).emit("update", row, col, chosen_color);  //broadcasting message to everyone in room
            }
            break;
          }
          
        }
    });
  });
// on disconnection of websocket roomOrganizer will delete any rooms/saved information about rooms that are now vacant
io.on("connection", socket => {
  socket.on("disconnecting", () => {
    for(const roomName of socket.rooms)
      {
        if(socket.id != roomName)
        {
          roomOrganizer(socket,roomName);
        }
      }
      console.log('User disconnected')
  });
});

io.on('connection', (socket) => {
    console.log('User connected');
});

module.exports = server.listen(3000, () => {
  console.log("listening on *:3000");
});
