const crypto = require('crypto'), SHA256 = msg => crypto.createHash("sha256").update(msg).digest('hex');

class Block {
    constructor(data, lastHash, proof, timestamp = (new Date()).getTime()) {
        this.data = data;
        this.timestamp = timestamp;
        this.hash = this.get_hash();
        this.lastHash = lastHash;
        this.proof = proof;
    }

    get_hash() {
        return SHA256([ String(this.timestamp), JSON.stringify(this.data), String(this.lastHash) ].join('$'))
    }
}

module.exports = { Block }