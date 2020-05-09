class Arena {
    constructor() {
        this.timer = 5;
        this.prevTime = 0;
        this.player1 = {};
        this.player2 = {};
    }

    update(nowTime) {
        this.timer = (this.timer - (nowTime - this.prevTime) / 1000);
        if(this.timer < 0){
            this.timer += 5;
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
}

try {
    module.exports = exports = Arena;
} catch (e) {}