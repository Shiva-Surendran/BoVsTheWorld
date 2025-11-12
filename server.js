const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (index.html, script.js, gyro_controller.html)
app.use(express.static(path.join(__dirname)));

console.log('✅ Express + WebSocket server starting...');

let gameConnection = null;
let phoneConnection = null;

wss.on('connection', function connection(ws, req) {
    console.log('A new client connected from ' + req.socket.remoteAddress);

    if (!gameConnection) {
        gameConnection = ws;
        console.log('🎮 Game client connected.');
    } else if (!phoneConnection) {
        phoneConnection = ws;
        console.log('📱 Phone controller connected.');
    } else {
        console.log('⚠️ Ignored extra connection.');
        ws.close();
        return;
    }

    ws.on('message', function incoming(message) {
        const data = message.toString();
        if (data === 'JUMP' && gameConnection && gameConnection.readyState === WebSocket.OPEN) {
            gameConnection.send('JUMP');
            console.log('⬆️ Jump command forwarded to game.');
        }
    });

    ws.on('close', () => {
        if (ws === gameConnection) {
            console.log('🎮 Game client disconnected.');
            gameConnection = null;
        } else if (ws === phoneConnection) {
            console.log('📱 Phone controller disconnected.');
            phoneConnection = null;
        }
    });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
