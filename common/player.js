module.exports =  class Player {
    constructor({id = 0, name = ""} = {}, gameId = "") {
        this.id = id;
        this.client = null;
        this.gameId = gameId; // players should have different IDs from clients to hide important information
        this.ready = false;
        this.position = null;
        this.name = name;
        this.mazeTimer = 0;
        this.finished = false;
        this.connected = false;
    }
}