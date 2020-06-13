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
    session.arena.generate();
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
        console.log("Got msg ", decodedMsg);
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i++];
            if (message === 'create-session') {
                const session = createSession();
                // session.join(client);
                // client.send([{
                //     type: 'session-created',
                //     value: [session.id]
                // }]);
            } else if (message === 'join-session') {
                const sessionId = messages[i++];
                const session = getSession(sessionId) || createSession(sessionId);
                let value = "";
                console.log(session);
                if(session.isFull()) {
                    value = "Session-is-full";
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                } else {
                    value = sessionId;
                    session.join(client);
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                    sendMazeData(client, sessions.get(value));
                    sendPlayerInformation(client, sessions.get(value));
                    sendPlayerInformation(sessions.get(value).differentClient(client), sessions.get(value));
                }
                i++;
            } else if (message === 'welcome') {
                if (clients.has(messages[i])) {
                    console.log("Welcome again " + messages[i])
                    client = clients.get(messages[i++]);
                    client.conn = conn;
                    let clientSession = sessions.get(client.session.id);
                    sendMazeData(client, clientSession)
                    sendPlayerInformation(client, clientSession)
                } else {
                    createNewUser(client);
                }
            } else if(message === 'refresh-lobby-list'){
                console.log("REFRESH THIS? LOL.");
                let arr = [];
                console.log(sessions.values());
                for (const value of sessions.values()) {
                    let playerOneName = value.client1 === null ? "null" : value.client1.name;
                    let playerTwoName = value.client2 === null ? "null" : value.client2.name;
                    arr.push(value.id, playerOneName, playerTwoName);
                }
                arr.push("END");
                client.send([{
                    type: 'refresh-lobby-list',
                    value: arr
                }]);
            } else if(message === 'change-name'){
                client.name = messages[i++];
                client.send([{
                    type: 'new-name',
                    value: [client.name]
                }]);
            }
        }
    });

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        console.log('Sessions', sessions);
        if (session) {
            try {
                session.leave(client);
                // if (session.clients.size === 0) {
                //     sessions.delete(session.id);
                // }
            } catch (e) {
                console.error(e.message);
            }
        }
    });
});

function sendPlayerInformation(client, session){
    if(session !== null && client !== null){
        let name;
        if(session.client1.id === client.id){
            if(session.client2 === null) return;
            name = session.client2.name;
        } else {
            if(session.client1 === null) return;
            name = session.client1.name;
        }
        console.log("sending name", name);
        client.send([{
            type: 'enemy-player-name',
            value: [name]
        }]);
    }
}

function sendMazeData(client, session){
    if(session !== null){
        let mazeData = []
        console.log(session)
        for(let i = 0; i < session.arena.maze.length; i++) {
            for(let j = 0; j < session.arena.maze[0].length; j++) {
                let cell = session.arena.maze[i][j];
                mazeData.push(cell.top ? 1 : 0);
                mazeData.push(cell.bottom ? 1 : 0);
                mazeData.push(cell.left ? 1 : 0);
                mazeData.push(cell.right ? 1 : 0);
            }
        }
        mazeData.push("END");
        console.log("found his session");
        client.send([{
            type: 'maze-data',
            value: mazeData
        }]);
    }
}

function createNewUser(client) {
    let clientId = createId();
    client.id = clientId;
    clients.set(clientId, client);
    client.send([{
        type: 'client-id',
        value: [clientId]
    }]);
}

function updateClients() {
    setInterval(function () {
        sessions.forEach(function (session) {
            if(session.sessionId !== null){
                session.update();
                session.sendUpdate();
            }
        });
        // sessions.forEach(function (session) {
        //     session.update();
        //     session.sendUpdate();
        // });

    }, 500);
}


updateClients();