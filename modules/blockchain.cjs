const Transaction = require('./transaction.cjs');

const { Verifier } = require('./verification.cjs');

const { Block } = require('./block.cjs');
const genesis_block = new Block("This is the most powerful block!", "", 0, 0);
const crypto = require('crypto');
const SHA256 = msg => crypto.createHash("sha256").update(msg).digest('hex');
const { db } = require('./db.cjs');

class Blockchain {
    #data; #reward; #difficult; #transaction;
    constructor(){
        this.#data = [genesis_block];
        this.#reward = Math.floor(40 * (0.9 ** Math.floor(this.#data.length / 190704 )));
        this.#difficult = Math.ceil(2 + 7 * (this.#data.length / 19072004));
        this.#transaction = [];
    }

    get_data () {
        return this.#data.slice();
    }

    get_reward () {
        return this.#difficult;
    }

    last_block () {
        console.log(this.get_data())
        return this.#data[ this.#data.length - 1 ];
    }

    add_block (block) {
        const data = this.get_data();
        data.push(block);
        this.#data = data;
    }

    async add_block_save (block, addr) {
        console.log("Thêm phần thưởng vào danh sách đào");
        const reward = new Transaction(process.env.MINE_ADDRESS, addr, this.#reward, 0, 'Mining reward');
        const trans = Transaction.load_max();

        block.data = [];
        block.data.push(reward);
        for (let tran in trans) {
            const tran_verify = new Transaction(tran.sender, tran.received, tran.amount, tran.fee, tran.sign);
            if (!tran_verify.verify()) continue;
            block.data.push(tran);
        }
        const data = this.get_data();
        data.push(block);
        this.#data = data;
        await this.save();
    }
    
    verify_proof (proof) {
        const block = this.last_block();
        const hash = SHA256([ String(block.timestamp), JSON.stringify(block.data), String(block.lastHash), String(block.hash)].join('$') + String(proof));
        if (hash.slice(0, this.#difficult) == Array(this.#difficult + 1).join("0")) return true;
        return false;
    }

    async get_balance(address){
        let [spent, received] = [0, 0];
        await this.load();
        const [ spent_queue ] = await db.execute('SELECT amount FROM transactions WHERE sender = ?', [address]);
        const [ received_queue ] = await db.execute('SELECT amount FROM transactions WHERE receiver = ?', [address]);
        const [ spent_prcd, received_prcd ] = [spent_queue.reduce((a, b) => a + b, 0), received_queue.reduce((a, b) => a + b, 0)]
        const _blockchain = this.get_data();
        for (let i = 0; i < _blockchain.length; i++) {
            if (i == 0) continue;
            for (let transaction of _blockchain[i].data) {
                if (transaction.sender == address) spent += transaction.amount;
                if (transaction.receiver == address) received += transaction.amount;
            }
        }
        return received + spent_prcd - ( received_prcd + spent );
    }

    async load() {
        const [blocks] = await db.execute('SELECT * FROM blockchain ORDER BY `order` ASC');
        if (!blocks.length) return this.save();
        const temp_chain = [];
        for (let i = 0; i < blocks.length; i++) {
            let temp_block;
            if (i == 0) {
                temp_block = new Block(blocks[i].data, blocks[i].lasthash, blocks[i].proof, blocks[i].timestamp);
            }
            else{
                temp_block = new Block(JSON.parse(blocks[i].data), blocks[i].lasthash, blocks[i].proof, blocks[i].timestamp);
            }
            temp_chain.push(temp_block);
        }
        this.#data = temp_chain;
        console.log('afterload :', this.#data);
        return temp_chain;
    }

    async save () {
        console.log("Lưu chain mới vào hệ thống...");
        console.log("This.getdata: " , this.get_data())
        if (!Verifier.verifyBlockchain(this.get_data())) return false;
        await db.execute('TRUNCATE TABLE blockchain');
        const chain = this.get_data();
        for (let i = 0; i < chain.length; i++) {
            if (i == 0) await db.query('INSERT INTO blockchain (timestamp, data, hash, lasthash, proof) VALUES (?, ?, ?, ?, ?)', [chain[i].timestamp, chain[i].data, chain[i].hash, chain[i].lastHash, chain[i].proof]);
            else await db.query('INSERT INTO blockchain (timestamp, data, hash, lasthash, proof) VALUES (?, ?, ?, ?, ?)', [chain[i].timestamp, JSON.stringify(chain[i].data), chain[i].hash, chain[i].lastHash, chain[i].proof]);
        }
        return true;
    }
}

module.exports =  { Blockchain };