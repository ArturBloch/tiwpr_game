const express = require('express');
const WebSocket = require('ws');
const Session = require('./session');
const Client = require('./client');
const path = require("path");
const {v4: uuidv4} = require('uuid');
const app = express();
const performance = require('perf_hooks').performance;

const server = app.listen(3000, function () {
    console.log('My server is running on port 3000');
});

app.use(express.static(path.join(__dirname, '../public')));
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../public/index.html"));
});

const wss = new WebSocket.Server({server});
const sessions = new Map;
const clients = new Map;

updateClients();
heartbeat();

wss.on('connection', conn => {
    conn.isAlive = true;
    console.log('Connection established');
    let client = createClient(conn);
    conn.on('message', msg => {
        let decodedMsg = new TextDecoder().decode(msg);
        let messages = decodedMsg.split(" ");
        console.log("Got msg", decodedMsg);
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i++];
            client.timeOfLastMessage = performance.now();
            if (message === 'create-session') {
                createSession();
            } else if (message === 'join-session') {
                const sessionId = messages[i++];
                const session = getSession(sessionId) || createSession(sessionId);
                let value = "";
                if(session.reconnectIfPossible(client)){
                    value = session.id;
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                    sendReconnectInformation(client);
                } else if (session.isFull()) {
                    value = "Session-is-full";
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                } else {
                    if (client.name === "") {
                        client.name = generateRandomName();
                        client.send([{
                            type: 'new-name',
                            value: [client.name]
                        }]);
                    }
                    value = session.id;
                    session.join(client);
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                }
            } else if (message === 'welcome') {
                if (clients.has(messages[i])) {
                    console.log("Welcome again " + messages[i]);
                    client = clients.get(messages[i++]);
                    if(client != null){
                        client.conn = conn;
                        client.pingsUnanswered = 0;
                        client.isAlive = true;
                        console.log("Found client in a map");
                    } else {
                        createNewUser(client);
                    }
                } else {
                    createNewUser(client);
                }
            } else if (message === 'refresh-lobby-list') {
                let arr = [];
                for (const value of sessions.values()) {
                    let playerOneName = value.arena.player1.client === null ? "null" : value.arena.player1.client.name;
                    let playerTwoName = value.arena.player2.client === null ? "null" : value.arena.player2.client.name;
                    arr.push(value.id, playerOneName, playerTwoName);
                }
                arr.push("END");
                client.send([{
                    type: 'refresh-lobby-list',
                    value: arr
                }]);
            } else if (message === 'change-name') {
                client.name = messages[i++];
                client.send([{
                    type: 'new-name',
                    value: [client.name]
                }]);
            } else if (message === 'key-pressed') {
                let keyPressed = messages[i++];
                handleKeyPress(client, keyPressed);
            } else if (message === 'need-arena-info') {
                sendArenaInformation(client);
            } else if (message === 'player-moved') {
                let move = messages[i++];
                handlePlayerMove(client, move);
            } else if (message === 'ping') {
                client.send([{
                    type: 'pong',
                    value: []
                }]);
            } else if (message === 'pong') {
                client.latency = performance.now() - client.pingTime;
                client.isAlive = true;
                client.pingsUnanswered = 0;
            }
        }
    });

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        if (session != null) { // if the game didnt start yet then don't block the lobby
            try {
                session.removeClient(client);
                client.session = null;
            } catch (e) {
                console.error(e.message);
            }
        }
    });
});

function createId() {
    return uuidv4();
}

function createClient(conn, id = createId()) {
    return new Client(conn, id);
}

function generateRandomName() {
    return "player" + uuidv4().substring(0, 5);
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

function handleKeyPress(client, keyPressed) {
    let session = sessions.get(client.session.id);
    if (keyPressed === "R") {
        if (session !== null) {
            if (session.arena.player1.client !== null && client.id === session.arena.player1.client.id) {
                session.arena.player1.ready = true;
                let playerGameId = session.arena.player1.gameId;
                session.sendMsgToClients("changed-ready-status", [playerGameId, session.arena.player1.ready]);
            } else if (session.arena.player2.client !== null && client.id === session.arena.player2.client.id) {
                session.arena.player2.ready = true;
                let playerGameId = session.arena.player2.gameId;
                session.sendMsgToClients("changed-ready-status", [playerGameId, session.arena.player2.ready]);
            }
        }
    }
}

function handlePlayerMove(client, move) {
    let clientSession = sessions.get(client.session.id);
    let player1 = clientSession.arena.player1;
    let player2 = clientSession.arena.player2;
    if (player1.client.id === client.id) {
        if (clientSession.arena.movePlayer(player1, move)) {
            sendNewPlayerPosition(clientSession.differentClient(client), player1.gameId, player1.position);
        }
    } else if (player2.client.id === client.id) {
        if (clientSession.arena.movePlayer(player2, move)) {
            sendNewPlayerPosition(clientSession.differentClient(client), player2.gameId, player2.position);
        }
    }
}
function sendReconnectInformation(client){
    let clientSession = sessions.get(client.session.id);

    if(clientSession != null){
        sendArenaInformation(client);
        client.send([{
            type: 'gameTime',
            value: [clientSession.arena.gameTime]
        }]);
    }
    if(clientSession.gameStarted){
        client.send([{
            type: 'gameTime',
            value: [clientSession.arena.gameTime]
        }]);

    }
    clientSession.reconnect(client);
}
function sendArenaInformation(client) {
    let clientSession = sessions.get(client.session.id);
    if (clientSession !== null) {
        let enemyGameId = "";
        let clientGameId = "";
        if (clientSession.arena.player1.client.id === client.id) {
            clientGameId = clientSession.arena.player1.gameId;
            enemyGameId = clientSession.arena.player2.gameId;
        } else if (clientSession.arena.player2.client.id === client.id) {
            clientGameId = clientSession.arena.player2.gameId;
            enemyGameId = clientSession.arena.player1.gameId;
        }
        client.send([{
            type: 'player-ids',
            value: [clientGameId, enemyGameId]
        }]);
        clientSession.shareSessionInformation();
        clientSession.shareReadyStatus();
        sendMazeData(client, clientSession);
    }
}

function sendMazeData(client) {
    let session = client.session;
    let mazeData = []
    for (let i = 0; i < session.arena.maze.length; i++) {
        for (let j = 0; j < session.arena.maze[0].length; j++) {
            let cell = session.arena.maze[i][j];
            mazeData.push(cell.topWall ? 1 : 0);
            mazeData.push(cell.bottomWall ? 1 : 0);
            mazeData.push(cell.leftWall ? 1 : 0);
            mazeData.push(cell.rightWall ? 1 : 0);
        }
    }
    mazeData.push("END");
    client.send([{
        type: 'maze-data',
        value: mazeData
    }]);
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

function sendNewPlayerPosition(toClient, gameId, position) {
    if (toClient != null) {
        toClient.send([{
            type: 'gameId-playerPos',
            value: [gameId, position.column, position.row]
        }]);
    }
}

function removeClient(key, client) {
    if (client.session != null) {
        client.session.removeClient(client);
        client.session = null;
    }
    if(client.session != null && client.session.finished)
    clients.delete(key);
    console.log("removing client " + key);
}

function updateClients() {
    setInterval(function () {
        sessions.forEach((session, sessionId, sessions) => {
            session.update();
            let end = session.sendUpdate();
            if (end) {
                console.log("Removing " + sessionId);
                if (session.arena.player1.client != null) session.arena.player2.client.session = null;
                if (session.arena.player2.client != null) session.arena.player2.client.session = null;
                sessions.delete(sessionId);
            }
        });

    }, 500);
}

function heartbeat() {
    setInterval(function () {
        for (let [key, val] of clients) {
            if (val.isAlive === false) {
                val.pingsUnanswered++;
                if (val.pingsUnanswered >= 1) {
                    removeClient(key, val);
                    return;
                }
            }
            val.isAlive = false;
            val.pingTime = performance.now();
            console.log("SENDING PING");
            val.send([{
                type: 'ping',
                value: []
            }]);
        }
    }, 20000);
}