const Cell = require('./cell');
module.exports =  class Player {
    constructor({id = 0, name = "", timer = 0} = {}, client = {}, gameId = "") {
        this.client = client;
        this.id = id;
        this.gameId = gameId;
        this.timer = timer;
        this.ready = false;
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