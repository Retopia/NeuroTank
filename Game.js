import { Player } from "./Player.js"
import { Wall } from "./Wall.js"
import { BrownTank } from "./EnemyTypes/BrownTank.js"
import { GreyTank } from "./EnemyTypes/GrayTank.js";
import { GreenTank } from "./EnemyTypes/GreenTank.js";

// PixiJS setup
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff
});
document.getElementById('gameContainer').appendChild(app.view);

let mapInts = [];
let mapWalls = [];
const rows = 30;
const cols = 40;
for (let i = 0; i < rows; i++) {
    let tempInts = [];
    let tempWalls = [];
    for (let j = 0; j < cols; j++) {
        if (i == 0 || i == rows - 1 || j == 0 || j == cols - 1) {
            tempInts.push(1);
            let wall = new Wall(j * 20, i * 20, 20, 20, -1);
            tempWalls.push(wall);
            app.stage.addChild(wall.body)
        } else {
            tempInts.push(0)
        }
    }
    mapInts.push(tempInts);
    mapWalls.push(tempWalls);
}

let mouseX = 0;
let mouseY = 0;

let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;

let fpsText = null;
let circleText = null;

const player = new Player(700, 100, 15, 20, 2.75);
app.stage.addChild(player.body);

const enemy1 = new BrownTank(700, 500, 15, 20);
app.stage.addChild(enemy1.body)

const enemy2 = new GreyTank(100, 500, 15, 20, 1.75);
app.stage.addChild(enemy2.body)

const enemy3 = new GreenTank(100, 100, 15, 20, 1.75);
app.stage.addChild(enemy3.body)

loadUI();

app.renderer.plugins.interaction.on('pointermove', function (e) {
    const newPosition = e.data.global;
    mouseX = newPosition.x;
    mouseY = newPosition.y;
    player.rotateTurret(mouseX, mouseY);
});

app.renderer.view.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

app.renderer.plugins.interaction.on('pointerdown', function (e) {
    if (e.data.button === 0) {
        const angle = player.body.rotation;
        const velocityX = Math.cos(angle) * 5;
        const velocityY = Math.sin(angle) * 5;
        const bulletX = player.body.x + Math.cos(angle) * 30; // Adjust spawn position
        const bulletY = player.body.y + Math.sin(angle) * 30;
        const bullet = player.fireBullet(bulletX, bulletY, velocityX, velocityY);
        app.stage.addChild(bullet.body);
    }

    if (e.data.button === 2) {
        rightMouseDown = true;
    }
});

app.renderer.plugins.interaction.on('pointerup', function (e) {
    if (e.data.button === 2) {
        rightMouseDown = false;
    }
});

function loadUI() {
    const style = new PIXI.TextStyle({
        fill: '#000000',
        fontSize: 20
    });

    fpsText = new PIXI.Text("FPS: " + calculateFPS(), style);
    fpsText.x = 10;
    fpsText.y = 10;
    // app.stage.addChild(fpsText);

    circleText = new PIXI.Text("Count: ", style);
    circleText.x = 200;
    circleText.y = 10;
    // app.stage.addChild(circleText);
}

function calculateFPS() {
    const now = Date.now();
    frameCount++;
    if (now - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
    }
    return fps
}

app.ticker.add((delta) => gameLoop(delta));

function gameLoop(delta) {
    player.update(delta, mapWalls);

    // Update bullets
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.update(delta, mapWalls);

        if (bullet.toDestroy) {
            app.stage.removeChild(bullet.body);
            player.bullets.splice(i, 1);
        }
    }
}