let miner, highper = true;
const stored_blockchain = [];

const addLine = (str) => {
    $('#terminal').append(`<div class="text-break">>>${str}</div>`);
    $("#terminalOverflow").scrollTop($("#terminal").height())
}

const sha256 = (str) => {
    const jsshaObj = new jsSHA("SHA-256", "TEXT");
    jsshaObj.update(str);
    return jsshaObj.getHash('HEX');
}

const mineTheBlock = async (block, difficult) => {
    const randomAlgorithm = $("#randomAlgorithm").is(":checked"); 
    const lowPerformance = $("#lowPerformance").is(":checked");
    const highPerformance = $("#highPerformance").is(":checked");
    highper = true;

    $('#stopButton').prop('disabled', false);
    highPerformance ? await delay(500) : null;

    let proof = 0;
    if ( highPerformance ) {
        while (true) {
            if (!highper) break;
            if (randomAlgorithm) proof = Math.floor(Math.random() * 100000000000);
            const str = typeof block.data == 'string' ? [String(block.timestamp), block.data, String(block.hash), String(block.lastHash), String(proof)].join('#') : [String(block.timestamp), JSON.stringify(block.data), String(block.hash), String(block.lastHash), String(proof)].join('#');
            const hash = sha256(str);
            if (hash.slice(0, difficult) == Array(difficult + 1).join('0')) {
                addLine(`Đào thành công Block ${hash}. Đang xác minh...`);
                socket.emit("send proof", hash, proof, wallet);
                break;
            }
            addLine(`P=${proof}:${hash} THẤT BẠI. Đang thử lại!`);
            if (!randomAlgorithm) proof++;
        }
    }
    else {
        miner = setInterval(() => {
            if (randomAlgorithm) proof = Math.floor(Math.random() * 100000000000);
            const str = typeof block.data == 'string' ? [String(block.timestamp), block.data, String(block.hash), String(block.lastHash), String(proof)].join('#') : [String(block.timestamp), JSON.stringify(block.data), String(block.hash), String(block.lastHash), String(proof)].join('#');
            const hash = sha256(str);
            if (hash.slice(0, difficult) == Array(difficult + 1).join('0')) {
                addLine(`Đào thành công Block ${hash}. Đang xác minh...`);
                socket.emit("send proof", hash, proof, wallet);
                return clearInterval(miner);
            }
            addLine(`P=${proof}:${hash} THẤT BẠI. Đang thử lại!`);
            if (!randomAlgorithm) proof++;
        }, lowPerformance ? 10 : 0);
    }
}

$(document).ready(() => {
    let connected_node = [];
    let has_blockchain = false;
    $('#blockchainNav').addClass('active');
    // Socket
    socket.on("connect fail", () => {
        $('#connectButton').prop('disabled', false);
        addLine('<span class="text-danger">Kết nối thất bại!</span>');
    })

    socket.on("connect success", (nodes) => {
        connected_node = nodes;
        addLine('<span class="text-success">Kết nối thành công!</span>');
        addLine(`Số lượng node đã kết nối: ${nodes.length}`);
        addLine('Yêu cầu thông tin blockchain... (10s)');
        socket.emit('request blockchain data');
    })

    socket.on("new miner", (address) => {
        addLine(`Tiếp nhận một yêu cầu kết nối -> Đã xác nhận`);
        connected_node.push(address);
    })

    socket.on("get blockchain data", (block, id) => {
        addLine(`Đã thêm block số ${id + 1}`);
        stored_blockchain[id] = block;
    })

    socket.on("get blockchain data done", () => {
        localStorage.blockchain = JSON.stringify(stored_blockchain);

        addLine(`Blockchain tiếp nhận có độ dài: ${stored_blockchain.length}`);
        addLine(`Độ khó block: ${Math.ceil(2 + 7 * (stored_blockchain.length / 19072004))}`);
        addLine('Đã lưu vào LocalStorage!');
        addLine('Chuẩn bị đào block tiếp theo. (3s)');
        
        has_blockchain = true;

        setTimeout(() => {
            const lastBlock = stored_blockchain[stored_blockchain.length - 1];
            mineTheBlock(lastBlock, Math.ceil(2 + 7 * (stored_blockchain.length / 19072004)));
        }, 3000);

    })

    socket.on("request blockchain data", () => {
        try{
            if (!has_blockchain) return false;
            const myChain = JSON.parse(localStorage.blockchain);
            socket.emit('get blockchain data', myChain | stored_blockchain);
        }
        catch{
            console.error;
        }
    })

    socket.on("check hash", (hash, proof, addr) => {
        if (addr == wallet) return false;
        addLine(`Một block mới đã được đào bởi: ${addr}. Đang xác minh...`)
        const _blockchain = JSON.parse(localStorage.blockchain);
        const last_block = _blockchain[_blockchain.length - 1];
        const hashed =  _blockchain.length == 1 ? sha256([String(last_block.timestamp), last_block.data, String(last_block.hash), String(last_block.lastHash), String(proof)].join('#')) : sha256([String(last_block.timestamp), JSON.stringify(last_block.data), String(last_block.hash), String(last_block.lastHash), String(proof)].join('#'));
        if (hashed == hash) {
            if (hash.slice(0, Math.ceil(2 + 7 * (stored_blockchain.length / 19072004))) !== Array(Math.ceil(2 + 7 * (stored_blockchain.length / 19072004)) + 1).join('0')) {
                addLine('<span class="text-danger">Block không hợp lệ!<span>');
                return socket.emit('vote', hash, false)
            }
            addLine('<span class="text-success">Block hợp lệ!<span>')
            socket.emit('vote', hash, true)
        }
        else {
            addLine('<span class="text-danger">Block không hợp lệ!<span>');
            socket.emit('vote', hash, false)
        }
    })

    socket.on("late proof", ()=>{
        // Cần sửa sau, chống ddos phá hoại
        addLine("Hệ thống đang xác minh một block khác. Vui lòng thử lại sau");
    })

    socket.on("block rejected", () => {
        addLine("<span class='text-danger'>Block của bạn đã bị từ chối.</span>")
    });

    socket.on('new block added', (block, addr) => {
        highper = false;
        clearInterval(miner);
        const nonstop = $("#nonStop").is(":checked")
        const hashed =  stored_blockchain.length == 1 ? sha256([String(last_block.timestamp), last_block.data, String(last_block.hash), String(last_block.lastHash), String(proof)].join('#')) : sha256([String(last_block.timestamp), JSON.stringify(last_block.data), String(last_block.hash), String(last_block.lastHash), String(proof)].join('#'));
        console.log(block.lastHash, hashed);
        if (hashed !== block.lastHash) return socket.emit('request blockchain data');
        stored_blockchain.push(block);
        addLine(`Một block mới đã được tìm ra bởi ${addr}.`);
        if (nonstop) {
            addLine('Chuẩn bị đào block tiếp theo. (3s)');
        
            setTimeout(() => {
                const lastBlock = stored_blockchain[stored_blockchain.length - 1];
                mineTheBlock(lastBlock, Math.ceil(2 + 7 * (stored_blockchain.length / 19072004)));
            }, 3000);
        }
        else {
            addLine('')
            socket.emit('quit mine', wallet)
            addLine('<span class="text-danger">Non-stop = False -> Dừng đào tại đây<span>');
            $('#connectButton').prop('disabled', false);
            $('#stopButton').prop('disabled', true);
        }
    })

    socket.emit("block approved", () => {
        addLine("<span class='text-success'>Block của bạn đã được chấp thuận.<span>")
    });

    // Event
    $('#connectButton').click(function () {
        $(this).prop('disabled', true);
        addLine('Đang tạo kết nối tới mạng P2P...');
        socket.emit("new connect", wallet);
    })

    $('#stopButton').click(function () {
        highper = false;
        socket.emit('quit mine', wallet)
        $(this).prop('disabled', true);
        $('#connectButton').prop('disabled', false);
        clearInterval(miner);
        addLine('<span class="text-danger">Đã ngắt kết nối.<span>');
    })
})