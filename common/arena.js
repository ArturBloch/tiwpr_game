const Player = require('./player');

module.exports = class Arena {
    constructor() {
        this.timer = 5;
        this.prevTime = 0;
        this.player1 = new Player({ id : 1, name: "Player1"});
        this.player2 = new Player({ id : 2, name: "Player2"});
        this.playerTurn = this.player1;
    }

    start(){

    }

    update(nowTime) {
        this.timer = (this.timer - (nowTime - this.prevTime) / 1000);
        if(this.timer < 0){
            console.log("timer = ", this.timer);
            this.timer += 5;
            this.switchPlayer();
        }
        this.prevTime = nowTime;
    }

    setTime(newTime, prevTime){
        this.timer = newTime;
        this.prevTime = prevTime;
    }

    getTime(){
        return this.timer.toFixed(2);
    }

    switchPlayer() {
        if (this.playerTurn === this.player1) {
            this.playerTurn = this.player2;
        } else {
            this.playerTurn = this.player1;
        }
    }

    getPlayerTurn(){
        return this.playerTurn;
    }

    setCurrentPlayer(id){
        if(id === "1") {
            this.playerTurn = this.player1;
            console.log("check id", this.playerTurn.id)
        } else {
            this.playerTurn = this.player2;
        }
    }
}