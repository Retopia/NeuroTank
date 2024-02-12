import { Bullet } from "./Bullet.js"

// player.js
export class Player {
    constructor(x, y, width, height, speed) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE); // Create sprite from white texture
        this.body.tint = 0x0000ff; // Tint it black

        this.setPosition(x, y);
        this.setSize(width, height);


        this.speed = speed; // Speed of the player
        this.keyState = {};
        this.bullets = [];

        this.turret = new PIXI.Graphics();
        this.turret.beginFill(0x965d00); 
        this.turret.drawRect(0, -2, 20, 4);
        this.turret.endFill();
        this.turret.x = this.body.width / 2 - this.turret.height / 2; // Center of the tank's width
        this.turret.y = this.body.height / 2 - this.turret.height / 2; // Center of the tank's height

        this.body.addChild(this.turret);

        this.setupKeyboard();
    }

    rotateTurret(mouseX, mouseY) {
        const turretBaseWorldX = this.body.x + this.body.width / 2;
        const turretBaseWorldY = this.body.y + this.body.height / 2;

        const dx = mouseX - turretBaseWorldX;
        const dy = mouseY - turretBaseWorldY;
        const angle = Math.atan2(dy, dx);

        this.turret.rotation = angle;
    }

    setPosition(x, y) {
        this.body.x = x;
        this.body.y = y;
    }

    setSize(width, height) {
        this.body.width = width;
        this.body.height = height;
    }

    setupKeyboard() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        this.keyState[event.key] = true;
    }

    onKeyUp(event) {
        this.keyState[event.key] = false;
    }

    fireBullet() {
        const angle = this.body.rotation + this.turret.rotation; // Combined rotation
        const bulletSpeed = 5;
        const velocityX = Math.cos(angle) * bulletSpeed;
        const velocityY = Math.sin(angle) * bulletSpeed;

        // Calculate the starting position at the tip of the turret
        const startX = this.body.x + this.turret.x + Math.cos(angle) * this.turret.width;
        const startY = this.body.y + this.turret.y + Math.sin(angle) * this.turret.width;

        const bullet = new Bullet(startX, startY, velocityX, velocityY);
        bullet.body.rotation = angle
        this.bullets.push(bullet);
        return bullet;
    }

    update(delta) {
        let dx = 0;
        let dy = 0;

        if (this.keyState['w']) dy -= 1;
        if (this.keyState['s']) dy += 1;
        if (this.keyState['a']) dx -= 1;
        if (this.keyState['d']) dx += 1;

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2; // 1/sqrt(2)
            dy *= Math.SQRT1_2;
        }

        this.body.x += dx * this.speed * delta;
        this.body.y += dy * this.speed * delta;

        this.bullets.forEach(bullet => bullet.update(delta));
    }

}
