// Brown tanks are stationary

import { Bullet } from "../BulletTypes/Bullet.js";
export class BrownTank {

    constructor(x, y, width, height) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.body.tint = 0xac6902;

        this.setPosition(x, y);
        this.setSize(width, height);


        this.speed = 0;
        this.bullets = [];

        this.maxBullets = 3;
        this.previousShotTime = Date.now();
        this.shotDelay = 2000;

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

    rotateTurret(targetX, targetY) {
        const turretBaseWorldX = this.body.x + this.body.width / 2;
        const turretBaseWorldY = this.body.y + this.body.height / 2;

        const dx = targetX - turretBaseWorldX;
        const dy = targetY - turretBaseWorldY;
        const angle = Math.atan2(dy, dx);

        this.turret.rotation = angle;
    }

    fireBullet() {
        // Limit the amount of bullets that tanks can fire
        if (this.bullets.length < this.maxBullets) {
            const angle = this.body.rotation + this.turret.rotation; // Combined rotation

            // Calculate the starting position at the tip of the turret
            const startX = this.body.x + this.turret.x + Math.cos(angle) * 30;
            const startY = this.body.y + this.turret.y + Math.sin(angle) * 30;

            const bullet = new Bullet(this, startX, startY);
            bullet.fire(angle)

            this.bullets.push(bullet);
            return bullet;
        }
        return null;
    }

    update(delta, walls, player) {
        let res = null;
        this.rotateTurret(player.body.x + player.body.width / 2, player.body.y + player.body.height / 2);
        if (Date.now() - this.previousShotTime > this.shotDelay) {
            this.previousShotTime = Date.now();
            res = this.fireBullet();
        }
        return res;
    }
}