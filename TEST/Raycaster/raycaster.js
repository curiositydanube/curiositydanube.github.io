// raycaster.js - 2.5d

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const FOV = Math.PI / 3; 
const MOVE_SPEED = 0.06;
const ROTATION_SPEED = 0.04;

let world = null;
let player = { x: 0, y: 0, angle: 0 };
let keys = { w: false, a: false, s: false, d: false };

const wallColors = {
    1: { light: "#95a5a6", dark: "#7f8c8d" },
    2: { light: "#e74c3c", dark: "#c0392b" }, 
    3: { light: "#2ecc71", dark: "#27ae60" }  
};

async function initGame() {
    try {
        const response = await fetch('./map.json');
        world = await response.json();
        player.x = world.playerStart.x;
        player.y = world.playerStart.y;
        player.angle = world.playerStart.angle;
        setupInput();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("Failed to load map JSON:", error);
    }
}

function setupInput() {
    window.addEventListener("keydown", (e) => {
        let key = e.key.toLowerCase();
        if (key in keys) keys[key] = true;
    });
    window.addEventListener("keyup", (e) => {
        let key = e.key.toLowerCase();
        if (key in keys) keys[key] = false;
    });

    const mobileButtons = {
        "btn-w": "w",
        "btn-a": "a",
        "btn-s": "s",
        "btn-d": "d"
    };

    Object.keys(mobileButtons).forEach(btnId => {
        const element = document.getElementById(btnId);
        if (!element) return;
        element.addEventListener("touchstart", (e) => {
            e.preventDefault(); // Prevents simulated mouse clicks and scrolling
            const gameKey = mobileButtons[btnId];
            keys[gameKey] = true;
        }, { passive: false });

        element.addEventListener("touchend", (e) => {
            e.preventDefault();
            const gameKey = mobileButtons[btnId];
            keys[gameKey] = false;
        }, { passive: false });
        
        element.addEventListener("touchcancel", (e) => {
            const gameKey = mobileButtons[btnId];
            keys[gameKey] = false;
        });
    });
}

function updatePlayer() {
    let moveX = 0;
    let moveY = 0;

    if (keys.w) {
        moveX += Math.cos(player.angle) * MOVE_SPEED;
        moveY += Math.sin(player.angle) * MOVE_SPEED;
    }
    if (keys.s) {
        moveX -= Math.cos(player.angle) * MOVE_SPEED;
        moveY -= Math.sin(player.angle) * MOVE_SPEED;
    }
    if (keys.a) player.angle -= ROTATION_SPEED;
    if (keys.d) player.angle += ROTATION_SPEED;

    let newX = player.x + moveX;
    let newY = player.y + moveY;

    if (world.grid[Math.floor(player.y)][Math.floor(newX)] === 0) player.x = newX;
    if (world.grid[Math.floor(newY)][Math.floor(player.x)] === 0) player.y = newY;
}

function render() {
    // Draw Ceiling and Floor
    ctx.fillStyle = "#22252a"; ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#1b1c1e"; ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    for (let x = 0; x < canvas.width; x++) {
        let rayAngle = (player.angle - FOV / 2) + (x / canvas.width) * FOV;
        
        let rayDirX = Math.cos(rayAngle);
        let rayDirY = Math.sin(rayAngle);
        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);
        let sideDistX, sideDistY;
        let stepX, stepY;
       
       if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        let hit = 0;
        let side;
        let wallType = 0;

        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            if (mapX < 0 || mapX >= world.mapWidth || mapY < 0 || mapY >= world.mapHeight) break;
            if (world.grid[mapY][mapX] > 0) {
                hit = 1;
                wallType = world.grid[mapY][mapX];
            }
        }
        let perpWallDist;
        if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        else           perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
        if(perpWallDist <= 0) perpWallDist = 0.01;
        let lineHeight = Math.floor(canvas.height / perpWallDist);
        let drawStart = -lineHeight / 2 + canvas.height / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + canvas.height / 2;
        if (drawEnd >= canvas.height) drawEnd = canvas.height - 1;
        let colorProfile = wallColors[wallType] || wallColors[1];
        ctx.fillStyle = (side === 1) ? colorProfile.dark : colorProfile.light;
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }
}

function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// Start everything up
initGame();
