import {
    GenericService
} from 'botframework-config';
import * as request from 'request';
import {
    IFaceAPIData
} from '../types/apiTypes';

/**
 * This class contains all methods necessary for face and employee
 * identification using FaceAPI.
 */
export class FaceAPI extends GenericService {
    private readonly faceAPIData: IFaceAPIData;

    constructor(faceAPIData: IFaceAPIData) {
        super();
        this.faceAPIData = faceAPIData;
    }

    /**
     * This function is responsible for fetching the FaceId for the handed
     * image.
     *
     * @param fileUrl The URL to the attachment
     */
    public async getDetectedFaceId(fileUrl: string): Promise < string > {
        // tslint:disable-next-line:typedef
        return new Promise(async (res, rej) => {
            // Convert the photo object to binary data
            const photoBinary: request.Request = request.get(fileUrl);
            const options: request.Options = {
                url: `${this.faceAPIData.url}detect`,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.faceAPIData.authoringKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: photoBinary
            };
            request.post(options, (error: Error,
                                   response: request.Response, body: string) => {
                if (error) {
                    rej(error);
                }
                try {
                    res(JSON.parse(body)[0].faceId);
                } catch (err) {
                    res(undefined);
                }
            });
        });
    }

    /**
     * This method searches the group of people created within
     * the Face API for the highest possible match based on
     * the detectId passed.
     *
     * @param faceId The FaceId that was detected
     */
    public async getIdentifiedPersonId(faceId: string): Promise < string > {
        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            const options: request.Options = {
                url: `${this.faceAPIData.url}identify`,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.faceAPIData.authoringKey,
                    'Content-Type': 'application/json'
                },
                body: {
                    personGroupId: 'employee',
                    faceIds: [faceId],
                    maxNumOfCandidatesReturned: 1
                },
                json: true
            };
            request.post(options, (error: Error,
                                   response: request.Response, body: any) => {
                if (error) {
                    rej(error);
                }
                try {
                    res(body[0].candidates[0].personId);
                } catch (err) {
                    res(undefined);
                }
            });
        });
    }
}