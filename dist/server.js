"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var express_openid_connect_1 = require("express-openid-connect");
var path_1 = __importDefault(require("path"));
var dotenv_1 = __importDefault(require("dotenv"));
var client_1 = require("@prisma/client");
var Comment_1 = __importDefault(require("./models/Comment"));
var host = process.env.HOST || 'localhost';
var port = process.env.PORT || 3000;
var baseURL = host == 'localhost' ? "http://".concat(host, ":").concat(port) : "https://".concat(host);
var adminID = process.env.ADMIN_ID;
var app = (0, express_1.default)();
var viewsPath = path_1.default.join(__dirname, 'views');
app.set("views", viewsPath);
app.set("view engine", "pug");
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('styles'));
dotenv_1.default.config();
var config = {
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
var prisma = new client_1.PrismaClient();
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use((0, express_openid_connect_1.auth)(config));
// req.isAuthenticated is provided from the auth router
app.get('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var articles, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!req.oidc.isAuthenticated()) return [3 /*break*/, 2];
                return [4 /*yield*/, prisma.articles.findMany()];
            case 1:
                articles = _a.sent();
                res.render('index', { user: req.oidc.user, articles: articles });
                return [3 /*break*/, 3];
            case 2:
                res.render('index', { user: null });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Error fetching data:', error_1);
                res.status(500).json({ error: error_1.message || error_1 });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.get('/user/articles/:id', (0, express_openid_connect_1.requiresAuth)(), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, article, datePublished, comments, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, prisma.articles.findUnique({
                        where: {
                            id: id
                        }
                    })];
            case 1:
                article = _a.sent();
                datePublished = void 0;
                if (article === null || article === void 0 ? void 0 : article.datePublished) {
                    datePublished = new Date(article.datePublished).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                else {
                    datePublished = "N/A";
                }
                return [4 /*yield*/, prisma.comments.findMany({
                        where: {
                            articleId: id
                        },
                        orderBy: {
                            dateCommented: 'desc'
                        }
                    })
                        .then(function (comments) {
                        return comments.map(function (comment) {
                            return new Comment_1.default(comment.id, comment.text, comment.articleId, comment.dateCommented, comment.author);
                        });
                    })];
            case 2:
                comments = _a.sent();
                console.log(JSON.stringify(comments, null, 2));
                res.render('article', { user: req.oidc.user, article: article, datePublished: datePublished, comments: comments });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('Error fetching data:', error_2);
                res.status(500).json({ error: error_2.message || error_2 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/articles/:id/comment', (0, express_openid_connect_1.requiresAuth)(), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, comment, user, newComment, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                comment = req.body.comment;
                user = req.oidc.user;
                return [4 /*yield*/, prisma.comments.create({
                        data: {
                            text: comment,
                            articleId: id,
                            author: (user === null || user === void 0 ? void 0 : user.name) || "Anonymous"
                        },
                    })];
            case 1:
                newComment = _a.sent();
                console.log(new Date().toLocaleTimeString());
                res.redirect("/user/articles/".concat(id));
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error fetching data:', error_3);
                res.status(500).json({ error: error_3.message || error_3 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get("/signup", function (req, res) {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});
app.listen(port, function () {
    console.log("Listening at ".concat(baseURL));
});
