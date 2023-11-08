class Comment {
    id: string;
    text: string;
    articleId: string;
    dateCommented: Date;
    author: string;

    dateString: string;

    constructor(id: string, text: string, articleId: string, dateCommented: Date, author: string) {
        this.id = id;
        this.text = text;
        this.articleId = articleId;
        this.dateCommented = dateCommented;
        this.author = author;

        // format to DD/MM/YYYY HH:mm
        this.dateString = new Date(dateCommented).toLocaleString('en-GB', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        
    }
}

export default Comment;