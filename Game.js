import { Player } from "./Player.js"
import { Cell } from "./Cell.js"
import { BrownTank } from "./EnemyTypes/BrownTank.js"
import { GreyTank } from "./EnemyTypes/GrayTank.js";
import { GreenTank } from "./EnemyTypes/GreenTank.js";

export class Game {
    constructor() {
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0xffffff
        });

        this.file = "./Maps/walls.txt"

        this.map = []; // All the bitmask of the entire map
        this.physicalMap = []; // All the physical walls
        this.tanks = [];
        this.allBullets = [];
        this.enableGridLines = true;
        this.rows = 30;
        this.cols = 40;
        this.cellWidth = 20;
        this.cellHeight = 20;
        this.mouseX = 0;
        this.mouseY = 0;
        this.player = new Player(700, 100, 15, 20, 2, this.app);
        this.brown = new BrownTank(700, 500, 15, 20);
        this.grey = new GreyTank(100, 500, 15, 20, 1.25);
        this.green = new GreenTank(100, 100, 15, 20, 1.75);
    }

    setup() {
        document.getElementById('gameContainer').appendChild(this.app.view);

        // Default map generation
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
            this.physicalMap.push(tempWalls);
        }

        if (this.file != null) {
            this.loadMapFromPath(this.file).then(loadedMap => {
                if (loadedMap) {
                    this.updateMap(loadedMap);
                }
            });
        }

        this.grey.setPathfinder(this.physicalMap);

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

        document.getElementById('fileInput').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                let loadedMap = this.loadMapFromFile(fileContent);
                this.updateMap(loadedMap);
            };

            reader.readAsText(file);
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
        let gridRows = this.physicalMap.length;
        let gridCols = this.physicalMap[0].length;

        // Reset grid values
        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                this.physicalMap[i][j].dangerValue = 0
                if (this.physicalMap.isWall) {
                    this.physicalMap[i][j].body.tint = 0xFFFFFF;
                }
            }
        }

        // Update danger values based on bullets and their predicted paths
        bullets.forEach(bullet => {
            for (let step = 0; step <= predictionSteps; step++) {
                let predictedBulletRow = Math.floor((bullet.body.y + bullet.velocityY * step) / 20);
                let predictedBulletCol = Math.floor((bullet.body.x + bullet.velocityX * step) / 20);

                if (predictedBulletRow >= 0 && predictedBulletRow < gridRows && predictedBulletCol >= 0 && predictedBulletCol < gridCols) {
                    this.physicalMap[predictedBulletRow][predictedBulletCol].dangerValue += bulletDangerFactor / (step + 1); // Reduce danger value with distance
                }
            }
        });

        // Update danger values based on player proximity
        let playerRow = Math.floor(player.body.y / 20);
        let playerCol = Math.floor(player.body.x / 20);

        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                if (!this.isWallBlocking(playerRow, playerCol, i, j)) {
                    let distance = Math.max(Math.abs(i - playerRow), Math.abs(j - playerCol));
                    let dangerValue = playerDangerFactor - 0.1 * distance;
                    if (dangerValue > 0) {
                        this.physicalMap[i][j].dangerValue += dangerValue;
                    }
                }
            }
        }
    }

    isWallBlocking(startRow, startCol, endRow, endCol) {
        let dx = Math.abs(endCol - startCol);
        let dy = Math.abs(endRow - startRow);
        let sx = (startCol < endCol) ? 1 : -1;
        let sy = (startRow < endRow) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Check if the current cell is a wall
            if (this.physicalMap[startRow][startCol].isWall) {
                return true; // Wall is blocking the line of sight
            }

            if (startRow === endRow && startCol === endCol) break; // Line has reached the end point

            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                startCol += sx;
            }
            if (e2 < dx) {
                err += dx;
                startRow += sy;
            }
        }

        return false; // No wall is blocking the line of sight
    }

    updateGridColors(maxDangerValue) {
        for (let i = 0; i < this.physicalMap.length; i++) {
            for (let j = 0; j < this.physicalMap[i].length; j++) {
                if (!this.physicalMap[i][j].isWall) {
                    let dangerValue = this.physicalMap[i][j].dangerValue
                    let color = this.getColorFromDangerValue(dangerValue, maxDangerValue);
                    this.physicalMap[i][j].body.tint = color;
                }
            }
        }
    }

    loadMapFromFile(fileContent) {
        let loadedMap = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
        return loadedMap;
    }

    async loadMapFromPath(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const fileContent = await response.text();
            let loadedMap = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
            return loadedMap;
        } catch (error) {
            console.error("Error loading file: ", error);
            return null;
        }
    }

    updateMap(inputMap) {
        for (let i = 0; i < inputMap.length; i++) {
            for (let j = 0; j < inputMap[i].length; j++) {
                let isWall = inputMap[i][j] === 1;
                if (this.physicalMap[i] && this.physicalMap[i][j]) {
                    this.physicalMap[i][j].setWall(isWall); // Assuming you have a method setWall to update the cell
                }
            }
        }
        this.grey.setPathfinder(this.physicalMap);
    }

    gameLoop(delta) {
        this.updateGridDangerValues(this.allBullets, this.player, 1.0, 1.0, 25);
        this.updateGridColors(0.5);
        this.player.update(delta, this.physicalMap, this.mouseX, this.mouseY);

        // Updating all tank bullets
        for (let t = 0; t < this.tanks.length; t++) {
            let tank = this.tanks[t];

            // Bullets shot by the player are handled differently
            if (tank != this.player) {
                let firedBullet = tank.update(delta, this.physicalMap, this.player, this.physicalMap)
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
                bullet.update(delta, this.physicalMap);

                if (bullet.toDestroy) {
                    this.app.stage.removeChild(bullet.body);
                    bullet.owner.firedBullets -= 1
                    this.allBullets.splice(i, 1)
                }
            }
        }
    }

    cleanup() {
        // TODO: Maybe implement removal of event listeners in the future, but it works as of now so maybe it's not needed
        this.app.ticker.stop();
        this.app.stage.removeChildren();
        document.getElementById('gameContainer').removeChild(this.app.view);
        this.app = null;
    }
}