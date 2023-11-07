import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import path from 'path';
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';
import ArticleComment from './models/Comment';

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

let isXssVulnerabilityEnabled = false;
let isBrokenAccessControlVulnerabilityEnabled = false;

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
        scope: 'openid profile email',
    },
};

const prisma = new PrismaClient();

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use('/admin', requiresAuth(), (req, res, next) => {
    if (isBrokenAccessControlVulnerabilityEnabled) {
        next();
    } else {
        // Prevent non-admin users from accessing this page
        if (req.oidc.user!.sub != adminID) {
            res.status(403).send("You are not authorized to access this page.");
        } else {
            next();
        }
    }
});

// req.isAuthenticated is provided from the auth router
app.get('/', async (req, res) => {
    try {
        if (req.oidc.isAuthenticated()) {
            const articles = await prisma.articles.findMany();
            res.render('index', { user: req.oidc.user, articles: articles });
        } else {
            res.render('index', { user: null });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
    
});

app.get('/user/articles/:id', requiresAuth(), async (req, res) => {
    if (req.oidc.user!.sub == adminID) {
        res.redirect(`/admin/articles/${req.params.id}`);
        return;
    }

    try {
        const id = req.params.id;
        
        const article = await prisma.articles.findUnique({
            where: {
                id: id
            }
        });

        let datePublished: string;
        if (article?.datePublished) {
            datePublished = new Date(article.datePublished).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            datePublished = "N/A";
        }

        const comments: ArticleComment[] = await prisma.comments.findMany({
            where: {
                articleId: id
            },
            orderBy: {
                dateCommented: 'desc'
            }
        })
        .then(comments => {
            return comments.map(comment => {
                return new ArticleComment(comment.id, comment.text, comment.articleId, comment.dateCommented, comment.author);
            });
        });

        res.render('article', {
            user: req.oidc.user,
            article: article,
            datePublished: datePublished,
            comments: comments,
            isXssVulnerabilityEnabled: isXssVulnerabilityEnabled,
            isBrokenAccessControlVulnerabilityEnabled: isBrokenAccessControlVulnerabilityEnabled
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.get('/admin/articles/:id', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        
        const article = await prisma.articles.findUnique({
            where: {
                id: id
            }
        });

        let datePublished: string;
        if (article?.datePublished) {
            datePublished = new Date(article.datePublished).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            datePublished = "N/A";
        }

        const comments: ArticleComment[] = await prisma.comments.findMany({
            where: {
                articleId: id
            },
            orderBy: {
                dateCommented: 'desc'
            }
        })
        .then(comments => {
            return comments.map(comment => {
                return new ArticleComment(comment.id, comment.text, comment.articleId, comment.dateCommented, comment.author);
            });
        });

        res.render('article-admin', {
            user: req.oidc.user,
            article: article,
            datePublished: datePublished,
            comments: comments,
            isXssVulnerabilityEnabled: isXssVulnerabilityEnabled,
            isBrokenAccessControlVulnerabilityEnabled: isBrokenAccessControlVulnerabilityEnabled
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.post('/admin/articles/:id/edit', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const description = req.body.description;

        await prisma.articles.update({
            where: {
                id: id
            },
            data: {
                title: title,
                description: description
            }
        });

        res.redirect(`/admin/articles/${id}`);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.post('/articles/:id/comment', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        let comment = req.body.comment;
        const user = req.oidc.user;

        // Prevent XSS attacks
        if (!isXssVulnerabilityEnabled) {
            comment = replaceAllChars(comment, '<', '&lt;');
            comment = replaceAllChars(comment, '>', '&gt;');
        }

        const newComment = await prisma.comments.create({
            data: {
                text: comment,
                articleId: id,
                author: user?.name || "Anonymous"
            },
        });

        res.redirect(req.get('referer') || '/');
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

function replaceAllChars(input: string, searchChar: string, replaceChar: string): string {
    const regex = new RegExp(searchChar, 'g');
    return input.replace(regex, replaceChar);
}

app.post('/vulnerabilities', requiresAuth(), async (req, res) => {
    const xss = req.body.xss;
    const brokenAccessControl = req.body.brokenAccessControl;
    
    if (xss != isXssVulnerabilityEnabled) {
        isXssVulnerabilityEnabled = xss == "on";
    }

    // Check if broken access control vulnerability has been changed
    if (brokenAccessControl != isBrokenAccessControlVulnerabilityEnabled) {
        isBrokenAccessControlVulnerabilityEnabled = brokenAccessControl == "on";
        
        // If user is on admin page and the vulnerability has been disabled, redirect to user page, otherwise redirect to current page
        if (!isBrokenAccessControlVulnerabilityEnabled) {
            const articleId = req.body.articleId;
            res.redirect(`/user/articles/${articleId}`);
        } else {
            res.redirect(req.get('referer') || '/');
        }
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