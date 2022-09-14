const { Block } = require('./block.cjs');
const { Blockchain } = require('./blockchain.cjs');
const { Verifier } = require('./verification.cjs');

const crypto = require('crypto'), SHA256 = msg => crypto.createHash("sha256").update(msg).digest('hex');
let [accept, decline] = [0,0];

// Tìm chuỗi khối dài nhất hợp lệ trong tất cả các nodes 
const getLongestChain = (socket) => {
    console.log("Tìm kiếm chuỗi dài nhất...");
    let longestChain = new Blockchain().load();

    socket.emit("request blockchain data");
    
    socket.on("get blockchain data", (chain) => {
        if (!Array.isArray(chain)) return false;
        if (Verifier.verifyBlockchain(chain) && chain.length > longestChain.length) {
            if (chain[0].hash !== longestChain[0].hash) return false;
            
            const _blockchain = new Blockchain();

            for (let i = 0; i < chain.length; i++) {
                // Bỏ qua block 0 - tránh lặp 2 lần genesis block
                if (i == 0) continue;
                const _block = new Block(chain[i].data, chain[i].lastHash, chain[i].proof, chain[i].timestamp);
                _blockchain.add_block(_block);
            }

            longestChain = chain;
            _blockchain.save();
        }
    })
}

const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

const newBlockFound = async (io, hash, proof, addr) => {
    const new_block = new Block([], hash, proof);
    const chain = new Blockchain();
    await chain.load();

    console.log("Thêm block mới vào hệ thống");
    chain.add_block_save(new_block, addr).then(async () => {
        const res = new Blockchain();
        await res.load();
        console.log('Chuỗi mới : ', res.get_data())
        console.log("Gửi block mới cho các node...");
        io.to("active_miner").emit('new block added' , res.last_block(), addr);
    });
}

const ioHandler = (io) => {
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
            console.log(`${socket.id} yêu cầu nhận dữ liệu Blockchain`);

            socket.broadcast.emit("request blockchain data");
            let longestChain = await new Blockchain().load();

            socket.on("get blockchain data", (chain) => {
                console.log('Một node vừa gửi một chuỗi mới. Đang so sánh độ dài');

                if (!Array.isArray(chain)) return false;
                if (Verifier.verifyBlockchain(chain) && chain.length > longestChain.length) {
                    // --> Thêm sau >> Kiểm tra giao dịch hợp lệ hay không;
                    if (chain[0].hash !== longestChain[0].hash) return false;
                    console.log('Chuỗi vừa nhận hợp lệ. Nhập chuỗi vào hệ thống.');
                    longestChain = chain;
                    const _blockchain = new Blockchain();
                    for (let i = 0; i < chain.length; i++) {
                        const _block = new Block(chain[i].data, chain[i].lastHash, chain[i].proof, chain[i].timestamp);
                        _blockchain.add_block(_block);
                    }
                    _blockchain.save();
                }
            })

            // Sau 5 giây, gửi chuỗi dài nhất lại cho requester
            await delay(5000);
            for (let i = 0; i < longestChain.length; i++) {
                socket.emit("get blockchain data", longestChain[i], i);
            }
            console.log('Đã gửi blockchain theo yêu cầu');
            socket.emit("get blockchain data done");
        })

        socket.on("send proof", async (hash, proof, wallet) => {
            console.log(`Thợ mỏ xxx${wallet.slice(50, 100)}xxx vừa gửi một block mới.`);
            if (proofQueue.length) {
                console.log(`Một block khác đang được xử lý. Pass`);
                return socket.emit("late proof");
            }
            console.log(`Gửi Block vừa nhận cho các node`);
            // Thêm người gửi block vào queue => Không nhận các block khác
            proofQueue.push(wallet);
            
            socket.broadcast.emit("check hash", hash, proof, wallet);
            [accept, decline] = [0, 0];
            getLongestChain(socket);

            await delay(5000)

            if (accept > decline) {
                console.log(`Số lượng người chấp thuận lớn hơn, block qua kiểm duyệt.`);
                await newBlockFound(io, hash, proof, wallet);
            }
            else if (accept < decline) {
                console.log(`Block bị số đông từ chối.`);
                socket.emit("block rejected");
            } 
            else {
                console.log(`Tỉ lệ vote là 50-50, server trở thành node quyết định`);
                const _blockchain = new Blockchain();
                await _blockchain.load();
                const last_block = _blockchain.last_block();
                if (hash == Verifier.hashBlock(last_block, proof)) {
                    console.log(`Block hợp lệ.`);
                    await newBlockFound(io, hash, proof, wallet);
                }
                else {
                    console.log(`Block không hợp lệ.`);
                    socket.emit("block rejected");
                }
            }

            console.log(`Xóa hàng đợi`);
            proofQueue = [];
        });

        socket.on("vote", (wallet, ok) => {
            if (!proofQueue.length) return false;
            if (wallet !== proofQueue[0]) return; 
            console.log(`Nhận một lượt ${ok ? 'chấp thuận' : 'từ chối'}`);
            if (ok) accept++;
            else decline++;
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