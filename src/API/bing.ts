import { GenericService } from 'botframework-config';
import * as request from 'request';
import { IBingData, IBingSearchData } from '../types/apiTypes';

/**
 * Schnittstelle für den Bing-Such-Service
 */
export class Bing extends GenericService {

    // Eigenschaften festlegen
    private readonly bingData: IBingData;

    constructor(bingData: IBingData) {
        super ();
        this.bingData = bingData;
    }

    /**
     * Sucht mittels des Bing-Services nach dem übergebenen Argument und gibt die
     * Ergebnisse in Form eines BingTypes zurück
     *
     * @param searchArg - Das zu suchende Argeument
     */
    public async getSearchResults (searchArg: string): Promise < undefined | IBingSearchData > {
        // tslint:disable-next-line:typedef
        return new Promise(async (res, rej) => {
            const options: request.Options = {
                url: this.bingData.url,
                qs: {
                    count: '1',
                    q: searchArg },
                headers: {
                    'Accept-Language': 'de-DE',
                    'BingAPIs-Market': 'de-DE',
                    'Ocp-Apim-Subscription-Key': this.bingData.authoringKey
                }
            };
            request.get(options, (error: Error, response: request.Response,
                                  body: string) => {
                if (error) {
                    rej(undefined);
                } else {
                    res(< IBingSearchData > JSON.parse(body));
                }
            });
        });
    }
}