const Arena = require('./../common/arena');
const Client = require('./client');
const performance = require('perf_hooks').performance;
const WebSocket = require('ws');

class Session {
    constructor(id) {
        this.id = id;
        this.clients = new Set;
        this.arena = new Arena();
    }

    join(client) {
        if (client.session) {
            throw new Error('Client already in session');
        }
        if (Object.keys(this.arena.player1).length === 0) {
            this.arena.player1 = client;
            this.clients.add(client);
            client.session = this;
        } else if (Object.keys(this.arena.player2).length === 0) {
            this.arena.player2 = client;
            this.clients.add(client);
            client.session = this;
        }
        if(client.id === this.arena.player1.id || client.id === this.arena.player2.id){
            this.reconnectClient();
        } else {
            console.log("Session full");
        }
    }

    reconnectClient(){
        console.log("WOOOW");
    };

    leave(client) {
        if (client.session !== this) {
            throw new Error('Client not in session');
        }
        this.clients.delete(client);
        client.session = null;
    }

    update() {
        this.arena.update(performance.now());
        console.log(this.arena.timer);
    }

    sendUpdate() {
        this.arena.player1.send([{
            type: 'time-update',
            value: this.arena.timer,
        }]);
        if (Object.keys(this.arena.player2).length !== 0 && this.arena.player2.conn.readyState !== WebSocket.CLOSED) {
            this.arena.player2.send([{
                type: 'time-update',
                value: this.arena.timer,
            }]);
        }
    }
}

module.exports = Session;