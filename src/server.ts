import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import path from 'path';
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;
const baseURL = host == 'localhost' ? `http://${host}:${port}` : `https://${host}`;
const adminID = process.env.ADMIN_ID;

const app = express();
const viewsPath = path.join(__dirname, 'views');
app.set("views", viewsPath);
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('styles'));

dotenv.config()

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: baseURL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: 'https://dev-gzizuvkh2i7yo8yr.us.auth0.com',
    clientSecret: process.env.CLIENT_SECRET,
    authorizationParams: {
        response_type: 'code',
        scope: 'openid profile email roles',
    },
};

const prisma = new PrismaClient();

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', async (req, res) => {
    try {
        if (req.oidc.isAuthenticated()) {
            const articles = await prisma.articles.findMany();
            res.render('index', { user: req.oidc.user, articles: articles });
            
            console.log(JSON.stringify(articles, null, 2));
        } else {
            res.render('index', { user: null });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
    
});

app.get('/user/articles/:id', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        const article = await prisma.articles.findUnique({
            where: {
                id: id
            }
        });
        res.render('article', { article: article });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.get("/signup", (req, res) => {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {      
            screen_hint: "signup",
        },
    });
});

app.listen(port, () => {
    console.log(`Listening at ${baseURL}`);
});