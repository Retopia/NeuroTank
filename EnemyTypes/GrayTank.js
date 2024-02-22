// Brown tanks are stationary

import { Bullet } from "../BulletTypes/Bullet.js";
export class GreyTank {

    constructor(x, y, width, height, speed) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.body.tint = 0xa8a8a8;

        this.setPosition(x, y);
        this.setSize(width, height);

        this.speed = speed;
        this.firedBullets = 0;

        this.maxBullets = 3;
        this.previousShotTime = Date.now();
        this.shotDelay = 2000;

        this.targetDestination = null;

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
        // Limit the amount of bullets that tanks can fire
        if (this.firedBullets < this.maxBullets) {
            const angle = this.body.rotation + this.turret.rotation; // Combined rotation

            // Calculate the starting position at the tip of the turret
            const startX = this.body.x + this.turret.x + Math.cos(angle) * 30;
            const startY = this.body.y + this.turret.y + Math.sin(angle) * 30;

            const bullet = new Bullet(this, startX, startY);
            bullet.fire(angle)

            this.firedBullets += 1;
            return bullet;
        }
        return null;
    }

    findSafeDestination(map, currentCell, maxDistance) {
        let lowestDanger = Infinity;
        let safeCells = [];

        for (let i = -maxDistance; i <= maxDistance; i++) {
            for (let j = -maxDistance; j <= maxDistance; j++) {
                let cellRow = currentCell.row + i;
                let cellCol = currentCell.col + j;

                // Check boundaries
                if (cellRow >= 0 && cellRow < map.length && cellCol >= 0 && cellCol < map[0].length) {
                    let danger = map[cellRow][cellCol];
                    if (danger < lowestDanger) {
                        lowestDanger = danger;
                        safeCells = [{ row: cellRow, col: cellCol }];
                    } else if (danger === lowestDanger) {
                        safeCells.push({ row: cellRow, col: cellCol });
                    }
                }
            }
        }

        // Randomly select one of the safe cells
        if (safeCells.length > 0) {
            let randomIndex = Math.floor(Math.random() * safeCells.length);
            return safeCells[randomIndex];
        }

        return null;
    }

    update(delta, map, player, mapWalls) {
        let res = null;
        let cellHeight = 20;
        let cellWidth = 20;

        this.rotateTurret(player.body.x + player.body.width / 2, player.body.y + player.body.height / 2);
        if (Date.now() - this.previousShotTime > this.shotDelay) {
            this.previousShotTime = Date.now();
            res = this.fireBullet();
        }

        // Find the current cell of the AI tank
        let currentCell = {
            row: Math.floor(this.body.y / cellHeight),
            col: Math.floor(this.body.x / cellWidth)
        };

        // Check if the target is reached or no longer safe
        if (!this.targetDestination ||
            this.targetDestination.row === currentCell.row && this.targetDestination.col === currentCell.col) {
            this.targetDestination = this.findSafeDestination(map, currentCell, 7);
        }

        if (this.targetDestination) {

            mapWalls[currentCell.row][currentCell.col].body.tint = 0x00FF00
            mapWalls[this.targetDestination.row][this.targetDestination.col].body.tint = 0x0000FF
            let destinationX = this.targetDestination.col * cellWidth;
            let destinationY = this.targetDestination.row * cellHeight;

            // Calculate the direction to the destination
            let directionX = destinationX - this.body.x + this.body.width;
            let directionY = destinationY - this.body.y + this.body.height;

            // Normalize the direction
            let magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
            if (magnitude > 0) {
                directionX /= magnitude;
                directionY /= magnitude;
            }

            // Move the tank
            this.body.x += directionX * this.speed * delta;
            this.body.y += directionY * this.speed * delta;
        }

        return res;
    }
}