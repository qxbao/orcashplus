const { Block } = require('./block.cjs');
const { Blockchain } = require('./blockchain.cjs');
const { Verifier } = require('./verification.cjs');

const crypto = require('crypto'), SHA256 = msg => crypto.createHash("sha256").update(msg).digest('hex');

const getLongestChain = (socket) => {
    console.log("Tìm kiếm block dài nhất...");
    const longestChain = new Blockchain().get_data();
    socket.emit("request blockchain data");
    socket.on("get blockchain data", (chain) => {
        if (!Array.isArray(chain)) return false;
        if (Verifier.verifyBlockchain(chain) && chain.length > longestChain.length) {
            if (chain[0].hash !== longestChain[0].hash) return false;
            longestChain = chain;
            const _blockchain = new Blockchain();
            let _block;
            for (let i = 0; i < chain.length; i++) {
                _block = new Block(chain[i].data, chain[i].lastHash, chain[i].proof, chain[i].timestamp);
                _blockchain.add_block(_block);
            }
            _blockchain.save();
        }
    })
}

const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

const ioHandler = (io) => {
    const newBlockFound = async (socket, hash, proof, addr) => {
        const new_block = new Block([], hash, proof);
        const chain = new Blockchain();
        await chain.load();
        console.log("Thêm block mới vào hệ thống");
        chain.add_block_save(new_block, addr);
        const res = new Blockchain().last_block();
        console.log("Gửi block mới cho các node");
        socket.emit("block approved");
        io.to("active_miner").emit('new block added' , res, addr);
    }

    let proofQueue = [];
    let active_miner = {};
    io.on("connection", (socket) => {
        socket.on("new connect", (address) => {
            if (!address) return;
            if (!active_miner.hasOwnProperty(address)) {
                console.log(`Thợ mỏ ${address.slice(0, 50)}... vừa tham gia vào mạng P2P`)
                socket.wallet = address;
                io.to('active_miner').emit('new miner', address);
                socket.join('active_miner');
                socket.emit('connect success', Object.keys(active_miner));
                active_miner[address] = socket.id;
            }
            else {
                socket.emit('connect fail');
            }
        });

        socket.on("request blockchain data", async () => {
            console.log('Một node vừa yêu cầu blockchain data');
            socket.broadcast.emit("request blockchain data");
            let longestChain = await (new Blockchain()).load()
            setTimeout(() => {
                for (let i = 0; i < longestChain.length; i++) {
                    socket.emit("get blockchain data", longestChain[i], i);
                }
                console.log('Gửi thành công data.');
                socket.emit("get blockchain data done")
            // đổi lại 10k
            }, 5000);

            socket.on("get blockchain data", (chain) => {
                console.log('Một node vừa gửi blockchain mới. Đang kiểm tra độ dài');

                if (!Array.isArray(chain)) return false;
                if (Verifier.verifyBlockchain(chain) && chain.length > longestChain.get_data().length) {
                    if (chain[0].hash !== longestChain.get_data()[0].hash) return false;
                    longestChain = chain;
                    const _blockchain = new Blockchain();
                    let _block;
                    for (let i = 0; i < chain.length; i++) {
                        _block = new Block(chain[i].data, chain[i].lastHash, chain[i].proof, chain[i].timestamp);
                        _blockchain.add_block(_block);
                    }
                    _blockchain.save();
                }
            })
        })

        socket.on("send proof", async (hash, proof, wallet) => {
            console.log(`Thợ mỏ ${wallet.slice(0,50)}... vừa gửi một block mới.`);
            if (proofQueue.length) {
                console.log(`Đang xử lý một block khác. Bỏ qua`);
                return socket.emit("late proof");
            }
            console.log(`Gửi block cho các node kiểm tra`);
            proofQueue.push(wallet);
            socket.broadcast.emit("check hash", hash, proof, wallet);
            let [accept, decline] = [0, 0];
            getLongestChain(socket);
            delay(4000);

            setTimeout(async() => {
                if (accept > decline) {
                    // Trao thưởng, gửi block mới cho toàn hệ thống
                    // Ask for transaction
                    console.log(`Số lượng người chấp thuận lớn hơn, block qua kiểm duyệt.`);
                    await newBlockFound(socket, hash, proof, wallet);
                }
                else if (accept < decline) {
                    // Từ chối block
                    console.log(`Block bị số đông từ chối.`);
                    socket.emit("block rejected");
                } else {
                    // Hòa
                    console.log(`Tỉ lệ vote là 50-50, server trở thành node quyết định`);
                    const _blockchain = await (new Blockchain()).load();
                    const last_block = _blockchain.last_block();
                    if (hash !== Verifier.hashBlock(last_block, proof)) {
                        // Trao thưởng, gửi block mới cho toàn hệ thống
                        // Ask for transaction
                        console.log(`Block hợp lệ.`);
                        await newBlockFound(socket, hash, proof, wallet);
                    }
                    else {
                        console.log(`Block không qua được kiểm tra`);
                        socket.emit("block rejected");
                    }
                }
                console.log(`Erase proofqueue`);
                proofQueue = [];
            }, 10000);
            socket.on("vote", (hash2, ok) => {
                if (hash2 !== hash) return false;
                console.log(`Nhận một lượt ${ok ? 'chấp thuận' : 'từ chối'}`);
                if (ok) accept++;
                else decline++;
            });
        });

        socket.on('quit mine', wallet => {
            console.log(`Thợ mỏ ${ wallet.slice(0, 50) } vừa thoát.`);
            delete active_miner[wallet];
        })

        socket.on("check node", () => {
            const quantity = Object.keys(active_miner).length;
            socket.emit("node quantity", quantity);
        })

        socket.on("disconnecting", () => {
            if (active_miner[socket.wallet] == socket.id) delete active_miner[socket.wallet];
            socket.leave("active_miner");
        })
    });
}

process.on("uncaughtException", err => console.error(err));
module.exports = { ioHandler };