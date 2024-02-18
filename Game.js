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
let allBullets = [];

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
            this.allBullets.push(bullet);
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

function rectanglesCollide(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y) {

        return true;
    }
    return false;
}

function checkCollision(bullet) {
    for (let t = 0; t < tanks.length; t++) {
        const tank = tanks[t];
        if (rectanglesCollide(bullet.body, tank.body)) {
            return { tank: tank, tankIndex: t };
        }
    }
    return null;
}

app.ticker.add((delta) => gameLoop(delta));

function gameLoop(delta) {
    player.update(delta, mapWalls);

    // Updating all tank bullets
    for (let t = 0; t < tanks.length; t++) {
        const tank = tanks[t];

        // Bullets shot by the player are handled differently
        if (tank != player) {
            let firedBullet = tank.update(delta, mapWalls, player)
            if (firedBullet) {
                app.stage.addChild(firedBullet.body);
                allBullets.push(firedBullet)
            }
        }
    }

    for (let i = allBullets.length - 1; i >= 0; i--) {
        const bullet = allBullets[i];
        let collided = checkCollision(bullet);
        if (collided) {
            app.stage.removeChild(collided.tank.body);
            tanks.splice(collided.tankIndex, 1);

            app.stage.removeChild(bullet.body);
            bullet.owner.firedBullet -= 1
            allBullets.splice(i, 1)
        } else {
            bullet.update(delta, mapWalls);

            if (bullet.toDestroy) {
                app.stage.removeChild(bullet.body);
                bullet.owner.firedBullets -= 1
                allBullets.splice(i, 1)
            }
        }
    }
}