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
    conn.on('pong', () => {
        console.log("Got Pong");
        conn.isAlive = true;
    });
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
                if (session.isFull()) {
                    value = "Session-is-full";
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                } else {
                    value = session.id;
                    session.join(client);
                    client.send([{
                        type: 'session-join-result',
                        value: [value]
                    }]);
                }
                i++;
            } else if (message === 'welcome') {
                if (clients.has(messages[i])) {
                    console.log("Welcome again " + messages[i])
                    client = clients.get(messages[i++]);
                    client.conn = conn;
                } else {
                    createNewUser(client);
                }
            } else if (message === 'refresh-lobby-list') {
                let arr = [];
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
                console.log("client latency ", client.latency)
            }
        }
    });

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        if (session) {
            try {
                session.leave(client);
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
                session.sendMsgToClients("changed-ready-status", [playerGameId, 1]);
            } else if (session.arena.player2.client !== null && client.id === session.arena.player2.client.id) {
                session.arena.player2.ready = true;
                let playerGameId = session.arena.player2.gameId;
                session.sendMsgToClients("changed-ready-status", [playerGameId, 1]);
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

function sendArenaInformation(client) {
    let clientSession = sessions.get(client.session.id);
    if (clientSession !== null) {
        sendPlayerGameIds(client);
        sendPlayerInformation(client);
        sendPlayerInformation(sessions.get(clientSession.id).differentClient(client));
        sendMazeData(client, clientSession);
    }
}

function sendPlayerGameIds(client) {
    let session = client.session;
    let clientGameId;
    let enemyGameId;
    if (session.arena.player1.client.id === client.id) {
        enemyGameId = session.arena.player2.gameId;
        clientGameId = session.arena.player1.gameId;
    } else if (session.arena.player2.client.id === client.id) {
        enemyGameId = session.arena.player1.gameId;
        clientGameId = session.arena.player2.gameId;
    }
    client.send([{
        type: 'player-game-ids',
        value: [clientGameId, enemyGameId]
    }]);
}

function sendPlayerInformation(client) {
    if (client !== null) {
        let name;
        let gameId;
        let session = client.session;
        if (session.arena.player1.client.id === client.id) {
            if (session.client2 === null) return;
            name = session.arena.player2.client.name;
            gameId = session.arena.player2.gameId;
        } else if (session.arena.player2.client.id === client.id) {
            if (session.client1 === null) return;
            name = session.arena.player1.client.name;
            gameId = session.arena.player1.gameId;
        }
        client.send([{
            type: 'playerGameId-newName',
            value: [gameId, name]
        }]);
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
    toClient.send([{
        type: 'gameId-playerPos',
        value: [gameId, position.column, position.row]
    }]);
}

function updateClients() {
    setInterval(function () {
        sessions.forEach((session, sessionId, sessions) => {
            session.update();
            let end = session.sendUpdate();
            if (end) {
                console.log("Removing " + sessionId);
                session.client1.session = null;
                session.client2.session = null;
                sessions.delete(sessionId);
            }
        });

    }, 500);
}

function heartbeat() {
    setInterval(function () {
        for (let [key, val] of clients) {
            if (val.isAlive === false) {
                clients.delete(key);
            }
            val.isAlive = true;
            val.pingTime = performance.now();
            console.log("SENDING PING");
            val.send([{
                type: 'ping',
                value: []
            }]);
        }
    }, 30000);
}