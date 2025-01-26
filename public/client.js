const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = new WebSocket(`ws://${location.host}`);

let playerId;
let players = {};

// Handle messages from the server
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'init') {
    playerId = data.id;
  } else if (data.type === 'update') {
    players = data.players;
  }
};

// Handle player movement
window.addEventListener('keydown', (e) => {
  if (!playerId) return;

  const speed = 5;
  const player = players[playerId] || { x: 0, y: 0 };

  if (e.key === 'ArrowUp') player.y -= speed;
  if (e.key === 'ArrowDown') player.y += speed;
  if (e.key === 'ArrowLeft') player.x -= speed;
  if (e.key === 'ArrowRight') player.x += speed;

  socket.send(JSON.stringify({ type: 'move', id: playerId, x: player.x, y: player.y }));
});

// Handle tag logic
canvas.addEventListener('click', (e) => {
  if (!playerId) return;

  const clickedX = e.clientX;
  const clickedY = e.clientY;

  Object.keys(players).forEach((id) => {
    if (id !== playerId) {
      const player = players[id];
      if (
        Math.abs(player.x - clickedX) < 30 &&
        Math.abs(player.y - clickedY) < 30 &&
        players[playerId].tag
      ) {
        socket.send(JSON.stringify({ type: 'tag', id: playerId, taggedId: id }));
      }
    }
  });
});

// Game rendering
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Object.keys(players).forEach((id) => {
    const player = players[id];
    ctx.fillStyle = player.tag ? 'red' : 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText(id, player.x - 10, player.y - 30);
  });

  requestAnimationFrame(render);
}

render();
