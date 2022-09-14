import { Router } from "express";
const router = Router();
import { Verifier } from '../modules/verification.cjs';

router.use(Verifier.authPass);

router.get('/', (req, res) => {
    res.render('blockchain', {})
});

export { router }