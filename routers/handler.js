import { router as homepage } from './homepage.js';
import { router as api } from './api.js';
import { router as register } from './register.js'
import { router as login } from './login.js'
import { router as blockchain } from './blockchain.js'

const routerHandle = (app)=>{
    app.use((req, res, next) => {
        if (req.session.loggedIn) {
            res.locals.auth = true;
            res.locals.wallet_address = req.session.wallet_address;
        }
        next();
    })
    app.use("/", homepage);
    app.use("/api", api);
    app.use("/createwallet", register);
    app.use("/login", login);
    app.get("/logout", (req, res) => { req.session.destroy(); res.redirect('/') })
    app.use("/blockchain", blockchain);
};

export { routerHandle };