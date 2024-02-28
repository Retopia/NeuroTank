import { Game } from './Game.js';
import { MapBuilder } from './MapBuilder.js';

let currentScene = 'map'; // Keep track of the current scene
let mapBuilder = null;
let game = null;

document.getElementById('switchSceneButton').addEventListener('click', function (event) {
    if (currentScene === 'game') {
        game.cleanup();
        mapBuilder = new MapBuilder();
        mapBuilder.setup();
        currentScene = 'map';
    } else {
        mapBuilder.cleanup()
        game = new Game();
        game.setup();
        currentScene = 'game';
    }
});

if (currentScene === 'map') {
    mapBuilder = new MapBuilder();
    mapBuilder.setup();
}