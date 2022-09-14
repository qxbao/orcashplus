import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import body_parser_pkg from 'body-parser';
const { urlencoded, json } = body_parser_pkg;
import { routerHandle } from './routers/handler.js';
import { app, io, http_server } from './modules/io.cjs'
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';

app.set('socketio', io);
app.set('views', './public/templates');
app.set('view engine', 'pug');
app.use(session({
    genid: req => uuidv4(),
    secret: process.env.SECRET_STR,
    resave: false,
    saveUninitialized: true,
}));

app.use(urlencoded({extended: true}));
app.use(json());
app.use(express.static('./public'));

routerHandle(app);

app.use(function(req, res) {
    res.status(404).render('404');
});

const port = process.env.PORT || 80;

http_server.listen(port, () => {
    console.log('App đang chạy trên port', port)
});