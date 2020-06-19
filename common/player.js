const Cell = require('./cell');
module.exports =  class Player {
    constructor({id = 0, name = "", timer = 0} = {}, client = {}, gameId = "") {
        this.client = client;
        this.id = id;
        this.gameId = gameId;
        this.timer = timer;
        this.ready = false;
        this.position = null;
        this.name = name;
    }
}