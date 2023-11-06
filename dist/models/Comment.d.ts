declare class ArticleComment {
    id: string;
    text: string;
    articleId: string;
    dateCommented: Date;
    author: string;
    dateString: string;
    constructor(id: string, text: string, articleId: string, dateCommented: Date, author: string);
}
export default ArticleComment;
