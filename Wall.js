// Wall.js
export class Wall {
    constructor(x, y, width, height, health) {
        this.body = new PIXI.Container();

        const wall = new PIXI.Graphics();
        wall.beginFill(0x303030);
        wall.drawRect(0, 0, width, height);
        wall.endFill();
        this.body.addChild(wall);

        // Set position and velocity
        this.body.position.set(x, y);
    }
}
