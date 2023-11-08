import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';
import Article from './models/Article';
import Comment from './models/Comment';
import VulnerabilitySettings from './models/VulnerabilitySettings';
import { getVulnerabilitySettings, replaceAllChars } from './utils';

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

let sessionVulnerabilitySettings: { [userID: string]: VulnerabilitySettings } = {};

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

// Parse cookies
app.use(cookieParser());

// Set vulnerability settings for session if user is authenticated
app.use((req, res, next) => {
    if (req.oidc.isAuthenticated()) {
        const userID = req.oidc.user!.sub;
        if (sessionVulnerabilitySettings[userID] == undefined) {
            console.log("Creating new settings for session");
            sessionVulnerabilitySettings[userID] = new VulnerabilitySettings(false, false);
        }
    }
    next();
});

app.use('/admin', requiresAuth(), (req, res, next) => {
    const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

    // If broken access control vulnerability is enabled, allow access to admin page
    if (vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
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

app.use('/articles/:id/edit', requiresAuth(), (req, res, next) => {
    const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

    // If broken access control vulnerability is enabled, allow access to admin page
    if (vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
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

app.use('/articles/:id/delete', requiresAuth(), (req, res, next) => {
    const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

    // If broken access control vulnerability is enabled, allow access to admin page
    if (vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
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

app.use('/comments/:id/delete', requiresAuth(), (req, res, next) => {
    const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

    // If broken access control vulnerability is enabled, allow access to admin page
    if (vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
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
            const articles: Article[] = await prisma.articles.findMany({
                orderBy: {
                    datePublished: 'desc'
                }
            })
            .then(articles => {
                return articles.map(article => {
                    return new Article(article.id, article.title, article.description, article.datePublished);
                });
            });

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
        
        const article: Article | undefined = await prisma.articles.findUnique({
            where: {
                id: id
            }
        })
        .then(article => {
            if (article) {   
                return new Article(article.id, article.title, article.description, article.datePublished);
            } else {
                return undefined;
            }
        });

        if (!article) {
            res.sendStatus(404).send("Article not found");
            return;
        }

        const comments: Comment[] = await prisma.comments.findMany({
            where: {
                articleId: id
            },
            orderBy: {
                dateCommented: 'desc'
            }
        })
        .then(comments => {
            return comments.map(comment => {
                return new Comment(comment.id, comment.text, comment.articleId, comment.dateCommented, comment.author);
            });
        });

        const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

        res.render('article', {
            user: req.oidc.user,
            article: article,
            comments: comments,
            vulnerabilitySettings: vulnerabilitySettings
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.get('/admin/articles/:id', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        
        const article: Article | undefined = await prisma.articles.findUnique({
            where: {
                id: id
            }
        })
        .then(article => {
            if (article) {
                return new Article(article.id, article.title, article.description, article.datePublished);
            } else {
                res.sendStatus(404).send("Article not found");
                return undefined;
            }
        });

        if (!article) {
            res.sendStatus(404).send("Article not found");
            return;
        }
        
        const comments: Comment[] = await prisma.comments.findMany({
            where: {
                articleId: id
            },
            orderBy: {
                dateCommented: 'desc'
            }
        })
        .then(comments => {
            return comments.map(comment => {
                return new Comment(comment.id, comment.text, comment.articleId, comment.dateCommented, comment.author);
            });
        });

        const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

        res.render('article-admin', {
            user: req.oidc.user,
            article: article,
            comments: comments,
            vulnerabilitySettings: vulnerabilitySettings
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.post('/articles/:id/edit', requiresAuth(), async (req, res) => {
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

app.get('/articles/:id/delete', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;

        await prisma.articles.delete({
            where: {
                id: id
            }
        });

        res.redirect('/');
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.post('/comments', requiresAuth(), async (req, res) => {
    try {
        const articleId = req.body.articleId;
        let comment = req.body.comment;
        const user = req.oidc.user!;

        const vulnerabilitySettings = getVulnerabilitySettings(user.sub, sessionVulnerabilitySettings);

        // Prevent XSS attacks
        if (!vulnerabilitySettings.isXssVulnerabilityEnabled) {
            comment = replaceAllChars(comment, '<', '&lt;');
            comment = replaceAllChars(comment, '>', '&gt;');
        }

        await prisma.comments.create({
            data: {
                text: comment,
                articleId: articleId,
                author: user?.name || "Anonymous"
            },
        });

        res.redirect(req.get('referer') || '/');
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});

app.get('/comments/:id/delete', requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;

        await prisma.comments.delete({
            where: {
                id: id
            }
        });

        res.redirect(req.get('referer') || '/');
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message || error });
    }
});


app.post('/vulnerabilities', requiresAuth(), async (req, res) => {
    const xss = req.body.xss;
    const brokenAccessControl = req.body.brokenAccessControl;
    
    const vulnerabilitySettings = getVulnerabilitySettings(req.oidc.user!.sub, sessionVulnerabilitySettings);

    if (xss != vulnerabilitySettings.isXssVulnerabilityEnabled) {
        vulnerabilitySettings.setXssVulnerabilityEnabled(xss == "on");
    }

    // Check if broken access control vulnerability has been changed
    if (brokenAccessControl != vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
        vulnerabilitySettings.setBrokenAccessControlVulnerabilityEnabled(brokenAccessControl == "on");

        // If user is on admin page and the vulnerability has been disabled, redirect to user page, otherwise redirect to current page
        if (!vulnerabilitySettings.isBrokenAccessControlVulnerabilityEnabled) {
            const articleId = req.body.articleId;
            res.redirect(`/user/articles/${articleId}`);
        } else {
            res.redirect(req.get('referer') || '/');
        }
    }
});

app.get("/signup", (req, res) => {
    res.oidc.login({
        returnTo: req.get('referer') || '/',
        authorizationParams: {      
            screen_hint: "signup",
        },
    });
});

app.listen(port, () => {
    console.log(`Listening at ${baseURL}`);
});