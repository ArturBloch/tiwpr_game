const express = require('express');
const WebSocket = require('ws');
const Session = require('./session');
const Client = require('./client');
const {v4: uuidv4} = require('uuid');
const session = require('express-session')
const app = express();


const server = app.listen(3000, function () {
    console.log('My server is running on port 3000');
});

app.use(express.static('public'));

const wss = new WebSocket.Server({server});
const sessions = new Map;
const clients = new Map;

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
    let client = createClient(conn);
    conn.on('message', msg => {
            let decodedMsg = new TextDecoder().decode(msg);
            let messages = decodedMsg.split(" ");
            for (let i = 0; i < messages.length; i++) {
                if (messages[i] === 'create-session') {
                    const session = createSession();
                    session.join(client);
                    client.send([{
                        type: 'session-created',
                        value: session.id
                    }]);
                } else if (messages[i] === 'join-session') {
                    const session = getSession(messages[1]) || createSession(messages[1]);
                    session.join(client);
                } else if (messages[i] === 'welcome-again') {
                    if (clients.has(messages[i+1])) {
                        client = clients.get(messages[++i]);
                        client.conn = conn;
                    } else {
                        createNewUser(client);
                    }
                } else if (messages[i] === 'welcome') {
                    createNewUser(client);
                }
            }
            console.log('Sessions', sessions);
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


function createNewUser(client) {
    let clientId = createId();
    client.id = clientId;
    clients.set(clientId, client);
    client.send([{
        type: 'client-id',
        value: clientId
    }]);
}

function updateClients() {
    setInterval(function () {
        sessions.forEach(function (session) {
            session.update();
            session.sendUpdate();
        });

    }, 500);
}


updateClients();