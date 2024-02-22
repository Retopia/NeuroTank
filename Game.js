import { Player } from "./Player.js"
import { Cell } from "./Cell.js"
import { BrownTank } from "./EnemyTypes/BrownTank.js"
import { GreyTank } from "./EnemyTypes/GrayTank.js";
import { GreenTank } from "./EnemyTypes/GreenTank.js";

let map = []; // All the physical cells of the map
let mapWalls = []; // All the physical walls

let tanks = [];
let allBullets = [];

let enableGridLines = true;

const rows = 30;
const cols = 40;
const cellWidth = 20;
const cellHeight = 20;
let mouseX = 0;
let mouseY = 0;

let mapDangerValues = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

const player = new Player(700, 100, 15, 20, 2);
const brown = new BrownTank(700, 500, 15, 20);
const grey = new GreyTank(100, 500, 15, 20, 1.5);
const green = new GreenTank(100, 100, 15, 20, 1.5);

// PixiJS setup
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff
});

function setup() {
    document.getElementById('gameContainer').appendChild(app.view);

    for (let i = 0; i < rows; i++) {
        let tempInts = [];
        let tempWalls = [];
        for (let j = 0; j < cols; j++) {
            let isWall = false;
            if (i == 0 || i == rows - 1 || j == 0 || j == cols - 1) {
                tempInts.push(1);
                isWall = true;
            } else {
                tempInts.push(0)
            }
            let wall = new Cell(j * 20, i * 20, 20, 20, -1, isWall);
            tempWalls.push(wall);
            app.stage.addChild(wall.body)
        }
        map.push(tempInts);
        mapWalls.push(tempWalls);
    }

    if (enableGridLines) {
        // Represents literally every single gridline
        let gridLines = new PIXI.Graphics();
        gridLines.lineStyle(1, 0xcccccc, 1);

        // horizontal lines
        for (let i = 0; i <= rows; i++) {
            gridLines.moveTo(0, i * cellHeight);
            gridLines.lineTo(cols * cellWidth, i * cellHeight);
        }

        // vertical lines
        for (let j = 0; j <= cols; j++) {
            gridLines.moveTo(j * cellWidth, 0);
            gridLines.lineTo(j * cellWidth, rows * cellHeight);
        }

        app.stage.addChild(gridLines);
    }

    // app.stage.addChild(player.body, brown.body, grey.body, green.body)
    app.stage.addChild(player.body, grey.body)
    // tanks.push(player, brown, grey, green);
    tanks.push(player, grey);
}

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
            allBullets.push(bullet);
        }
    }
});

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

function getColorFromDangerValue(dangerValue, maxDangerValue) {
    // Ensure danger value is in range [0, maxDangerValue]
    dangerValue = Math.min(Math.max(dangerValue, 0), maxDangerValue);

    // Calculate the ratio of the danger value to the maximum danger value
    let ratio = dangerValue / maxDangerValue;

    // Interpolate between white (255, 255, 255) and red (255, 0, 0)
    let red = 255;
    let green = 255 * (1 - ratio);
    let blue = 255 * (1 - ratio);

    // Convert to hexadecimal color
    let color = rgbToHex(Math.round(red), Math.round(green), Math.round(blue));
    return color;
}

function rgbToHex(r, g, b) {
    return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function updateGridDangerValues(bullets, player, bulletDangerFactor, playerDangerFactor, predictionSteps) {
    const gridRows = mapDangerValues.length;
    const gridCols = mapDangerValues[0].length;

    // Reset grid values
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            mapDangerValues[i][j] = 0;
            if (mapWalls.isWall) {
                mapWalls[i][j].body.tint = 0xFFFFFF;
            }
        }
    }

    // Update danger values based on bullets and their predicted paths
    bullets.forEach(bullet => {
        for (let step = 0; step <= predictionSteps; step++) {
            let predictedBulletRow = Math.floor((bullet.body.y + bullet.velocityY * step) / 20);
            let predictedBulletCol = Math.floor((bullet.body.x + bullet.velocityX * step) / 20);

            if (predictedBulletRow >= 0 && predictedBulletRow < gridRows && predictedBulletCol >= 0 && predictedBulletCol < gridCols) {
                mapDangerValues[predictedBulletRow][predictedBulletCol] += bulletDangerFactor / (step + 1); // Reduce danger value with distance
            }
        }
    });

    // Update danger values based on player proximity
    let playerRow = Math.floor(player.body.y / 20);
    let playerCol = Math.floor(player.body.x / 20);

    for (let i = Math.round(Math.max(0, playerRow - playerDangerFactor)); i <= Math.round(Math.min(gridRows - 1, playerRow + playerDangerFactor)); i++) {
        for (let j = Math.round(Math.max(0, playerCol - playerDangerFactor)); j <= Math.round(Math.min(gridCols - 1, playerCol + playerDangerFactor)); j++) {
            mapDangerValues[i][j] += playerDangerFactor - Math.max(Math.abs(i - playerRow), Math.abs(j - playerCol));
        }
    }
}

function updateGridColors(maxDangerValue) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (!mapWalls[i][j].isWall) {
                let dangerValue = mapDangerValues[i][j];
                let color = getColorFromDangerValue(dangerValue, maxDangerValue);
                mapWalls[i][j].body.tint = color;
            }
        }
    }
}

function loadMapFromFile(fileContent) {
    let map = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
    return map;
}

function updateMapWalls(map, mapWalls) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            let isWall = map[i][j] === 1;
            if (mapWalls[i] && mapWalls[i][j]) {
                mapWalls[i][j].setWall(isWall); // Assuming you have a method setWall to update the cell
            }
        }
    }
}

setup()

app.ticker.add((delta) => gameLoop(delta));

function gameLoop(delta) {
    updateGridDangerValues(allBullets, player, 0.3, 1.2, 10);
    updateGridColors(0.5)

    player.update(delta, mapWalls);

    // Updating all tank bullets
    for (let t = 0; t < tanks.length; t++) {
        const tank = tanks[t];

        // Bullets shot by the player are handled differently
        if (tank != player) {
            let firedBullet = tank.update(delta, map, player, mapWalls)
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