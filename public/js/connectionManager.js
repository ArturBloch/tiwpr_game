const Arena = require('../../common/arena');
const Events = require('../../common/events');

module.exports = class ConnectionManager {
    constructor() {
        this.storedId = localStorage.getItem("id");
        this.storedName = localStorage.getItem("name");
        this.conn = null;
        this.events = new Events();
        this.arena = new Arena();
        this.id = "";
    }

    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.binaryType = "arraybuffer";

        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.initializeConnection();
        });

        this.conn.addEventListener('message', event => {
            this.receive(event.data);
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        console.log("sess id" + sessionId);
        if (sessionId) {
            this.joinSession(sessionId);
        } else {
            this.send([{
                type: 'create-session',
                value: []
            }]);
        }
    }

    joinSession(sessionId){
        this.send([{
            type: 'join-session',
            value: [sessionId]
        }]);
    }

    send(data) {
        let finalMSG = "";
        for (let i = 0; i < data.length; i++) {
            finalMSG = finalMSG === "" ? data[i].type : finalMSG + " " + data[i].type;
            for (let j = 0; j < data[i].value.length; j++) {
                finalMSG = data[i].value[j] === undefined ? finalMSG : finalMSG + " " + data[i].value[j];
            }
        }
        let byteId = new TextEncoder().encode(finalMSG);
        console.log(`Sending message ${finalMSG} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }

    receive(data) {
        let str = this.decodeMsg(data);
        console.log("message received", str);
        let messages = str.split(" ");
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i++];
            if (message === "time-update") {
                this.arena.setTime(messages[i++], performance.now());
                // console.log("new time" + this.arena.timer);
            }
            if (message === "current-player") {
                let value = messages[i++];
                this.arena.setCurrentPlayer(value)
                console.log("update player ", value)
                // console.log("player turn" + this.arena.currentPlayer.name);
            }
            if (message=== "client-id") {
                let value = messages[i++];
                localStorage.setItem("id", value);
                // console.log("my id " + this.id);
            }
            if (message === "new-name") {
                let value = messages[i++];
                localStorage.setItem("name", value);
                this.events.emit('change-name', value);
                // console.log("my id " + this.id);
            }
            if(message === "refresh-lobby-list"){
                let arr = [];
                console.log("ARRAY", arr);
                while(messages[i] !== "END"){
                    arr.push(messages[i++]);
                }
                console.log("ARRAY", arr);
                this.events.emit('refresh-lobby-list', arr);
            }
            if (message === "session-join-result") {
                let response = messages[i++];
                this.events.emit('join-session-response', response);
                // console.log("my id " + this.id);
            }
        }
    }

    decodeMsg(data) {
        return new TextDecoder().decode(data);
    }

    initializeConnection(){
        let message = this.storedId === null ? "noId" : this.storedId;
        console.log("my id is " + this.storedId);
        this.send([{
            type: 'welcome',
            value: [message],
        }]);
        if(this.storedName !== null){
            this.changeName(this.storedName);
        }
    }

    getLobbyList() {
        this.send([{
            type: 'refresh-lobby-list',
            value: []
        }]);
    }

    changeName(newName) {
        this.send([{
            type: 'change-name',
            value: [newName]
        }]);
    }
}