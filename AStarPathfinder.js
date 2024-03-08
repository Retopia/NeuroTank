import { Node } from "./Node.js";

export class AStarPathfinder {
    constructor(grid) {
        this.grid = grid.map(row => row.map(cell => new Node(cell)));
    }

    findPath(startPos, endPos) {
        const startNode = this.grid[startPos.y][startPos.x];
        const endNode = this.grid[endPos.y][endPos.x];

        const openSet = [];
        const closedSet = new Set();

        startNode.gCost = 0;
        startNode.hCost = this.heuristic(startNode, endNode);
        startNode.fCost = startNode.hCost;

        openSet.push(startNode);

        while (openSet.length > 0) {
            // console.log(openSet, closedSet)
            let currentNode = openSet.reduce((a, b) => a.fCost < b.fCost ? a : b);

            if (currentNode === endNode) {
                return this.retracePath(startNode, endNode);
            }

            openSet.splice(openSet.indexOf(currentNode), 1);
            closedSet.add(currentNode);

            for (let neighbor of this.getNeighbors(currentNode)) {
                if (closedSet.has(neighbor) || neighbor.cell.isWall) {
                    continue;
                }

                let newMovementCostToNeighbor = currentNode.gCost + this.heuristic(currentNode, neighbor);
                if (newMovementCostToNeighbor < neighbor.gCost || !openSet.includes(neighbor)) {
                    neighbor.gCost = newMovementCostToNeighbor;
                    neighbor.hCost = this.heuristic(neighbor, endNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    neighbor.parent = currentNode;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // No path found
        return [];
    }

    getNeighbors(node) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const checkX = node.x + dx;
                const checkY = node.y + dy;
    
                if (checkX >= 0 && checkX < this.grid[0].length && checkY >= 0 && checkY < this.grid.length) {
                    let neighbor = this.grid[checkY][checkX];
    
                    // Check for diagonal movement
                    if (dx !== 0 && dy !== 0) {
                        // For diagonal, both adjacent orthogonal cells must be non-wall
                        let side1 = this.grid[node.y][checkX];
                        let side2 = this.grid[checkY][node.x];
    
                        if (side1.cell.isWall || side2.cell.isWall || this.isAdjacentToWall(neighbor)) {
                            continue; // Skip this neighbor as it's a corner-cutting move or adjacent to a wall
                        }
                    } else if (this.isAdjacentToWall(neighbor)) {
                        continue; // Skip neighbors adjacent to walls for non-diagonal moves
                    }
    
                    if (!neighbor.cell.isWall) {
                        neighbors.push(neighbor);
                    }
                }
            }
        }
        return neighbors;
    }
    
    isAdjacentToWall(node) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkX = node.x + dx;
                const checkY = node.y + dy;
                if (checkX >= 0 && checkX < this.grid[0].length && checkY >= 0 && checkY < this.grid.length) {
                    if (this.grid[checkY][checkX].cell.isWall) {
                        return true; // Adjacent to a wall
                    }
                }
            }
        }
        return false; // Not adjacent to any wall
    }
    
    heuristic(nodeA, nodeB) {
        const distX = Math.abs(nodeA.x - nodeB.x);
        const distY = Math.abs(nodeA.y - nodeB.y);
        return Math.sqrt(distX * distX + distY * distY); // Euclidean Distance
    }

    retracePath(startNode, endNode) {
        const path = [];
        let currentNode = endNode;
        while (currentNode !== startNode) {
            path.push(currentNode.cell);
            currentNode = currentNode.parent;
        }
        return path.reverse();
    }
}
