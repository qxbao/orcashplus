const crypto = require('crypto');
const { db } = require('./db.cjs');

class Transaction {
    constructor(sender, receiver, amount, fee, signature) {
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.fee = fee;
        this.signature = signature;
    }

    verify () {
        if (this.sender == process.env.MINE_ADDRESS) return true;
        const data = String(this.sender) + String(this.receiver) + String(this.amount);
        const public_key = crypto.createPublicKey({
            'key': Buffer.from(this.sender, 'hex'),
            'format': 'der',
            'type': "spki",
        });
        return crypto.verify('sha256', data , { key: public_key }, Buffer.from(this.signature, 'hex'));
    }

    save () {
        if (!this.verify) return false;
        db.query("INSERT INTO transactions(sender, receiver, amount, fee, sign) VALUE(?, ?, ?, ?, ?)", [this.sender, this.receiver, this.amount, this.fee, this.signature]);
        return true;
    }

    static load_max() {
        db.query("SELECT * FROM transactions ORDER BY fee DESC LIMIT 10").then(data => {
            if (!data[0].length) return [];
            return data[0];
        });
    }

    static load_all() {
        db.query("SELECT * FROM transactions").then(data => {
            if (!data[0].length) return null;
            return data[0];
        });
    }
}

module.exports = Transaction;