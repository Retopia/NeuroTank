import { Bullet } from "./BulletTypes/Bullet.js"

// player.js
export class Player {
    constructor(x, y, width, height, speed, app) {
        this.body = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.body.tint = 0x0000dd;
        this.app = app;

        this.setPosition(x, y);
        this.setSize(width, height);

        this.shootingCooldown = 0;
        // This is based on delta... im not sure what unit this is in ngl but it feels right so
        this.cooldownPeriod = 5;

        this.speed = speed;
        this.keyState = {};

        this.firedBullets = 0;
        this.maxBullets = 5;

        this.turret = new PIXI.Graphics();
        this.turret.beginFill(0x0000ff);
        this.turret.drawRect(0, -2, 20, 4);
        this.turret.endFill();
        this.turret.x = this.body.width / 2 - this.turret.height / 2; // Center of the tank's width
        this.turret.y = this.body.height / 2 - this.turret.height / 2; // Center of the tank's height

        this.body.addChild(this.turret);

        this.setupKeyboard();

        this.body.pivot.set(this.body.width / 2, this.body.height / 2);

        this.corners = [];
        // Add line segments
        this.lineSegments = [];

        const lineColor = 0xff0000; // Red color for line segments
        const lineWidth = 2;

        // Create 4 lines for each edge of the rectangle
        for (let i = 0; i < 4; i++) {
            let line = new PIXI.Graphics();
            line.lineStyle(lineWidth, lineColor);
            this.lineSegments.push(line);
            this.app.stage.addChild(line);
        }
    }

    bringToFront(container, child) {
        if (container.children.includes(child)) {
            container.removeChild(child);
            container.addChild(child); // This adds the child to the end of the children array
        }
    }

    rotateTurret(mouseX, mouseY) {
        const turretBaseWorldX = this.body.x + this.body.width / 2;
        const turretBaseWorldY = this.body.y + this.body.height / 2;

        const dx = mouseX - turretBaseWorldX;
        const dy = mouseY - turretBaseWorldY;
        const angle = Math.atan2(dy, dx);

        this.turret.rotation = angle - this.body.rotation;
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
        // Limit the amount of bullets that tanks can fire
        if (this.firedBullets < this.maxBullets) {
            const angle = this.body.rotation + this.turret.rotation; // Combined rotation

            // Calculate the starting position at the tip of the turret
            const startX = this.body.x + this.turret.x + Math.cos(angle) * 30;
            const startY = this.body.y + this.turret.y + Math.sin(angle) * 30;

            const bullet = new Bullet(this, startX, startY);
            bullet.fire(angle)

            this.firedBullets += 1
            this.shootingCooldown = this.cooldownPeriod;
            return bullet;
        }
        return null;
    }

    updateLinePositions(newX, newY) {
        const hw = this.body.width / 2;
        const hh = this.body.height / 2;
        const cos = Math.cos(this.body.rotation);
        const sin = Math.sin(this.body.rotation);
        const points = [
            new PIXI.Point(-hw, -hh), // Top-left
            new PIXI.Point(hw, -hh),  // Top-right
            new PIXI.Point(hw, hh),   // Bottom-right
            new PIXI.Point(-hw, hh)   // Bottom-left
        ];
        // Calculate the position of the player's center
        const centerX = newX;
        const centerY = newY;

        for (let i = 0; i < 4; i++) {
            let line = this.lineSegments[i];
            line.clear();
            line.lineStyle(1, 0xff0000);

            // Calculate and round the coordinates for start and end points
            const rotatedStartX = Math.round(centerX + (points[i].x * cos - points[i].y * sin));
            const rotatedStartY = Math.round(centerY + (points[i].x * sin + points[i].y * cos));
            const rotatedEndX = Math.round(centerX + (points[(i + 1) % 4].x * cos - points[(i + 1) % 4].y * sin));
            const rotatedEndY = Math.round(centerY + (points[(i + 1) % 4].x * sin + points[(i + 1) % 4].y * cos));

            line.moveTo(rotatedStartX, rotatedStartY);
            line.lineTo(rotatedEndX, rotatedEndY);
        }
    }

    checkCollisionsWithWalls(wall) {
        let collision = { occurred: false, dx: 0, dy: 0 };
        const collisionColor = 0x00ff00; // Green color to indicate collision
        const defaultColor = 0xff0000; // Red color for no collision

        for (let i = 0; i < this.lineSegments.length; i++) {
            let line = this.lineSegments[i];
            let startPoint = new PIXI.Point(line.currentPath.points[0], line.currentPath.points[1]);
            let endPoint = new PIXI.Point(line.currentPath.points[2], line.currentPath.points[3]);

            if (this.isPointInRect(startPoint, wall.body) || this.isPointInRect(endPoint, wall.body)) {
                collision.occurred = true;
                // wall.body.tint = collisionColor;

                // TODO implement 
            }

            line.clear();
            line.lineStyle(2, collision.occurred ? collisionColor : defaultColor);
            line.moveTo(startPoint.x, startPoint.y);
            line.lineTo(endPoint.x, endPoint.y);
        }

        return collision;
    }

    isPointInRect(point, rect) {
        // Check if a point is inside a rectangle
        return point.x >= rect.x && point.x <= rect.x + rect.width &&
            point.y >= rect.y && point.y <= rect.y + rect.height;
    }

    update(delta, walls, mouseX, mouseY) {
        this.prevX = this.body.x
        this.prevY = this.body.y
        this.lineSegments.forEach(line => {
            this.bringToFront(this.app.stage, line);
        });

        this.rotateTurret(mouseX, mouseY);

        if (this.shootingCooldown > 0) {
            this.shootingCooldown -= delta;
        }

        // Only allow movement after cooldown
        // This is to achieve the pausing effect like in Wii Tanks
        if (this.shootingCooldown <= 0) {
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

            this.updateLinePositions(newX, newY);

            // Collision check
            let collisionOccurred = false;
            for (let wall of walls.flat()) {
                if (wall.isWall) {
                    if (this.checkCollisionsWithWalls(wall).occurred) {
                        console.log("hi")
                        collisionOccurred = true;
                        break;
                    }
                }
            }

            if (!collisionOccurred) {
                // If no collision, new position is confirmed
                this.body.x = newX;
                this.body.y = newY;

                // Only update the rotation if there is a change in direction
                // if (dx !== 0 || dy !== 0) {
                //     const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;

                //     let angleDifference = targetAngle - this.body.rotation;

                //     // Make sure we rotate the shortest distance
                //     while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;
                //     while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;

                //     const rotationSpeed = 0.2;

                //     const rotationAmount = angleDifference * rotationSpeed * delta;

                //     this.body.rotation += rotationAmount;
                // }
            }
        }
    }
}
