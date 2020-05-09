class ConnectionManager {
    constructor(arena) {
        this.conn = null;
        this.arena = arena;
    }

    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.binaryType = "arraybuffer";

        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.initSession();
        });

        this.conn.addEventListener('message', event => {
            console.log('Message received', event.data);
            this.receive(event.data);
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        console.log("sess id" + sessionId);
        if (sessionId) {
            this.send([{
                type: 'join-session',
                value: sessionId
            }]);
        } else {
            this.send([{
                type: 'create-session',
            }]);
        }
    }

    send(data) {
        let finalMSG = "";
        for (let i = 0; i < data.length; i++) {
            finalMSG = finalMSG === "" ? data[i].type : finalMSG + " " + data[i].type;
            finalMSG = data[i].value === undefined ? finalMSG : finalMSG + " " + data[i].value;
        }
        let byteId = new TextEncoder().encode(finalMSG);
        console.log(`Sending message ${data} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }

    receive(data) {
        let str = this.decodeMsg(data);
        let messages = str.split(" ");
        for (let i = 0; i < messages.length; i++) {
            if (messages[i] === "session-created") {
                let value = messages[++i];
                console.log("id " + value);
                window.location.hash = value;
            }
            if (messages[i] === "time-update") {
                let value = messages[++i];
                arena.setTime(value, performance.now());
                console.log("new time" + value);
            }
        }
    }

    decodeMsg(data) {
        return new TextDecoder().decode(data);
    }
}