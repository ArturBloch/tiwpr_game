module.exports = class Cell {
    constructor(x, y) {
        this.column = x;
        this.row = y;
        this.top = true;
        this.bottom = true;
        this.right = true;
        this.left = true;
        this.visited = false;
    }
}