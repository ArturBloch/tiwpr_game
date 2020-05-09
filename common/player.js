class Player {
    constructor({id = 0, name = "", gold = 0} = {}) {
        this.id = id;
        this.name = name;
        this.gold = gold;
        this.arena = {};
    }
}

try {
    module.exports = exports = Player;
} catch (e) {}