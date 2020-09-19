// Helper class for creating the maze
module.exports = class Cell {
    constructor(x, y) {
        this.column = x;
        this.row = y;
        this.topWall = true;
        this.bottomWall = true;
        this.rightWall = true;
        this.leftWall = true;
        this.visited = false;
    }

    isSame(anotherCell){
        return this.column === anotherCell.column && this.row === anotherCell.row;
    }
}