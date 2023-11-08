class Article {
    id: string;
    title: string;
    description: string;
    datePublished: Date;

    dateString: string;

    constructor(id: string, title: string, description: string, datePublished: Date) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.datePublished = datePublished;

        // format to DD/MM/YYYY
        this.dateString = datePublished.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

export default Article;
