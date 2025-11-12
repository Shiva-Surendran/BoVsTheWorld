const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 250;
    if (bo.onGround) {
        bo.y = groundY - bo.height;
    }
}
window.addEventListener("resize", resizeCanvas);

// variables
let groundY;
let bo = { x: 500, y: 0, width: 55, height: 40, dy: 0, jumpPower: -20 , gravity: 1, onGround: true };
let triangles = [];
let score = 0;
let gameSpeed = 6;
let gameOver = false;
const minGap = 200; 
let groundOffset = 0; 



// --- REMOTE CONTROL SETUP ---
// 🚨 REPLACE THE IP BELOW with your laptop's actual IP address!
let socket;
const WEBSOCKET_ADDRESS = "wss://portfolio-5m5t.vercel.app";


function connectWebSocket() {
    socket = new WebSocket(WEBSOCKET_ADDRESS);

    socket.onopen = () => {
        console.log("Connected to remote controller server. (You are the Game)");
        // Add a visual indicator to the canvas here if you want
    };

    socket.onmessage = (event) => {
        if (event.data === 'JUMP') {
            jump();
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error: Cannot connect to server.");
    };

    socket.onclose = () => {
        console.log("Disconnected. Attempting to reconnect in 3s...");
        setTimeout(connectWebSocket, 3000);
    };
}
connectWebSocket(); // Start connecting when the game loads

// --- Input Handler (Keep this as a backup control) ---
document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") jump();
});


resizeCanvas();


function drawBo() {
    // robot Body
    ctx.fillStyle = "#FFC300"; 
    ctx.fillRect(bo.x, bo.y, bo.width, bo.height);
    
    // face
    ctx.strokeStyle = "#E74C3C"; 
    ctx.lineWidth = 3;    
    ctx.strokeRect(bo.x, bo.y, bo.width, bo.height);

    //  Eyes
    ctx.fillStyle = "white";
    ctx.fillRect(bo.x + 8, bo.y + 10, 10, 10);
    ctx.fillRect(bo.x + bo.width - 18, bo.y + 10, 10, 10);
    
    ctx.fillStyle = "black";
    ctx.fillRect(bo.x + 11, bo.y + 13, 4, 4);
    ctx.fillRect(bo.x + bo.width - 15, bo.y + 13, 4, 4);
}

function drawGround() {
    //grass
    ctx.fillStyle = "#2ECC71"; 
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // dark grass
    ctx.fillStyle = "#27AE60";
    const patternSize = 25;
    
    groundOffset = (groundOffset + gameSpeed * 0.5) % patternSize; 
    
    for (let i = 0; i < canvas.width / patternSize + 1; i++) {
        // Draw small moving rectangles for the grass texture
        ctx.fillRect(i * patternSize - groundOffset, groundY, 15, 5);
    }
}

function drawTriangles() {
    ctx.fillStyle = "#9B59B6"; // Purple
    ctx.strokeStyle = "#8E44AD"; // Darker purple 
    ctx.lineWidth = 3;
    
    triangles.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.x + 10, t.y + 40);
        ctx.lineTo(t.x - 10, t.y + 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke(); 
    });
}


function spawnTriangle() {
    if (triangles.length > 0) {
        const lastObstacleX = triangles[triangles.length - 1].x;
        if (canvas.width - lastObstacleX < minGap) {
            return; 
        }
    }

    if (Math.random() < 0.02) { 
        const fly = Math.random() < 0.2; 
        let y;
        
        if (fly) {
            y = groundY - 150; 
        } else {
            y = groundY - 40; 
        } 
        
        triangles.push({ x: canvas.width, y });
    }
}

function updateTriangles() {
    triangles = triangles.filter(t => t.x + 20 > 0);
    triangles.forEach(t => t.x -= gameSpeed);
}

function jump() {
    if (bo.onGround) {
        bo.dy = bo.jumpPower;
        bo.onGround = false;
    }
}
document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") jump();
});

function updateBo() {
    bo.y += bo.dy;
    bo.dy += bo.gravity;
    
    if (bo.y + bo.height >= groundY) {
        bo.y = groundY - bo.height;
        bo.dy = 0;
        bo.onGround = true;
    }
}

function detectCollision() {
    for (let t of triangles) {
        if (
            bo.x < t.x + 10 &&
            bo.x + bo.width > t.x - 10 &&
            bo.y < t.y + 40 &&
            bo.y + bo.height > t.y
        ) {
            gameOver = true;
            break;
        }
    }
}

// --- Main Loop ---

function gameLoop() {
    
    // --- Game Over State ---
    if (gameOver) {

        drawGround();         
        ctx.font = "60px Impact, sans-serif";
        ctx.textAlign = "center"; 
        ctx.fillStyle = "#E74C3C"; 
        ctx.fillText("CRASH!", canvas.width / 2, canvas.height / 2 -50);
        
        ctx.font = "30px Arial";
        ctx.fillStyle = "#2C3E50"; // Dark text
        ctx.fillText("You Scored: " + Math.floor(score / 10), canvas.width / 2, canvas.height / 2-10);
        
        ctx.font = "30px Arial";
        ctx.fillText("Try again!", canvas.width / 2, canvas.height / 2 + 30);

        return;
    }

    // --- Active Game State ---
    
    // 
    ctx.fillStyle = "#87CEEB"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Elements
    drawGround();
    drawBo();
    drawTriangles();
    
    // update Logic
    updateTriangles();
    updateBo();
    detectCollision();
    spawnTriangle(); 

    // Score
    score += 1;
    ctx.font = "35px Impact, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#2C3E50";
    ctx.fillText("SCORE: " + Math.floor(score / 10), 20, 50);

    requestAnimationFrame(gameLoop);
}

gameLoop();
