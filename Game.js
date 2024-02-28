import { Player } from "./Player.js"
import { Cell } from "./Cell.js"
import { BrownTank } from "./EnemyTypes/BrownTank.js"
import { GreyTank } from "./EnemyTypes/GrayTank.js";
import { GreenTank } from "./EnemyTypes/GreenTank.js";

export class Game {
    constructor() {
        this.map = []; // All the physical cells of the map
        this.mapWalls = []; // All the physical walls
        this.tanks = [];
        this.allBullets = [];
        this.enableGridLines = true;
        this.rows = 30;
        this.cols = 40;
        this.cellWidth = 20;
        this.cellHeight = 20;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mapDangerValues = new Array(this.rows).fill(null).map(() => new Array(this.cols).fill(0));
        this.player = new Player(700, 100, 15, 20, 2);
        this.brown = new BrownTank(700, 500, 15, 20);
        this.grey = new GreyTank(100, 500, 15, 20, 1.5);
        this.green = new GreenTank(100, 100, 15, 20, 1.5);
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0xffffff
        });
    }

    setup() {
        document.getElementById('gameContainer').appendChild(this.app.view);

        for (let i = 0; i < this.rows; i++) {
            let tempInts = [];
            let tempWalls = [];
            for (let j = 0; j < this.cols; j++) {
                let isWall = false;
                if (i == 0 || i == this.rows - 1 || j == 0 || j == this.cols - 1) {
                    tempInts.push(1);
                    isWall = true;
                } else {
                    tempInts.push(0);
                }
                let wall = new Cell(j * this.cellWidth, i * this.cellHeight, this.cellWidth, this.cellHeight, -1, isWall);
                tempWalls.push(wall);
                this.app.stage.addChild(wall.body);
            }
            this.map.push(tempInts);
            this.mapWalls.push(tempWalls);
        }

        if (this.enableGridLines) {
            let gridLines = new PIXI.Graphics();
            gridLines.lineStyle(1, 0xcccccc, 1);
            for (let i = 0; i <= this.rows; i++) {
                gridLines.moveTo(0, i * this.cellHeight);
                gridLines.lineTo(this.cols * this.cellWidth, i * this.cellHeight);
            }
            for (let j = 0; j <= this.cols; j++) {
                gridLines.moveTo(j * this.cellWidth, 0);
                gridLines.lineTo(j * this.cellWidth, this.rows * this.cellHeight);
            }
            this.app.stage.addChild(gridLines);
        }

        this.app.stage.addChild(this.player.body, this.grey.body);
        this.tanks.push(this.player, this.grey);

        this.app.ticker.add((delta) => this.gameLoop(delta));

        this.app.renderer.plugins.interaction.on('pointermove', (e) => {
            const newPosition = e.data.global;
            this.mouseX = newPosition.x;
            this.mouseY = newPosition.y;
            this.player.rotateTurret(this.mouseX, this.mouseY);
        });

        this.app.renderer.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.app.renderer.plugins.interaction.on('pointerdown', (e) => {
            if (e.data.button === 0) {
                const bullet = this.player.fireBullet();
                if (bullet) {
                    this.app.stage.addChild(bullet.body);
                    this.allBullets.push(bullet);
                }
            }
        });
    }

    rectanglesCollide(rect1, rect2) {
        if (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y) {

            return true;
        }
        return false;
    }

    checkCollision(bullet) {
        for (let t = 0; t < this.tanks.length; t++) {
            this.tank = this.tanks[t];
            if (this.rectanglesCollide(bullet.body, this.tank.body)) {
                return { tank: this.tank, tankIndex: t };
            }
        }
        return null;
    }

    getColorFromDangerValue(dangerValue, maxDangerValue) {
        // Clamp this value to [0, maxDangerValue]
        dangerValue = Math.min(Math.max(dangerValue, 0), maxDangerValue);

        // Calculate the ratio of the danger value to the maximum danger value
        let ratio = dangerValue / maxDangerValue;

        // Interpolate between white (255, 255, 255) and red (255, 0, 0)
        let red = 255;
        let green = 255 * (1 - ratio);
        let blue = 255 * (1 - ratio);

        // Convert to hexadecimal color
        let color = this.rgbToHex(Math.round(red), Math.round(green), Math.round(blue));
        return color;
    }

    rgbToHex(r, g, b) {
        return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    updateGridDangerValues(bullets, player, bulletDangerFactor, playerDangerFactor, predictionSteps) {
        let gridRows = this.mapDangerValues.length;
        let gridCols = this.mapDangerValues[0].length;

        // Reset grid values
        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                this.mapDangerValues[i][j] = 0;
                if (this.mapWalls.isWall) {
                    this.mapWalls[i][j].body.tint = 0xFFFFFF;
                }
            }
        }

        // Update danger values based on bullets and their predicted paths
        bullets.forEach(bullet => {
            for (let step = 0; step <= predictionSteps; step++) {
                let predictedBulletRow = Math.floor((bullet.body.y + bullet.velocityY * step) / 20);
                let predictedBulletCol = Math.floor((bullet.body.x + bullet.velocityX * step) / 20);

                if (predictedBulletRow >= 0 && predictedBulletRow < gridRows && predictedBulletCol >= 0 && predictedBulletCol < gridCols) {
                    this.mapDangerValues[predictedBulletRow][predictedBulletCol] += bulletDangerFactor / (step + 1); // Reduce danger value with distance
                }
            }
        });

        // Update danger values based on player proximity
        let playerRow = Math.floor(player.body.y / 20);
        let playerCol = Math.floor(player.body.x / 20);

        for (let i = Math.round(Math.max(0, playerRow - playerDangerFactor)); i <= Math.round(Math.min(gridRows - 1, playerRow + playerDangerFactor)); i++) {
            for (let j = Math.round(Math.max(0, playerCol - playerDangerFactor)); j <= Math.round(Math.min(gridCols - 1, playerCol + playerDangerFactor)); j++) {
                this.mapDangerValues[i][j] += playerDangerFactor - Math.max(Math.abs(i - playerRow), Math.abs(j - playerCol));
            }
        }
    }

    updateGridColors(maxDangerValue) {
        for (let i = 0; i < this.map.length; i++) {
            for (let j = 0; j < this.map[i].length; j++) {
                if (!this.mapWalls[i][j].isWall) {
                    let dangerValue = this.mapDangerValues[i][j];
                    let color = this.getColorFromDangerValue(dangerValue, maxDangerValue);
                    this.mapWalls[i][j].body.tint = color;
                }
            }
        }
    }

    loadMapFromFile(fileContent) {
        this.map = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
        return map;
    }

    updateMapWalls(map, mapWalls) {
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                let isWall = map[i][j] === 1;
                if (mapWalls[i] && mapWalls[i][j]) {
                    mapWalls[i][j].setWall(isWall); // Assuming you have a method setWall to update the cell
                }
            }
        }
    }

    gameLoop(delta) {
        this.updateGridDangerValues(this.allBullets, this.player, 0.3, 1.2, 10);
        this.updateGridColors(0.5);

        this.player.update(delta, this.mapWalls);

        // Updating all tank bullets
        for (let t = 0; t < this.tanks.length; t++) {
            let tank = this.tanks[t];

            // Bullets shot by the player are handled differently
            if (tank != this.player) {
                let firedBullet = tank.update(delta, this.map, this.player, this.mapWalls)
                if (firedBullet) {
                    this.app.stage.addChild(firedBullet.body);
                    this.allBullets.push(firedBullet)
                }
            }
        }

        for (let i = this.allBullets.length - 1; i >= 0; i--) {
            let bullet = this.allBullets[i];
            let collided = this.checkCollision(bullet);
            if (collided) {
                this.app.stage.removeChild(collided.tank.body);
                this.tanks.splice(collided.tankIndex, 1);

                this.app.stage.removeChild(bullet.body);
                bullet.owner.firedBullet -= 1
                this.allBullets.splice(i, 1)
            } else {
                bullet.update(delta, this.mapWalls);

                if (bullet.toDestroy) {
                    this.app.stage.removeChild(bullet.body);
                    bullet.owner.firedBullets -= 1
                    this.allBullets.splice(i, 1)
                }
            }
        }
    }

    cleanup() {
        this.app.ticker.stop();
        this.app.stage.removeChildren();
        document.getElementById('gameContainer').removeChild(this.app.view);
        this.app = null;
    }
}