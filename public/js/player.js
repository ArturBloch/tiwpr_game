class Player {
    constructor(params) {
        this.id = params.id;
        this.name = params.name || "";
        this.gold = params.gold || 0;
    }
}