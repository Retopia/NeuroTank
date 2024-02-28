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
        this.heldDown = false;
        this.isWall = false;
        this.gridLines = new PIXI.Graphics();
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0xffffff
        });
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

        document.getElementById('copyMapButton').addEventListener('click', (event) => {
            let mapString = '';

            console.log(this.map)

            for (let i = 0; i < this.map.length; i++) {
                let rowString = this.map[i].map(cell => cell.isWall ? '1' : '0').join(' ');
                mapString += rowString;

                if (i < this.map.length - 1) {
                    mapString += '\n';
                }
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

            if (this.heldDown) {
                let xPos = Math.floor(this.mouseX / this.cellWidth);
                let yPos = Math.floor(this.mouseY / this.cellHeight);

                // Bounds checking
                if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                    let wall = this.map[yPos][xPos];
                    wall.setWall(this.isWall);
                }
            }
        });

        this.app.renderer.view.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        this.app.renderer.plugins.interaction.on('pointerdown', (event) => {
            if (event.data.button === 0) {
                this.heldDown = true;
                let xPos = Math.floor(this.mouseX / this.cellWidth);
                let yPos = Math.floor(this.mouseY / this.cellHeight);

                if (yPos > 0 && yPos < this.map.length - 1 && xPos > 0 && xPos < this.map[0].length - 1) {
                    let wall = this.map[yPos][xPos];
                    wall.setWall(!wall.isWall);
                    this.isWall = wall.isWall;
                }
            }
        });

        this.app.renderer.plugins.interaction.on('pointerup', (event) => {
            if (event.data.button === 0) {
                this.heldDown = false;
            }
        });
    }

    loadMapFromFile(fileContent) {
        let loadedMap = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
        return loadedMap;
    }

    updateMap(inputMap) {
        for (let i = 0; i < inputMap.length; i++) {
            for (let j = 0; j < inputMap[i].length; j++) {
                let isWall = inputMap[i][j] === 1;
                if (this.map[i] && this.map[i][j]) {
                    this.map[i][j].setWall(isWall); // Assuming you have a method setWall to update the cell
                }
            }
        }
    }

    cleanup() {
        this.app.stage.removeChildren();
        document.getElementById('gameContainer').removeChild(this.app.view);
        this.app = null;
    }
}