const Cell = require('./cell');
module.exports =  class Player {
    constructor({id = 0, name = "", timer = 0} = {}, client = {}, ) {
        this.client = client;
        this.id = id;
        this.timer = timer;
        this.map = [[]];
        for (let i = 0; i < 6; i++) {
            this.map[i] = [];
            for (let j = 0; j < 6; j++) {
                this.map[i][j] = new Cell();
            }
        }
        this.name = name;
    }
}