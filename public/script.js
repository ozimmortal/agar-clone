const socket = io();
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log(canvas.width, canvas.height);

let player = {}
let players ={}
let food = []

socket.on('init', (data) => {
    players = data.players;
    food = data.food;
    player = players[socket.id];
});

socket.on('new-player', (data) => {
    players[data.id] = data.player;
});

socket.on('update', (data) => {
    players = data.players;
    food = data.food;
    
})

socket.on("player-left", (playerId) => {
    delete players[playerId];
});

socket.on("eaten", (playerId) => {
    delete players[playerId];
});


let dx = 0;
let dy = 0;
let speed = 1.2;
window.addEventListener('mousemove', (e) => {

    let angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
    player.x += dx;
    player.y += dy;
    socket.emit("move", { x: player.x, y: player.y });

})

function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i in food) {
        let f = food[i];
        c.beginPath();
        c.arc(f.x, f.y, 6, 0, Math.PI * 2, false);
        c.fillStyle = f.color;
        c.fill();
    }
    for (let i in players) {
        let player = players[i];
        c.beginPath();
        c.arc(player.x, player.y, player.size, 0, Math.PI * 2, false);
        c.fillStyle = player.color;
        c.fill();
        c.font = `${player.size - 2}pt Calibri`;
        c.textAlign = 'center';
        c.textBaseline = "middle";
        c.fillStyle = "white";
        c.fillText(player.nickname||"gt", player.x, player.y);
    }
    requestAnimationFrame(draw);
}

draw();