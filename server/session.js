const Arena = require('./../common/arena');
const performance = require('perf_hooks').performance;
const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');

class Session {
    constructor(id) {
        this.id = id;
        this.arena = new Arena();
        this.arena.player1.gameId = uuidv4();
        this.arena.player2.gameId = uuidv4();
        this.client1 = null;
        this.client2 = null;
    }

    join(client) {
        console.log("client joining");
        console.log(client.session);
        if (client.session) {
            console.error('Client already in session');
        } else {
            if(this.client1 === null){
                console.log("added client 1");
                this.client1 = client;
                this.arena.player1.client = client;
                client.session = this;
                return;
            } else if(this.client2 === null){
                console.log("added client 2");
                this.client2 = client;
                this.arena.player2.client = client;
                client.session = this;
                console.log(this)
                return;
            }
        }
        if((this.client1 !== null && client.id === this.client1.id) || (this.client2 !== null && client.id === this.client2.id)){
            this.reconnectClient();
        } else {
            console.log("Session full or user belongs to other session");
        }
    }

    reconnectClient(){
        console.log("Client Reconnected");
    }

    leave(client) {
        if (client.session !== this) {
            throw new Error('Client not in session');
        }
        this.clients.delete(client);
        client.session = null;
    }

    update() {
        this.arena.update(performance.now());
    }

    sendUpdate() {
        this.timerUpdates()
    }

    differentClient(client) {
        if(client.id === this.client1.id)
            return this.client2;
        if(client.id === this.client2.id)
            return this.client1;
        return null;
    }

    timerUpdates(){
        if (this.playerConnectionReady(this.client1)) {
            console.log("P1 ready");
            this.client1.send([{
                type: 'time-update',
                value: [this.arena.timer]
            }]);
        }
        if (this.playerConnectionReady(this.client2)) {
            console.log("P2 ready");
            this.client2.send([{
                type: 'time-update',
                value: [this.arena.timer]
            }]);
        }
    }

    isFull(){
        const isFull = this.client1 !== null && this.client2 !== null;
        console.log("IS FULL? ", isFull);
        return isFull;
    }

    playerConnectionReady(client){
        if(client !== null && client !== undefined && client.conn.readyState !== WebSocket.CLOSED){
            return true;
        }
        return false;
    }
}

module.exports = Session;