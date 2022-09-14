import { Router } from "express";
const router = Router();
import crypto from "crypto";
import { Verifier } from '../modules/verification.cjs';

router.use(Verifier.notAuthPass);

router.get('/', (req, res) => {
    res.render('register')
});

router.post('/', (req, res) => {
    crypto.generateKeyPair('rsa', {
        modulusLength: 512,
        publicKeyEncoding: {
          type: 'spki',
          format: 'der'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'der',
          cipher: 'aes-256-cbc',
          // eslint-disable-next-line no-undef
          passphrase: process.env.PASSPHRASE
        }
    }, (er, publicKey, privateKey) => {
        if (er) throw er;
        const hex_public = publicKey.toString("hex");
        const hex_private = privateKey.toString("hex");
        return res.send({ 'public_key' : hex_public, 'private_key' : hex_private });
    })
})


export { router };