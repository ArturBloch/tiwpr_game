class Client {
    constructor(conn) {
        this.conn = conn;
        this.conn.binaryType = "arraybuffer";
        this.session = null;
    }

    send(msg) {
        let byteId = new TextEncoder().encode(msg);
        console.log(`Sending message ${msg} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }
}

module.exports = Client;