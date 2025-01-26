const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const port = 3000;

// Serve static files for the client
app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

// Store players
let players = {};

wss.on('connection', (ws) => {
  console.log('A player connected');

  // Assign a random player ID and notify the client
  const playerId = `player-${Math.floor(Math.random() * 1000)}`;
  players[playerId] = { x: 0, y: 0, tag: false };
  ws.send(JSON.stringify({ type: 'init', id: playerId }));

  // Broadcast updated player list
  const broadcastPlayers = () => {
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ type: 'update', players }));
      }
    });
  };

  broadcastPlayers();

  // Handle messages from clients
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'move') {
      players[data.id] = { ...players[data.id], x: data.x, y: data.y };
      broadcastPlayers();
    } else if (data.type === 'tag') {
      const taggedPlayer = Object.keys(players).find((id) => id === data.taggedId);
      if (taggedPlayer) {
        players[taggedPlayer].tag = true;
        players[data.id].tag = false; // The tagger is no longer "it"
        broadcastPlayers();
      }
    }
  });

  // Remove player on disconnect
  ws.on('close', () => {
    delete players[playerId];
    broadcastPlayers();
  });
});
