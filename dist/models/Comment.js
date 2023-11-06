"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ArticleComment = /** @class */ (function () {
    function ArticleComment(id, text, articleId, dateCommented, author) {
        this.id = id;
        this.text = text;
        this.articleId = articleId;
        this.dateCommented = dateCommented;
        this.author = author;
        // format to DD/MM/YYYY HH:mm
        this.dateString = new Date(dateCommented).toLocaleString('en-GB', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    }
    return ArticleComment;
}());
exports.default = ArticleComment;
