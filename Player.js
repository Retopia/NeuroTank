import { Bullet } from "./Bullet.js"

// player.js
export class Player {
    constructor(x, y, width, height, speed) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.body.tint = 0x0000dd;

        this.setPosition(x, y);
        this.setSize(width, height);


        this.speed = speed;
        this.keyState = {};
        this.bullets = [];

        this.turret = new PIXI.Graphics();
        this.turret.beginFill(0x0000ff);
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

    rectanglesCollide(rect1, rect2) {
        if (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y) {

            return {
                collided: true,
                dx: (rect1.x + rect1.width / 2) - (rect2.x + rect2.width / 2),
                dy: (rect1.y + rect1.height / 2) - (rect2.y + rect2.height / 2)
            };
        }
        return { collided: false };
    }

    resolveCollision(playerRect, wallRect, collision) {
        const overlapX = (playerRect.width / 2 + wallRect.width / 2) - Math.abs(collision.dx);
        const overlapY = (playerRect.height / 2 + wallRect.height / 2) - Math.abs(collision.dy);

        if (overlapX < overlapY) {
            playerRect.x += collision.dx > 0 ? overlapX : -overlapX;
        } else {
            playerRect.y += collision.dy > 0 ? overlapY : -overlapY;
        }
    }

    fireBullet() {
        const angle = this.body.rotation + this.turret.rotation; // Combined rotation
        const bulletSpeed = 4;
        const velocityX = Math.cos(angle) * bulletSpeed;
        const velocityY = Math.sin(angle) * bulletSpeed;

        // Calculate the starting position at the tip of the turret
        const startX = this.body.x + this.turret.x + Math.cos(angle) * this.turret.width;
        const startY = this.body.y + this.turret.y + Math.sin(angle) * this.turret.width;

        const bullet = new Bullet(this, startX, startY, velocityX, velocityY);
        bullet.body.rotation = angle
        this.bullets.push(bullet);
        return bullet;
    }

    update(delta, walls) { // Add walls as a parameter
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

        // Proposed new position
        let newX = this.body.x + dx * this.speed * delta;
        let newY = this.body.y + dy * this.speed * delta;

        // Collision check
        let collisionOccurred = false;
        for (let i = 0; i < walls.length; i++) {
            for (let j = 0; j < walls[i].length; j++) {
                let wall = walls[i][j]
                const collision = this.rectanglesCollide({ x: newX, y: newY, width: this.body.width, height: this.body.height }, wall.body);
                if (collision.collided) {
                    this.resolveCollision(this.body, wall.body, collision);
                    collisionOccurred = true;
                    break; // Resolve one collision at a time
                }
            }
        }

        if (!collisionOccurred) {
            // Update position if no collision
            this.body.x = newX;
            this.body.y = newY;
        }
    }

}
