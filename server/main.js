const express = require('express');
const WebSocket = require('ws');
const Session = require('./session');
const Client = require('./client');
const {v4: uuidv4} = require('uuid');

const app = express();
const server = app.listen(3000, function () {
    console.log('My server is running on port 3000');
});

app.use(express.static('public'));

const wss = new WebSocket.Server({server});
const sessions = new Map;

function createId() {
    return uuidv4();
}

function createClient(conn, id = createId()) {
    return new Client(conn, id);
}

function createSession(id = createId()) {
    if (sessions.has(id)) {
        throw new Error("Session already exists");
    }

    const session = new Session(id);

    console.log("Creating session", session);

    sessions.set(id, session);

    return session;
}

function getSession(id) {
    return sessions.get(id);
}

wss.on('connection', conn => {
    console.log('Connection established');
    const client = createClient(conn);

    conn.on('message', msg => {
            let decodedMsg = new TextDecoder().decode(msg);
            let messages = decodedMsg.split(" ");
            if (messages[0] === 'create-session') {
                const session = createSession();
                session.join(client);
                client.send([{
                    type: 'session-created',
                    value: session.id
                }]);
            } else if (messages[0] === 'join-session') {
                const session = getSession(messages[1]) || createSession(messages[1]);
                session.join(client);
            }
            console.log('Sessions', sessions);
        }
    );

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        // if (session) {
        //     session.leave(client);
        //     if (session.clients.size === 0) {
        //         sessions.delete(session.id);
        //     }
        // }
    });
});


function updateClients() {
    setInterval(function () {
        sessions.forEach(function (session) {
            session.update();
            session.sendUpdate();
        });

    }, 500);
}


updateClients();