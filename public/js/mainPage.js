const ConnManager = require('./connectionManager');
const connectionManager = new ConnManager();

connectionManager.connect('ws://localhost:3000/index');

const createLobbyButton = document.getElementById('createLobby');
const refreshLobbyButton = document.getElementById('refreshLobby');
const changeNameButton = document.getElementById('changeName');
const nameForm = document.getElementById('nameForm');
const lobbyTBody = document.getElementById('lobbyTBody');
nameForm.value = connectionManager.storedName;

connectionManager.events.listen('change-name', name => {
    nameForm.value = name;
});

connectionManager.events.listen('join-session-response', response => {
    if(response === "Session-is-full"){
        alert("Session is Full");
        return;
    } else {
        console.log(response);
        let url = 'room.html';
        let hash = '#' + response;
        window.location.href = url + hash;
    }
});

connectionManager.events.listen('refresh-lobby-list', data => {
    lobbyTBody.innerHTML = '';
    let i = 0;
    while(i < data.length - 1){
        let tr = document.createElement("tr");
        let id = data[i];
        let firstPlayer = data[i+1];
        let secondPlayer = data[i+2];
        tr.onclick = function() { return new function () {
            connectionManager.joinSession(id);
        };};
        let lobbyNumber = document.createElement("td");
        let playersInLobby = document.createElement("td");
        let firstPlayerCell = document.createElement("td");
        let secondPlayerCell = document.createElement("td");
        let numberOfPlayers = 0;
        if(firstPlayer !== "null"){
            firstPlayerCell.textContent = firstPlayer;
            numberOfPlayers++;
        }
        if(secondPlayer !== "null"){
            secondPlayerCell.textContent = secondPlayer;
            numberOfPlayers++;
        }
        lobbyNumber.textContent = i/3;
        playersInLobby.textContent = numberOfPlayers + " / 2";
        firstPlayerCell.textContent = firstPlayer === "null" ? "" : firstPlayer;
        secondPlayerCell.textContent = secondPlayer === "null" ? "" : secondPlayer;
        tr.appendChild(lobbyNumber);
        tr.appendChild(playersInLobby);
        tr.appendChild(firstPlayerCell);
        tr.appendChild(secondPlayerCell);
        lobbyTBody.appendChild(tr);
        i = i + 3;
    }
});

createLobbyButton.addEventListener('click', function() {
    connectionManager.initSession();
});

refreshLobbyButton.addEventListener('click', function() {
    connectionManager.getLobbyList();
});

changeNameButton.addEventListener('click', function() {
    connectionManager.changeName(nameForm.value);
});