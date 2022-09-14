import { Router } from "express";
const router = Router();
import crypto from 'crypto';
const SHA256 = str => crypto.createHash("sha256").update(str).digest('hex');
import { Verifier } from '../modules/verification.cjs';

router.use(Verifier.notAuthPass);

router.get('/', (req, res) => {
    res.render('login');
})

router.post('/', (req, res, next) => {
    const pub = req.body.public_key;
    const priv = req.body.private_key
    if (!pub || !priv || typeof priv  !== 'string' || typeof pub !== 'string') {
        return res.send({'success': false});
    }
    else if (req.body.private_key.length !== 898 || req.body.public_key.length !== 188) {
        return res.send({'success': false});
    }
    else {
        next();
    }
} , (req,res) => {
    // check key pair
    try {
        if (Verifier.verifyKeypair(req.body.private_key, req.body.public_key)) {
            req.session.loggedIn = true;
            req.session.private_key = req.body.private_key.toLowerCase();
            req.session.wallet_address = req.body.public_key.toLowerCase();
            res.send({'success': true});
        }
        else {
            res.send({'success': false});
        }
    } catch (error) {
        console.error(error);
        res.send({'success': false});
    }
});

export { router };