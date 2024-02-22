export class Cell {
    constructor(x, y, width, height, health, isWall) {
        this.isWall = isWall;

        let cell = new PIXI.Graphics();
        cell.beginFill(0xFFFFFF)
        cell.drawRect(0, 0, width, height);
        cell.endFill();
        cell.tint = isWall ? 0x303030 : 0xFFFFFF

        this.body = cell;

        // Set position and velocity
        this.body.position.set(x, y);
    }

    setWall(isWall) {
        this.body.tint = isWall ? 0x303030 : 0xFFFFFF
        this.isWall = isWall;
    }
}
