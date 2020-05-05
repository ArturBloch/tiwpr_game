const express = require('express');
const WebSocket = require('ws');
const Session = require('./session');
const Client = require('./client');

const app = express();
const server = app.listen(3000, function () {
    console.log('My server is running on port 3000');
});

app.use(express.static('public'));

const wss = new WebSocket.Server({server});
const sessions = new Map;
let startingId = 0;

wss.on('connection', conn => {
    console.log('Connection established');
    const client = new Client(conn);

    conn.on('message', msg => {
            console.log('Message received %s in Array Buffer', msg);
            let decodedMsg = new TextDecoder().decode(msg);
            console.log("Decoded msg " + decodedMsg);
            if (decodedMsg.search("create-session") !== -1) {
                const session = new Session(startingId);
                startingId++;
                session.join(client);
                sessions.set(session.id, session);
                client.send({
                    type: 'session-created',
                    id: session.id
                });
            }
        }
    );

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        if (session) {
            session.leave(client);
            if (session.clients.size === 0) {
                sessions.delete(session.id);
            }
        }
    });
});

