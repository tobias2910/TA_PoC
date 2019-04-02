import {
    LuisApplication,
    LuisPredictionOptions,
    LuisRecognizer,
    QnAMaker,
    QnAMakerEndpoint } from 'botbuilder-ai';
import {
    BotConfiguration,
    DispatchService,
    GenericService,
    IConnectedService,
    LuisService,
    QnaMakerService,
    ServiceTypes } from 'botframework-config';
import { Bing } from './API/bing';
import { CustomVision } from './API/customVision';
import { Docparser } from './API/docparser';
import { FaceAPI } from './API/faceAPI';
import { MySql } from './API/mysql';
import { UiPath } from './API/uiPath';
import {
    IBingData,
    ICustomVisionData,
    IDocparserData,
    IFaceAPIData,
    IMySQLData,
    IUiPathData} from './types/apiTypes';

/**
 * Stellt die Referenz auf externe Dienstleistungen dar.
 */
export class BotServices {
    // tslint:disable:variable-name
    private _dispatchRecognizer!: LuisRecognizer;
    private _luisServices: Map < string, LuisRecognizer > ;
    private _luisOptions: LuisPredictionOptions;
    private _qnaServices: Map < string, QnAMaker > ;
    private _genericServices: Map < string, GenericService > ;
    // tslint:enable:variable-name

    /**
     * Initializes a new instance of the BotServices class
     */
    constructor(config: BotConfiguration) {
        this._luisServices = new Map < string, LuisRecognizer > ();
        this._qnaServices = new Map < string, QnAMaker > ();
        this._genericServices = new Map < string, GenericService > ();
        // Lege die LUIS Optionen fest
        this._luisOptions = {
            bingSpellCheckSubscriptionKey: '7e197b70f9cb45a0b68237b634119b3e',
            spellCheck: true
        };

        config.services.forEach((service: IConnectedService) => {
            switch (service.type) {
                case ServiceTypes.Dispatch:
                    {
                        const dispatch: DispatchService = < DispatchService > service;
                        const dispatchApp: LuisApplication = {
                            applicationId: dispatch.appId,
                            endpoint: this.getLuisPath(dispatch.region),
                            endpointKey: dispatch.subscriptionKey
                        };
                        this._dispatchRecognizer = new LuisRecognizer(dispatchApp);
                        break;
                    }
                case ServiceTypes.Luis:
                    {
                        const luis: LuisService = < LuisService > service;
                        const luisApp: LuisApplication = {
                            applicationId: luis.appId,
                            endpoint: this.getLuisPath(luis.region),
                            endpointKey: luis.subscriptionKey
                        };
                        this._luisServices.set(luis.name, new LuisRecognizer(luisApp, this._luisOptions));
                        break;
                    }
                case ServiceTypes.QnA:
                    {
                        const qna: QnaMakerService = < QnaMakerService > service;
                        const qnaEndpoint: QnAMakerEndpoint = {
                            endpointKey: qna.endpointKey,
                            host: qna.hostname,
                            knowledgeBaseId: qna.kbId
                        };
                        this._qnaServices.set(qna.name, new QnAMaker(qnaEndpoint));
                        break;
                    }
                case ServiceTypes.Generic:
                    {
                        if (service.name === 'faceAPI') {
                            const faceAPI: GenericService = < GenericService > service;
                            const faceAPIData: IFaceAPIData = {
                                authoringKey: faceAPI.configuration.authoringKey,
                                url: faceAPI.url
                            };
                            this._genericServices.set(service.name, new FaceAPI(faceAPIData));
                        } else if (service.name === 'mySQL') {
                            const mySQL: GenericService = < GenericService > service;
                            const mySQLData: IMySQLData = {
                                url: mySQL.url,
                                user: mySQL.configuration.user,
                                password: mySQL.configuration.password,
                                database: mySQL.configuration.database
                            };
                            this._genericServices.set(service.name, new MySql(mySQLData));
                        } else if (service.name === 'uiPath') {
                            const uiPath: GenericService = < GenericService > service;
                            const uiPathData: IUiPathData = {
                                tenant: uiPath.configuration.tenant,
                                username: uiPath.configuration.username,
                                password: uiPath.configuration.password
                            };
                            this._genericServices.set(service.name, new UiPath(uiPathData));
                        } else if (service.name === 'customVision') {
                            const customVision: GenericService = < GenericService > service;
                            const customVisionData: ICustomVisionData = {
                                url: customVision.url,
                                authoringKey: customVision.configuration.authoringKey
                            };
                            this._genericServices.set(service.name, new CustomVision(customVisionData));
                        } else if (service.name === 'docparser') {
                            const docparser: GenericService = < GenericService > service;
                            const docparserData: IDocparserData = {
                                authoringKey: docparser.configuration.authoringKey
                            };
                            this._genericServices.set(service.name, new Docparser(docparserData));
                        } else if (service.name === 'bing') {
                            const bing: GenericService = < GenericService > service;
                            const bingData: IBingData = {
                                url: bing.url,
                                authoringKey: bing.configuration.authoringKey
                            };
                            this._genericServices.set(service.name, new Bing(bingData));
                        }
                    }
                default:
                    {
                        //
                    }
            }
        });
    }

    private getLuisPath(region: string): string {
        return `https://${region}.api.cognitive.microsoft.com`;
    }

    /**
     * Gibt den Dispatcher zurück
     */
    public get dispatchRecognizer(): LuisRecognizer {
        return this._dispatchRecognizer;
    }

    /**
     * Gibt eine Map mit den allgemeinen Services zurück.
     * Dabei handelt es sich u.a. um FaceAPI und UiPath.
     */
    public get genericServices(): Map < string, GenericService > {
        return this._genericServices;
    }

    /**
     * Gibt eine Map mit  LUIS Services zurück.
     * Dabei handelt es sich um die LUIS Services der unterschiedlichen Sprachen.
     */
    public get luisServices(): Map < string, LuisRecognizer > {
        return this._luisServices;
    }

    /**
     * Gibt eine Map mit QnAMaker Services zurück.
     * Dabei handelt es sich um die QnAMaker Services der unterschiedlichen Sprachen.
     */
    public get qnaServices(): Map < string, QnAMaker > {
        return this._qnaServices;
    }
}