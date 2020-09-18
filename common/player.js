module.exports =  class Player {
    constructor({id = 0, name = ""} = {}, client = {}, gameId = "") {
        this.client = client;
        this.id = id;
        this.gameId = gameId;
        this.ready = false;
        this.position = null;
        this.name = name;
        this.mazeTimer = 0;
        this.finished = false;
    }
}