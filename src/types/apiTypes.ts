/**
 * Data for the FaceAPI
 */
export interface IFaceAPIData {
    url: string;
    authoringKey: string;
}
/**
 * Data for the CustomVision service
 */
export interface ICustomVisionData {
    url: string;
    authoringKey: string;
}

export interface IPredictionData  {
    Id: string;
    Project: string;
    Iteration: string;
    Created: string;
    Predictions: ITagData [];
}

export interface ITagData {
    TagId: string;
    Tag: string;
    Probability: number;
}

/**
 * Data for the mySQL database
 */
export interface IMySQLData {
    url: string;
    user: string;
    password: string;
    database: string;
}
/**
 * Data for the docparser service
 */
export interface IDocparserData {
    authoringKey: string;
}
/**
 * Data for the UiPath Orchestrator service
 */
export interface IUiPathData {
    url?: string;
    tenant: string;
    username: string;
    password: string;
}

export interface IUiPathLogin {
    result: string;
    targetUrl?: string;
    sucess: boolean;
    error?: string;
    unAuthorizedRequest: boolean;
    __abp: boolean;
}

export interface IBingData {
    url: string;
    authoringKey: string;
}

export interface IBingSearchData {
    _type: string;
    queryContext: {
        originalQuery: string;
    };
    webPages: {
        webSearchUrl: string;
        totalEstimatedMatches: string;
        value: IWebPageData [];
    };
    images: {
        id: string;
        readLink: string;
        webSearchUrl: string;
        isFamilyFriendly: boolean;
        value: IImageData [];
    };
    places: any;
    relatedSearches: any;
    rankingResponse: {
        mainline: {
            items: {
                answerType: string;
                resultIndex: number;
                value: {
                    id: string;
                };
            } [];
        };
        sidebar: any;
    };

}

interface IWebPageData {
    id: string;
    name: string;
    url: string;
    about: {name: string} [];
    isFamilyFriendly: boolean;
    displayUrl: string;
    snippet: string;
    deepLinks: {
        name: string;
        url: string;
    } [];
    dateLastCrawled: string;
    language: string;
    isNavigational: boolean;
}

interface IImageData {
    webSearchUrl: string;
    name: string;
    thumbnailUrl: string;
    datePublished: string;
    contentUrl: string;
    hostPageUrl: string;
    contentSize: string;
    encodingFormat: string;
    hostPageDisplayUrl: string;
    width: string;
    height: string;
    thumbnail: {
        width: string;
        height: string;
    };
}