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
let tanks = [];

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

const player = new Player(700, 100, 15, 20, 2);
const brown = new BrownTank(700, 500, 15, 20);
const grey = new GreyTank(100, 500, 15, 20, 1.5);
const green = new GreenTank(100, 100, 15, 20, 1.5);

app.stage.addChild(player.body, brown.body, grey.body, green.body)
tanks.push(player, brown, grey, green);

// loadUI();

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
        const bullet = player.fireBullet();
        if (bullet) {
            app.stage.addChild(bullet.body);
        }
    }
});

app.renderer.plugins.interaction.on('pointerup', function (e) {
    // Deprecated for now
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

    // Updating all tank bullets
    for (let t = 0; t < tanks.length; t++) {
        const tank = tanks[t];

        // Bullets shot by the player are handled differently
        if (tank != player) {
            let tankReturnValue = tank.update(delta, mapWalls, player)
            if (tankReturnValue) {
                app.stage.addChild(tankReturnValue.body);
            }
        }

        for (let i = tank.bullets.length - 1; i >= 0; i--) {
            const bullet = tank.bullets[i];
            bullet.update(delta, mapWalls);

            if (bullet.toDestroy) {
                app.stage.removeChild(bullet.body);
                tank.bullets.splice(i, 1);
            }
        }
    }
}