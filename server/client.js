module.exports = class Client {
    constructor(conn, id) {
        this.conn = conn;
        this.conn.binaryType = "arraybuffer";
        this.session = null;
        this.id = id;
    }

    send(msg) {
        let finalMsg = msg[0].type + " " + msg[0].value;
        for (let i = 1; i < msg.length; i++) {
            finalMsg = finalMsg + " " + msg[i].type + " " + msg[i].value;
        }
        let byteId = new TextEncoder().encode(finalMsg);
        console.log("Sending message " + finalMsg + " in array " + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed lost connection!', conn.id);
            }
        });
    }
}