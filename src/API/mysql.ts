import { GenericService } from 'botframework-config';
import {
    Connection,
    createConnection,
    QueryError,
    RowDataPacket
} from 'mysql';
import { IMySQLData } from '../types/apiTypes';

/**
 * Responsible for the processing of all queries to the
 * mySQL database.
 */
export class MySql extends GenericService {
    private readonly connectionData: IMySQLData;
    private readonly con: Connection;

    constructor(connectionData: IMySQLData) {
        super();
        this.connectionData = connectionData;

        this.con = createConnection({
            host: this.connectionData.url,
            user: this.connectionData.user,
            password: this.connectionData.password,
            database: this.connectionData.database
        });
    }

    /**
     * Connects to the database. Returns the value 1 as
     * soon as the operation was successful. Otherwise, a 0.
     *
     * @return result
     */
    public async connectToDB(): Promise < number > {
        // tslint:disable-next-line:typedef
        return new Promise(async (res, rej) => {
            this.con.connect((err: QueryError | null): void => {
                if (err) {
                    rej(0);
                } else {
                    res(1);
                }
            });
        });
    }

    /**
     * Disconnect from the database
     */
    public disconectFromDb(): void {
        this.con.end();
    }

    /**
     * This method obtains the personId as well as the first
     * name of the employee on the basis of the FaceId that
     * has been determined by the FaceAPI.
     *
     * @param faceId Detected faceId
     */
    public async getUserData(faceId: string): Promise < undefined | RowDataPacket > {
        // Prepare the SQL statement
        const getNameSQL: string =  `SELECT personId, firstName,` +
                                    `lastName, mail FROM ` +
                                    `person WHERE faceID = '${faceId}'`;

        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            this.con.query(getNameSQL, (err: Error, result: RowDataPacket[]) => {
                if (err) {
                    rej(undefined);
                } else {
                    res(result[0]);
                }
            });
        });
    }

    /**
     * Checks whether the employee's transferred security password
     * matches the data stored in the database. The result of
     * this check is returned in the form of a boolean.
     *
     * @param userId userId
     * @param userInput userPassword
     */
    public async validatePassword(userId: string, userInput: string): Promise < boolean > {
        // Prepare the SQL statement
        const getResult: string =   `SELECT CASE WHEN EXISTS (` +
                                    `SELECT secretPassword  ` +
                                    `FROM person WHERE ` +
                                    `personID = ${userId} AND ` +
                                    `secretPassword = '${userInput}') ` +
                                    `THEN true ` +
                                    `ELSE false END ` +
                                    `AS isSecretCorrect`;

        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            this.con.query(getResult, (err: Error, result: RowDataPacket) => {
                if (err) {
                    rej(false);
                } else {
                    // tslint:disable-next-line:no-unsafe-any
                    res(this.convertToBoolean(< string > result[0].isSecretCorrect));
                }
            });
        });
    }

    /**
     * Checks whether the incoming number has the value 1 and returns true
     * if the result is positive and false if the result is negative.
     *
     * @param res The result of the query
     */
    private convertToBoolean(res: string): boolean {
        return (Number(res) === 1) ? true : false;
    }
}