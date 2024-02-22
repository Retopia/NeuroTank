import { Cell } from "./Cell.js"

let map = [];
const rows = 30;
const cols = 40;
const cellWidth = 20;
const cellHeight = 20;

let mouseX = 0;
let mouseY = 0;
let heldDown = false;
let isWall = false;

// PixiJS setup
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff
});

function setup() {
    // Creating the map
    for (let i = 0; i < rows; i++) {
        let tempWalls = [];
        for (let j = 0; j < cols; j++) {
            let isWall = false;
            if (i == 0 || i == rows - 1 || j == 0 || j == cols - 1) {
                isWall = true;
            }
            let wall = new Cell(j * 20, i * 20, cellWidth, cellHeight, -1, isWall);
            tempWalls.push(wall);
            app.stage.addChild(wall.body)
        }
        map.push(tempWalls);
    }

    document.getElementById('gameContainer').appendChild(app.view);

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

function copyMapToClipboard() {
    let mapString = '';

    for (let i = 0; i < map.length; i++) {
        let rowString = map[i].map(cell => cell.isWall ? '1' : '0').join(' ');
        mapString += rowString;

        if (i < map.length - 1) {
            mapString += '\n';
        }
    }

    navigator.clipboard.writeText(mapString).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });

    return mapString; // Return the string representation of the map
}

document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        // Now you have the file content, and you can process it
        let loadedMap = loadMapFromFile(fileContent);
        updateMap(loadedMap);
    };

    reader.readAsText(file); // Read the file as text
});

function loadMapFromFile(fileContent) {
    let loadedMap = fileContent.split('\n').map(line => line.trim().split(' ').map(Number));
    return loadedMap;
}

function updateMap(inputMap) {
    for (let i = 0; i < inputMap.length; i++) {
        for (let j = 0; j < inputMap[i].length; j++) {
            let isWall = inputMap[i][j] === 1;
            if (map[i] && map[i][j]) {
                map[i][j].setWall(isWall); // Assuming you have a method setWall to update the cell
            }
        }
    }
}

document.getElementById('copyMapButton').addEventListener('click', copyMapToClipboard);

app.renderer.plugins.interaction.on('pointermove', function (e) {
    const newPosition = e.data.global;
    mouseX = newPosition.x;
    mouseY = newPosition.y;

    if (heldDown) {
        let xPos = Math.floor(mouseX / cellWidth);
        let yPos = Math.floor(mouseY / cellHeight);

        // Bounds checking
        if (yPos > 0 && yPos < map.length - 1 && xPos > 0 && xPos < map[0].length - 1) {
            let wall = map[yPos][xPos];
            wall.setWall(isWall);
        }
    }
});

app.renderer.view.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

app.renderer.plugins.interaction.on('pointerdown', function (e) {
    if (e.data.button === 0) {
        heldDown = true;
        let xPos = Math.floor(mouseX / cellWidth);
        let yPos = Math.floor(mouseY / cellHeight);

        if (yPos > 0 && yPos < map.length - 1 && xPos > 0 && xPos < map[0].length - 1) {
            let wall = map[yPos][xPos];
            wall.setWall(!wall.isWall);
            isWall = wall.isWall;
        }
    }
});

app.renderer.plugins.interaction.on('pointerup', function (e) {
    if (e.data.button === 0) {
        heldDown = false;
    }
});

setup();