import { Player } from "./Player.js"
import { Enemy } from "./Enemy.js"

// PixiJS setup
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff
});
document.getElementById('gameContainer').appendChild(app.view);

let mouseX = 0;
let mouseY = 0;
let rightMouseDown = false;

let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;

let fpsText = null;
let circleText = null;

const player = new Player(300, 300, 20, 25, 2.5); // Example position and size
app.stage.addChild(player.body);

const enemy = new Enemy(500, 500, 20, 25, 2.5);
app.stage.addChild(enemy.body)

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
    app.stage.addChild(fpsText);

    circleText = new PIXI.Text("Count: ",  style);
    circleText.x = 200;
    circleText.y = 10;
    app.stage.addChild(circleText);
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
    fpsText.text = "FPS: " + calculateFPS()
    circleText.text = "Count: " 
    player.update(delta)
}