
const express = require('express');
const app = express();
const port = 3000;
const session = require('express-session');

app.use(express.static('views'));
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: '123456789',
    resave: false,
    saveUninitialized: false
  }));

app.get('/', (req, res) => {

    res.sendFile(__dirname + '/views/index.html');
})
let nickname;
app.post('/', (req, res) => {
    nickname = req.body.nickname;
    req.session.nickname = nickname;
    res.redirect(`/game`);
})
app.get('/game', (req, res) => {

    if(!req.session.nickname) res.redirect('/');
    res.sendFile(__dirname + '/views/game.html');
})

const expressServer = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const socketio = require('socket.io');
const io = socketio(expressServer,{}); 


let food = generateFood(700); // Generate 100 food particles

// Generate random food positions
function generateFood(count) {
  const food = [];
  const colors = ['#D16BA5','#86A8E7','#5FFBF1','#00bca1','#005c8b',"yellow","red","green","blue","orange","purple","pink"];
  for (let i = 0; i < count; i++) {
    food.push({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return food;
}
let players = {};
io.on('connect', (socket) => {
    const colors = ["red", "green", "blue", "yellow", "orange", "purple", "pink"];
    if(nickname){
        players[socket.id] = {
            id: socket.id,
            nickname: nickname,
            x: 50 + Math.random() * 1000,
            y: 50 + Math.random() * 600,
            size: 10,
            color: colors[Math.floor(Math.random() * colors.length)]
        };   
    };

    socket.emit('init', {players,food} );
    socket.on('new-player', (data) => {
        players[data.id] = data.player;
        io.emit('new-player', data);
    })
    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
      
            // Check for collisions with food
            food = food.filter((f) => {
              const distance = Math.hypot(
                players[socket.id].x - f.x,
                players[socket.id].y - f.y
              );
              if (distance < players[socket.id].size) {
                players[socket.id].size += 1; // Grow player
                if(food.length <650){
                    let f = generateFood(50);
                    food = food.concat(f);
                }
                return false; // Remove food
              }
              return true;
            });
      
            // Check for collisions with other players
            for (let id in players) {
              if (id !== socket.id) {
                const otherPlayer = players[id];
                const distance = Math.hypot(
                  players[socket.id].x - otherPlayer.x,
                  players[socket.id].y - otherPlayer.y
                );
                if (distance < players[socket.id].size + otherPlayer.size) {
                  if (players[socket.id].size > otherPlayer.size) {
                    players[socket.id].size += players[id].size; 
                    delete players[id];
                  } else {
                    players[id].size += players[socket.id].size; 
                    delete players[socket.id]; 
                    
                  }
                }
              }
            }
      
            // Emit updated player data
            io.emit("update", { players, food });
          }
    })

    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit("player-left", socket.id);
      });
    console.log(players)

    
});

