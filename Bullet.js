// Bullet.js
export class Bullet {
    constructor(x, y, velocityX, velocityY) {
        this.body = new PIXI.Container();

        // const border = new PIXI.Graphics();
        // border.beginFill(0x000000);
        // border.drawRect(-1, -1, 11, 6); // Slightly larger than the bullet
        // border.endFill();
        // this.body.addChild(border);

        // Yellow bullet
        const bullet = new PIXI.Graphics();
        bullet.beginFill(0xfabb55); // Yellow color
        bullet.drawRect(0, 0, 10, 5); // Bullet size
        bullet.endFill();
        this.body.addChild(bullet);

        // Set position and velocity
        this.body.position.set(x, y);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }

    update(delta) {
        this.body.x += this.velocityX * delta;
        this.body.y += this.velocityY * delta;
    }
}
