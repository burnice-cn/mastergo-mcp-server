import { ApiHandler } from "../api-handler";

type QueryPageParams = {
    id: string
};

type CompactSceneNode = {
    id: string;
    name: string;
    type: NodeType;
};

type QueryPageResult = {
    id: string;
    name: string;
    type: "PAGE";
    isCurrent: boolean;
    label: PageNode["label"];
    bgColor: RGBA;
    topLevelNodeCount: number;
    selectionIds: string[];
    flowStartingPointCount: number;
    children: CompactSceneNode[];
};

class PageApiHandler extends ApiHandler<QueryPageParams,QueryPageResult> {
    constructor() {
        super("node.page");
    }

    async call(params?: QueryPageParams | undefined): Promise<QueryPageResult> {
        if (!params?.id) {
            throw new Error("node.page requires params.id");
        }

        const pages = mg.document.children;
        const page = pages.find((e) => e.id === params?.id);
        if (!page) {
            throw new Error(`Page not found: ${params.id}`);
        }

        return {
            id: page.id,
            name: page.name,
            type: page.type,
            isCurrent: page.id === mg.document.currentPage.id,
            label: page.label,
            bgColor: page.bgColor,
            topLevelNodeCount: page.children.length,
            selectionIds: page.selection.map((node) => node.id),
            flowStartingPointCount: page.flowStartingPoints.length,
            children: page.children.map(toCompactSceneNode),
        };
    }
}

export const pageApiHandler = new PageApiHandler();

function toCompactSceneNode(node: SceneNode): CompactSceneNode {
    return {
        id: node.id,
        name: node.name,
        type: node.type,
    };
}
