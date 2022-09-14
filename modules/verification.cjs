const crypto = require('crypto');
const SHA256 = msg => crypto.createHash("sha256").update(msg).digest('hex');

class Verifier {
    static notAuthPass(req, res, next, dir="/") {
        if (req.session.loggedIn) {
            res.redirect(dir);
        }
        else{
            next()
        }
    }

    static authPass(req, res, next, dir="/login") {
        if (!req.session.loggedIn) {
            res.redirect(dir);
        }
        else{
            next()
        }
    }

    static hashBlock(block, proof) {
        try {
            if (typeof block.data == 'string') return SHA256([String(block.timestamp), block.data, String(block.hash), String(block.lastHash), String(proof)].join('#'))
            return SHA256([String(block.timestamp), JSON.stringify(block.data), String(block.hash), String(block.lastHash), String(proof)].join('#'))
        }
        catch {
            console.error;
            return null;
        }
    }

    static verifyBlockchain(blockchain_data) {
        try {
            for (let i = 0; i < blockchain_data.length; i++) {
                if (i == 0) continue;
                if (blockchain_data[i].lastHash !== this.hashBlock(blockchain_data[i - 1], blockchain_data[i].proof)) return false;
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    static verifyKeypair(private_hex, public_hex) {
        try {
            const private_key = crypto.createPrivateKey({
                'key': Buffer.from(private_hex, 'hex'),
                'format': "der",
                'type': "pkcs8",
                'passphrase': process.env.PASSPHRASE, 
            });
    
            const public_key = crypto.createPublicKey({
                'key': Buffer.from(public_hex, 'hex'),
                'format': 'der',
                'type': "spki",
            });

            const str = "Một chuỗi ngẫu NHIên được sử dụng để kiểm tra key"
    
            const signature = crypto.sign('sha256', str, { key: private_key });

            return crypto.verify('sha256', str, { key: public_key }, signature);
    
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}

module.exports = { Verifier };