import { Bullet } from "./Bullet.js"

export class Enemy {

    constructor(x, y, width, height, speed) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE); // Create sprite from white texture
        this.body.tint = 0xac6902; // Tint it black

        this.setPosition(x, y);
        this.setSize(width, height);


        this.speed = speed;
        this.bullets = [];

        this.turret = new PIXI.Graphics();
        this.turret.beginFill(0x965d00);
        this.turret.drawRect(0, -2, 20, 4);
        this.turret.endFill();
        this.turret.x = this.body.width / 2 - this.turret.height / 2; // Center of the tank's width
        this.turret.y = this.body.height / 2 - this.turret.height / 2; // Center of the tank's height

        this.body.addChild(this.turret);
    }

    setPosition(x, y) {
        this.body.x = x;
        this.body.y = y;
    }

    setSize(width, height) {
        this.body.width = width;
        this.body.height = height;
    }
}