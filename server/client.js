class Client {
    constructor(conn, id) {
        this.conn = conn;
        this.conn.binaryType = "arraybuffer";
        this.id = id;
        this.session = null;
    }

    send(msg) {
        let finalMsg = msg[0].type + " " + msg[0].value;
        for (var i = 1; i < msg.length; i++) {
            finalMsg = finalMsg + " " + msg[i].type + " " + msg[i].value;
        }
        let byteId = new TextEncoder().encode(finalMsg);
        console.log(`Sending message ${msg} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }
}

module.exports = Client;