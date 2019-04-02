import { GenericService } from 'botframework-config';
import { Client } from 'docparser-node';
import * as request from 'request';
import { IDocparserData } from '../types/apiTypes';

/**
 * Schnittstelle für den Docparser Service
 */
export class Docparser extends GenericService {

    // Eigenschaften festlegen
    private readonly client: Client;

    constructor (docparserData: IDocparserData) {
        super();
        this.client = new Client(docparserData.authoringKey);
    }

    /**
     * Fetches the available parsers
     *
     */
    public async getParserList (): Promise <string> {
        // tslint:disable-next-line:typedef
        return new Promise (async (res, rej) => {
            await this.client.getParsers ()
                .then((parsers: string) => {
                    res (parsers);
                })
                .catch((err: Error) => {
                    rej (err);
                });
        });
    }

    /**
     * Sendet das übergebene Dokument an den gewünschten Parser
     *
     * @param fileUrl - Die URL zur Datei
     * @param parserId - Die ID des gewünschten Parsers
     */
    public async sendDocument (fileUrl: string, parserId: string): Promise <any> {
        // tslint:disable-next-line:typedef
        return new Promise (async (res, rej) => {
            const base64: request.Request = request.get(fileUrl);
            await this.client.uploadFileByStream(parserId, base64)
                .then((result: JSON) => {
                    res(result);
                })
                .catch((err: Error) => {
                    rej(err);
                })
        });
    }

    /**
     * Bezieht die erkannten Daten des zuvor versendedeten Dokuemntes
     *
     * @param documentId - Die Id des zuvor versendeten Dokumentes
     * @param parserId - Die ID des Parsers
     */
    public async getDocumentData (documentId: string, parserId: string): Promise <any> {
        // tslint:disable-next-line:typedef
        return new Promise (async (res, rej) => {
            await this.client.getResultsByParser (parserId, documentId, {format: 'object'})
                .then((result: JSON[]) => {
                    res (result[0]);
                })
                .catch((err: Error) => {
                    rej (err);
                });
        });
    }
}