import { Cell } from "./Cell.js"

export class MapBuilder {

    constructor() {
        this.map = [];
        this.rows = 30;
        this.cols = 40;
        this.cellWidth = 20;
        this.cellHeight = 20;

        this.mouseX = 0;
        this.mouseY = 0;
        this.heldDownLeft = false;
        this.isWall = false;
        this.gridLines = new PIXI.Graphics();
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0xffffff
        });

        this.mode = "wall"
        this.lineStart = null;
        this.playerSpawnMarked = false;

        // array of x, y, x, y, line
        this.collisionLines = [];
    }

    setup() {
        // Creating the map
        for (let i = 0; i < this.rows; i++) {
            let tempWalls = [];
            for (let j = 0; j < this.cols; j++) {
                let isWall = false;
                if (i == 0 || i == this.rows - 1 || j == 0 || j == this.cols - 1) {
                    isWall = true;
                }
                let wall = new Cell(j * 20, i * 20, this.cellWidth, this.cellHeight, -1, isWall);
                tempWalls.push(wall);
                this.app.stage.addChild(wall.body)
            }
            this.map.push(tempWalls);
        }

        document.getElementById('gameContainer').appendChild(this.app.view);

        // Represents literally every single gridline
        this.gridLines.lineStyle(1, 0xcccccc, 1);

        // horizontal lines
        for (let i = 0; i <= this.rows; i++) {
            this.gridLines.moveTo(0, i * this.cellHeight);
            this.gridLines.lineTo(this.cols * this.cellWidth, i * this.cellHeight);
        }

        // vertical lines
        for (let j = 0; j <= this.cols; j++) {
            this.gridLines.moveTo(j * this.cellWidth, 0);
            this.gridLines.lineTo(j * this.cellWidth, this.rows * this.cellHeight);
        }

        this.app.stage.addChild(this.gridLines);

        document.getElementById('fileInput').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                // Now you have the file content, and you can process it
                let loadedMap = this.loadMapFromFile(fileContent);
                this.updateMap(loadedMap);
            };

            reader.readAsText(file); // Read the file as text
        });

        document.getElementById('itemSelect').addEventListener('change', (event) => {
            let selectedValue = event.target.value;
            this.mode = selectedValue;
        });

        document.getElementById('copyMapButton').addEventListener('click', (event) => {
            let mapString = '';

            // empty = 0
            // wall = 1
            // player = 2
            // brown = 3
            // grey = 4
            // green = 5
            // pink = 6
            for (let i = 0; i < this.map.length; i++) {
                for (let j = 0; j < this.map[i].length; j++) {
                    let currentCell = this.map[i][j];
                    if (currentCell.getSpawn() === 'player') {
                        mapString += '2 ';
                    } else if (currentCell.getSpawn() === 'brown') {
                        mapString += '3 ';
                    } else if (currentCell.getSpawn() === 'grey') {
                        mapString += '4 ';
                    } else if (currentCell.getSpawn() === 'green') {
                        mapString += '5 ';
                    } else if (currentCell.getSpawn() === 'pink') {
                        mapString += '6 ';
                    } else if (currentCell.isWall) {
                        mapString += '1 ';
                    } else {
                        mapString += '0 ';
                    }
                }
                mapString = mapString.trimEnd() + '\n';
            }

            mapString += '\n'
            for (let i = 0; i < this.collisionLines.length; i++) {
                const line = this.collisionLines[i];
                mapString += line[0] + ' ' + line[1] + ' ' + line[2] + ' ' + line[3] + '\n'
            }

            navigator.clipboard.writeText(mapString).then(function () {
                console.log('Async: Copying to clipboard was successful!');
            }, function (err) {
                console.error('Async: Could not copy text: ', err);
            });

            return mapString; // Return the string representation of the map
        });

        this.app.renderer.plugins.interaction.on('pointermove', (event) => {
            const newPosition = event.data.global;
            this.mouseX = newPosition.x;
            this.mouseY = newPosition.y;

            if (this.mode === "wall") {
                if (this.heldDownLeft) {
                    let xPos = Math.floor(this.mouseX / this.cellWidth);
                    let yPos = Math.floor(this.mouseY / this.cellHeight);

                    // Bounds checking
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let wall = this.map[yPos][xPos];
                        wall.setWall(this.isWall);
                    }
                }
            }

            if (this.mode === 'line') {
                if (this.heldDownRight) {
                    if (this.mode === 'line') {
                        let xPos = Math.floor(this.mouseX / this.cellWidth) * this.cellWidth + this.cellWidth / 2;
                        let yPos = Math.floor(this.mouseY / this.cellHeight) * this.cellHeight + this.cellHeight / 2;
                        let clickPoint = { x: xPos, y: yPos };
                        let threshold = 10; // Distance threshold to consider click on the line

                        for (let i = 0; i < this.collisionLines.length; i++) {
                            let line = this.collisionLines[i];
                            let lineStart = { x: line[0], y: line[1] };
                            let lineEnd = { x: line[2], y: line[3] };

                            if (this.pointToLineDistance(clickPoint, lineStart, lineEnd) <= threshold) {
                                this.app.stage.removeChild(line[4])
                                this.collisionLines.splice(i, 1); // Remove the line
                                break;
                            }
                        }
                    }
                }
            }
        });

        this.app.renderer.view.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        this.app.renderer.plugins.interaction.on('pointerdown', (event) => {

            if (event.data.button === 2) {
                this.heldDownRight = true;
                if (this.mode === 'line') {
                    let xPos = Math.floor(this.mouseX / this.cellWidth) * this.cellWidth + this.cellWidth / 2;
                    let yPos = Math.floor(this.mouseY / this.cellHeight) * this.cellHeight + this.cellHeight / 2;
                    let clickPoint = { x: xPos, y: yPos };
                    let threshold = 10; // Distance threshold to consider click on the line

                    for (let i = 0; i < this.collisionLines.length; i++) {
                        let line = this.collisionLines[i];
                        let lineStart = { x: line[0], y: line[1] };
                        let lineEnd = { x: line[2], y: line[3] };

                        if (this.pointToLineDistance(clickPoint, lineStart, lineEnd) <= threshold) {
                            this.app.stage.removeChild(line[4])
                            this.collisionLines.splice(i, 1); // Remove the line
                            break;
                        }
                    }
                }
            }

            if (event.data.button === 0) {
                this.heldDownLeft = true;
                let xPos = Math.floor(this.mouseX / this.cellWidth);
                let yPos = Math.floor(this.mouseY / this.cellHeight);

                if (this.mode === 'wall') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let wall = this.map[yPos][xPos];
                        wall.setWall(!wall.isWall);
                        this.isWall = wall.isWall;
                    }
                }

                if (this.mode === 'line') {
                    xPos = Math.round(this.mouseX / this.cellWidth) * this.cellWidth;
                    yPos = Math.round(this.mouseY / this.cellHeight) * this.cellHeight;

                    if (this.lineStart === null) {
                        // First click - set the start point of the line
                        this.lineStart = { x: xPos, y: yPos }; // Store start point coordinates

                        // Draw and store the circle graphic
                        this.lineStartCircle = new PIXI.Graphics();
                        this.lineStartCircle.beginFill(0xFF00FF);
                        this.lineStartCircle.drawCircle(xPos, yPos, 5); // Draw circle at the start point
                        this.lineStartCircle.endFill();
                        this.app.stage.addChild(this.lineStartCircle);
                    } else {
                        // Second click - draw the line
                        if (!(this.lineStart.x == xPos && this.lineStart.y == yPos)) {
                            let line = new PIXI.Graphics();
                            line.lineStyle(3, 0xFF00FF)
                                .moveTo(this.lineStart.x, this.lineStart.y) // Start from the first point
                                .lineTo(xPos, yPos); // Draw line to the second point
                            this.app.stage.addChild(line);

                            // Remove the start point circle from the stage
                            this.app.stage.removeChild(this.lineStartCircle);

                            this.collisionLines.push([this.lineStart.x, this.lineStart.y, xPos, yPos, line])

                            this.lineStart = null;
                            this.lineStartCircle = null;
                        } else {
                            this.app.stage.removeChild(this.lineStartCircle);
                            this.lineStart = null;
                            this.lineStartCircle = null;
                        }
                    }
                }

                if (this.mode === 'playerSpawn') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let cell = this.map[yPos][xPos];
                        if (cell.getSpawn() === 'player') {
                            cell.clearSpawn();
                            this.playerSpawnMarked = false;
                        } else if (this.playerSpawnMarked === false) {
                            cell.setSpawn('player')
                            this.playerSpawnMarked = true;
                        }
                    }
                }

                if (this.mode === 'brownTankSpawn') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let cell = this.map[yPos][xPos];
                        if (cell.getSpawn() === 'brown') {
                            cell.clearSpawn();
                        } else {
                            cell.setSpawn('brown')
                        }
                    }
                }

                if (this.mode === 'greyTankSpawn') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let cell = this.map[yPos][xPos];
                        if (cell.getSpawn() === 'grey') {
                            cell.clearSpawn();
                        } else {
                            cell.setSpawn('grey')
                        }
                    }
                }

                if (this.mode === 'greenTankSpawn') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let cell = this.map[yPos][xPos];
                        if (cell.getSpawn() === 'green') {
                            cell.clearSpawn();
                        } else {
                            cell.setSpawn('green')
                        }
                    }
                }

                if (this.mode === 'pinkTankSpawn') {
                    if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                        let cell = this.map[yPos][xPos];
                        if (cell.getSpawn() === 'pink') {
                            cell.clearSpawn();
                        } else {
                            cell.setSpawn('pink')
                        }
                    }
                }
            }
        });

        this.app.renderer.plugins.interaction.on('pointerup', (event) => {
            if (event.data.button === 0) {
                this.heldDownLeft = false;
            }

            if (event.data.button === 2) {
                this.heldDownRight = false;
            }
        });
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        // Calculate the distance from the point to the line segment
        let A = point.x - lineStart.x;
        let B = point.y - lineStart.y;
        let C = lineEnd.x - lineStart.x;
        let D = lineEnd.y - lineStart.y;

        let dot = A * C + B * D;
        let lenSq = C * C + D * D;
        let param = -1;
        if (lenSq != 0) { // In case of 0 length line
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        let dx = point.x - xx;
        let dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    loadMapFromFile(fileContent) {
        // Normalize newlines (convert all to Unix-style)
        fileContent = fileContent.replace(/\r\n/g, '\n');

        // Split the file content into wall data and collision line data
        const sections = fileContent.trim().split('\n\n');

        let wallData = sections[0];
        let lineData = sections.length > 1 ? sections[1] : '';

        // Process wall data
        let loadedMap = wallData.split('\n').map(row => row.trim().split(' ').map(Number));

        // Process collision line data
        let loadedLines = [];
        if (lineData) {
            lineData.split('\n').forEach(line => {
                let coords = line.split(' ').map(Number);
                if (coords.length === 4) { // Ensure the line has exactly four coordinates
                    loadedLines.push(coords);
                }
            });
        }

        return { map: loadedMap, lines: loadedLines };
    }

    // empty = 0
    // wall = 1
    // player = 2
    // brown = 3
    // grey = 4
    // green = 5
    // pink = 6
    updateMap(loadedData) {
        let inputMap = loadedData.map;
        for (let i = 0; i < inputMap.length; i++) {
            for (let j = 0; j < inputMap[i].length; j++) {
                // This is not optimal but very easy to read      
                let currentCell = this.map[i][j];
                if (inputMap[i][j] === 0) {
                    currentCell.setWall(false);
                }

                if (inputMap[i][j] === 1) {
                    currentCell.setWall(true);
                }

                if (inputMap[i][j] === 2) {
                    currentCell.setWall(false);
                    currentCell.setSpawn('player');
                }

                if (inputMap[i][j] === 3) {
                    currentCell.setWall(false);
                    currentCell.setSpawn('brown');
                }

                if (inputMap[i][j] === 4) {
                    currentCell.setWall(false);
                    currentCell.setSpawn('grey');
                }

                if (inputMap[i][j] === 5) {
                    currentCell.setWall(false);
                    currentCell.setSpawn('green');
                }

                if (inputMap[i][j] === 6) {
                    currentCell.setWall(false);
                    currentCell.setSpawn('pink');
                }
            }
        }

        // Update collision lines
        let loadedLines = loadedData.lines;
        this.collisionLines = [];
        loadedLines.forEach(lineCoords => {
            let line = new PIXI.Graphics();
            line.lineStyle(3, 0xFF00FF)
                .moveTo(lineCoords[0], lineCoords[1])
                .lineTo(lineCoords[2], lineCoords[3]);
            this.app.stage.addChild(line);
            lineCoords.push(line)
            this.collisionLines.push(lineCoords);
        });
    }

    cleanup() {
        this.app.stage.removeChildren();
        document.getElementById('gameContainer').removeChild(this.app.view);
        this.app = null;
    }
}