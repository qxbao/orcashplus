import { Router } from "express";
import crypto from 'crypto';
const router = Router();
import { Verifier } from "../modules/verification.cjs";
import {default as Transaction}  from "../modules/transaction.cjs";
import { io } from "../modules/io.cjs";
import pkg  from "../modules/blockchain.cjs";
const {Blockchain} = pkg;

router.use(Verifier.authPass);

router.get('/balance', async (req, res) => {
    const balance = await new Blockchain().get_balance(req.session.wallet_address); 
    res.send({orc: balance});
})

router.post('/make_transaction', (req, res, next) => {
    const amount = req.query.amount;
    const fee = req.query.fee;
    const receiver = req.query.receiver;
    if (amount == 0 || receiver == req.session.wallet_address) {
        return res.send({success: false});
    }
    if (Number(amount) == NaN || Number(fee) == NaN || typeof receiver != 'string') {
        return res.send({success: false});
    }
    else{
        if (receiver.length !== 188) return res.send({success: false});
        next();
    }
} , async(req, res) => {
    const amount = req.query.amount;
    const receiver = req.query.receiver;
    const sender = req.session.wallet_address;
    const fee = req.query.fee;

    const data = String(sender) + String(receiver) + String(amount);
    const private_key = crypto.createPrivateKey({
        'key': Buffer.from(req.session.private_key, 'hex'),
        'format': "der",
        'type': "pkcs8",
        'passphrase': process.env.PASSPHRASE, 
    });
    const signature = crypto.sign('sha256', data, { key: private_key });
    const contract = new Transaction(sender, receiver, amount, fee, signature.toString('hex'));
    if (contract.verify()) {
        const balance = await new Blockchain.get_balance(sender);
        if (balance < (amount + fee)) return res.send({success: false});
        contract.save();
        return res.send({success: true});
    } else {
        return res.send({success: false});
    }
});

export { router };