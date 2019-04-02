import { GenericService } from 'botframework-config';
import * as request from 'request';
import {
    ICustomVisionData,
    IPredictionData,
    ITagData
} from '../types/apiTypes';

/**
 * Schnittstelle für den CustomVision Service
 */
export class CustomVision extends GenericService {

    // Eigenschaften
    private readonly apiData: ICustomVisionData;

    constructor(apiData: ICustomVisionData) {
        super ();
        this.apiData = apiData;
    }

    /**
     * Sendet ein Document an den CustomVision Service und gibt die erkannten Tags
     * sowie die Wahrscheinlichkeit zurück
     *
     * @param fileUrl - URL für die zu Klassifizierende Datei
     */
    public async classificateImage(fileUrl: string): Promise < IPredictionData > {
        // tslint:disable-next-line:typedef
        return new Promise(async (res, rej) => {
            const imageBinary: request.Request = request.get(fileUrl);
            const options: request.Options = {
                url: this.apiData.url,
                headers: {
                    'Prediction-key': this.apiData.authoringKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: imageBinary
            };
            request.post(options, (error: Error, response: request.Response,
                                   body: string) => {
                if (error) {
                    rej(undefined);
                } else {
                    res(< IPredictionData > JSON.parse(body));
                }
            });
        });
    }

    /**
     * Gibt den Tag mit dem höchsten Wahrscheinlichkeitswert zurück
     *
     * @param customVisionResult - Ergebnisse des CustomVision-Service
     */
    public getTopTag(customVisionResult: IPredictionData): string {
        let topTag: string = '';
        let topProbability: number = 0;
        customVisionResult.Predictions.forEach((tag: ITagData) => {
            if (tag.Probability > topProbability) {
                topTag = tag.Tag;
                topProbability = tag.Probability;
            }
        });

        return topTag;
    }
}