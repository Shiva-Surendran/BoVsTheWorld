const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// WebSocket handling
let gameConnection = null;
let phoneConnection = null;

wss.on('connection', (ws, req) => {
  console.log('Client connected from ' + req.socket.remoteAddress);

  if (!gameConnection) {
    gameConnection = ws;
    console.log('Game client connected.');
  } else if (!phoneConnection) {
    phoneConnection = ws;
    console.log('Phone controller connected.');
  } else {
    console.log('Extra connection ignored.');
    ws.close();
    return;
  }

  ws.on('message', (message) => {
    if (message.toString() === 'JUMP' && gameConnection && gameConnection.readyState === WebSocket.OPEN) {
      gameConnection.send('JUMP');
      console.log('Jump command sent to game.');
    }
  });

  ws.on('close', () => {
    if (ws === gameConnection) gameConnection = null;
    if (ws === phoneConnection) phoneConnection = null;
  });
});

// Dynamic port for Vercel or local testing
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
