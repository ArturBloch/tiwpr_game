class ConnectionManager {
    constructor() {
        this.conn = null;
    }

    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.binaryType = "arraybuffer";

        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.send('create-session');
        });

        this.conn.addEventListener('message', event => {
            console.log('Message received', event.data);
            let str = new TextDecoder().decode(event.data);
            console.log(str);
        });
    }

    send(data) {
        const msg = new TextEncoder().encode(data);
        console.log(`Sending msg {msg} in byteArray ` + msg);
        this.conn.send(msg);
    }
}