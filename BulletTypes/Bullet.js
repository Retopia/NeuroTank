// Bullet.js
export class Bullet {
    constructor(owner, x, y) {
        this.owner = owner;

        this.body = new PIXI.Container();

        this.bounces = 0;
        this.toDestroy = false;

        this.bulletSpeed = 3.25

        // Yellow bullet
        const bullet = new PIXI.Graphics();
        bullet.beginFill(0xfabb55);
        bullet.drawRect(0, 0, 10, 5); // Bullet size
        bullet.endFill();
        this.body.addChild(bullet);

        // Set position
        this.body.position.set(x, y);
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

    detectCollision(bullet, wall) {
        const overlapX = Math.max(0, Math.min(bullet.x + bullet.width, wall.x + wall.width) - Math.max(bullet.x, wall.x));
        const overlapY = Math.max(0, Math.min(bullet.y + bullet.height, wall.y + wall.height) - Math.max(bullet.y, wall.y));

        return {
            collided: overlapX > 0 && overlapY > 0,
            overlapX: overlapX,
            overlapY: overlapY
        };
    }

    fire(angle) {
        this.velocityX = Math.cos(angle) * this.bulletSpeed;
        this.velocityY = Math.sin(angle) * this.bulletSpeed;
        this.body.rotation = angle
    }

    update(delta, walls) {
        // Proposed new position
        let newX = this.body.x + this.velocityX * delta;
        let newY = this.body.y + this.velocityY * delta;

        let potentialCollisions = [];

        // Collision check with each wall
        for (let i = 0; i < walls.length; i++) {
            for (let j = 0; j < walls[i].length; j++) {
                let wall = walls[i][j]
                if (wall.isWall) {
                    const collision = this.detectCollision({ x: newX, y: newY, width: this.body.width, height: this.body.height }, wall.body);
                    if (collision.collided) {
                        potentialCollisions.push({ collision, wall });
                    }
                }
            }
        }

        if (potentialCollisions.length > 0) {
            // Resolve the most relevant collision
            let resolved = this.resolveCollision(potentialCollisions, delta);
            if (resolved) {
                this.bounces++;
                if (this.bounces > 1) {
                    this.toDestroy = true;
                }
            }
        } else {
            // Update position if no collision
            this.body.x = newX;
            this.body.y = newY;
        }

        this.body.rotation = Math.atan2(this.velocityY, this.velocityX);
    }

    resolveCollision(collisions, delta) {
        // Sort collisions based on the overlap and bullet's direction
        collisions.sort((a, b) => {
            let aPriority = (Math.abs(this.velocityX) > Math.abs(this.velocityY)) ? a.collision.overlapX : a.collision.overlapY;
            let bPriority = (Math.abs(this.velocityX) > Math.abs(this.velocityY)) ? b.collision.overlapX : b.collision.overlapY;
            return bPriority - aPriority;
        });

        let resolved = false;
        for (let { collision } of collisions) {
            if (collision.overlapX < collision.overlapY) {
                this.velocityX *= -1; // Reflect horizontally
                resolved = true;
            } else {
                this.velocityY *= -1; // Reflect vertically
                resolved = true;
            }
            if (resolved) break;
        }

        return resolved;
    }
}
