import { ApiHandler } from "../api-handler";

type PageSummary = {
    id: string;
    name: string;
    type: "PAGE";
    isCurrent: boolean;
};

type DocumentSummary = {
    id: string;
    name: string;
    type: "DOCUMENT";
    pages: PageSummary[];
    currentPage: PageSummary;
};

class DocumentHandler extends ApiHandler<undefined, DocumentSummary> {
    constructor() {
        super("mg.document");
    }

    async call(): Promise<DocumentSummary> {
        const document: DocumentNode = mg.document;
        const pages = document.children.map((page) =>
            toPageSummary(page, page.id === document.currentPage.id),
        );
        const currentPage = toPageSummary(document.currentPage, true);

        return {
            id: document.id,
            name: document.name,
            type: document.type,
            pages,
            currentPage,
        };
    }
}

export const documentHandler = new DocumentHandler();

function toPageSummary(page: PageNode, isCurrent: boolean): PageSummary {
    return {
        id: page.id,
        name: page.name,
        type: page.type,
        isCurrent,
    };
}
