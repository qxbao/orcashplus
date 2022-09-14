import { Router } from "express";
const router = Router();

router.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.render('homepage_auth')
    }
    else {
        res.render('homepage')
    }
});


export { router };