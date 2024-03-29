export class Cell {
    constructor(x, y, width, height, health, isWall) {
        this.isWall = isWall;

        let cell = new PIXI.Graphics();
        cell.beginFill(0xFFFFFF)
        cell.drawRect(0, 0, width, height);
        cell.endFill();
        cell.tint = isWall ? 0x303030 : 0xFFFFFF

        this.body = cell;
        this.spawnType = null;

        this.body.position.set(x, y);
    }

    setWall(isWall) {
        this.clearSpawn();
        this.body.tint = isWall ? 0x303030 : 0xFFFFFF
        this.isWall = isWall;
    }

    // Setting spawn should only be used in map builder
    setSpawn(spawnType) {
        this.spawnType = spawnType;

        if (this.isWall) {
            this.isWall = false;
        }

        if (spawnType === 'player') {
            this.body.tint = 0x0000dd;
        }

        if (spawnType === 'brown') {
            this.body.tint = 0xac6902;
        }

        if (spawnType === 'grey') {
            this.body.tint = 0xa8a8a8;
        }

        if (spawnType === 'green') {
            this.body.tint = 0x009530;
        }

        if (spawnType === 'pink') {
            this.body.tint = 0xC35C70;
        }
    }
    
    getSpawn() {
        return this.spawnType;
    }

    clearSpawn() {
        this.spawnType = null;
        this.body.tint = 0xFFFFFF;
    }
}
