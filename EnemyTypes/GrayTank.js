import { Bullet } from "../BulletTypes/Bullet.js";
import { AStarPathfinder } from "../AStarPathfinder.js";
import { Node } from "../Node.js";
export class GreyTank {

    constructor(x, y, width, height, speed) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.body.tint = 0xa8a8a8;

        this.setPosition(x, y);
        this.setSize(width, height);

        this.speed = speed;
        this.firedBullets = 0;

        this.shootingCooldown = 0;
        // This is based on delta... im not sure what unit this is in ngl but it feels right so
        this.cooldownPeriod = 5;

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

    setPathfinder(physicalMap) {
        this.physicalMap = physicalMap;
        this.pathfinder = new AStarPathfinder(physicalMap);
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
            this.shootingCooldown = this.cooldownPeriod;
            return bullet;
        }
        return null;
    }

    isAdjacentToWall(map, cell) {
        const row = Math.floor(cell.body.y / 20); // Assuming 20 is the cell height
        const col = Math.floor(cell.body.x / 20); // Assuming 20 is the cell width

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // Skip the cell itself
                if (dx === 0 && dy === 0) continue;

                const checkX = col + dx;
                const checkY = row + dy;

                // Check if the neighboring cell is within the map bounds
                if (checkX >= 0 && checkX < map[0].length && checkY >= 0 && checkY < map.length) {
                    // Check if the neighboring cell is a wall
                    if (map[checkY][checkX].isWall) {
                        return true; // Adjacent to a wall
                    }
                }
            }
        }
        return false; // Not adjacent to any wall
    }

    findSafeDestination(map, currentCell, maxDistance) {
        let lowestDanger = Infinity;
        let safeCells = [];

        for (let i = -maxDistance; i <= maxDistance; i++) {
            for (let j = -maxDistance; j <= maxDistance; j++) {
                let cellRow = currentCell.row + i;
                let cellCol = currentCell.col + j;

                // Check boundaries
                if (cellRow >= 0 && cellRow < map.length && cellCol >= 0 && cellCol < map[0].length
                    && !this.isAdjacentToWall(map, map[cellRow][cellCol]) && !map[cellRow][cellCol].isWall) {
                    let danger = map[cellRow][cellCol].dangerValue;
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

        if (this.targetDestination) {
            mapWalls[this.targetDestination.row][this.targetDestination.col].body.tint = 0x0000FF;
        }

        if (this.path) {
            for (let i = 0; i < this.path.length; i++) {
                this.path[i].body.tint = 0xFF00FF;
            }
        }

        if (this.shootingCooldown > 0) {
            this.shootingCooldown -= delta;
        }

        // Only allow movement after cooldown
        if (this.shootingCooldown <= 0) {

            // Find the current cell of the AI tank
            let currentCell = {
                row: Math.floor(this.body.y / cellHeight),
                col: Math.floor(this.body.x / cellWidth)
            };
            // Color code the current cell for visualization
            if (currentCell) {
                mapWalls[currentCell.row][currentCell.col].body.tint = 0x00FF00;
            }

            // Rotate the turret towards the player
            this.rotateTurret(player.body.x + player.body.width / 2, player.body.y + player.body.height / 2);

            // Is it able to shoot
            if (Date.now() - this.previousShotTime > this.shotDelay) {
                this.previousShotTime = Date.now();



                res = this.fireBullet();
            }

            // Determine if a new target destination is needed
            if (!this.targetDestination ||
                (this.targetDestination.row === currentCell.row && this.targetDestination.col === currentCell.col)) {
                this.targetDestination = this.findSafeDestination(map, currentCell, 15);

                this.path = this.pathfinder.findPath({ x: currentCell.col, y: currentCell.row },
                    { x: this.targetDestination.col, y: this.targetDestination.row });
            }

            // Move towards the next waypoint in the path
            if (this.path && this.path.length > 0) {
                let nextWaypoint = this.path[0]; // The next waypoint in the path
                let waypointX = nextWaypoint.body.x + cellWidth / 2;
                let waypointY = nextWaypoint.body.y + cellHeight / 2;

                // Calculate the direction to the waypoint
                let directionX = waypointX - this.body.x;
                let directionY = waypointY - this.body.y;

                // Normalize the direction
                let magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
                if (magnitude < 1) {
                    // Remove the reached waypoint from the path
                    this.path.shift();
                } else {
                    directionX /= magnitude;
                    directionY /= magnitude;

                    // Move the tank towards the center of the next waypoint
                    this.body.x += directionX * this.speed * delta;
                    this.body.y += directionY * this.speed * delta;
                }
            }

            return res;
        }
    }
}