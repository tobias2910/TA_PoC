import { GenericService } from 'botframework-config';
import * as request from 'request';
import {
    IExpenseData,
    IInvoiceData } from '../dialogs/shared/stateProperties/expenseData';
import { IUserData } from '../dialogs/shared/stateProperties/userData';
import {
    IUiPathData,
    IUiPathLogin } from '../types/apiTypes';

/**
 * Schnittstelle für den UiPath Orchestrator Service
 */
export class UiPath extends GenericService {

    // Eigenschaften
    private readonly uiPathData: IUiPathData;
    private token: string = '';

    constructor(uiPathData: IUiPathData) {
        super ();
        this.uiPathData = uiPathData;
    }

    /**
     * Steuert die einzelnen Schnittstellen für den UiPath Service
     *
     * @param userData - Die Daten des angemeldeten Nutzers
     * @param expenseData - Die Daten der zu erstattenden Reise
     */
    public async apiController(userData: IUserData, expenseData: IExpenseData): Promise < void > {
        const loginData: IUiPathLogin | undefined = await this.authentificate();
        if (loginData) {
            this.token = loginData.result;
        }
        await this.addTransactionItem(userData, expenseData);
        await this.startJob();
    }

    /**
     * Meldet sichinnerhalb der UiPath Orchestratot Komponente an und gibt
     * ein Token zurück.
     */
    private async authentificate(): Promise < IUiPathLogin | undefined > {
        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            const options: request.Options = {
                url: 'https://platform.uipath.com/api/account/authenticate',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    tenancyName: this.uiPathData.tenant,
                    usernameOrEmailAddress: this.uiPathData.username,
                    password: this.uiPathData.password
                },
                json: true
            };
            request.post(options, (error: Error, response: request.Response,
                                   body: IUiPathLogin) => {
                if (error) {
                    rej(undefined);
                } else {
                    res(body);
                }
            });
        });
    }

    /**
     * Fügt die Daten der Sitzung in die dafür vorhergesene UiPath Orchestrator
     * Warteliste ein.
     *
     * @param userData - UserData
     * @param expenseData - ExpenseData
     */
    private async addTransactionItem(userData: IUserData,
                                     expenseData: IExpenseData): Promise < void > {
        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            const options: request.Options = {
                url: 'https://platform.uipath.com/odata/Queues/UiPathODataSvc.AddQueueItem%28%29',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: {
                    itemData: {
                        Name: 'TravelExpenses',
                        Reference: 'Azure Bot Service',
                        Priority: 'Low',
                        SpecificContent: {
                            employeeId: userData.userId,
                            lastName: userData.lastName,
                            firstName: userData.firstName,
                            mailAddress: userData.mail,
                            projectNr: expenseData.projectNr,
                            occasion: expenseData.occasion,
                            address: expenseData.adress,
                            departureDate: expenseData.departDate,
                            returnDate: expenseData.returnDate,
                            invoice: this.serializeInvoiceData(expenseData.invoice)
                        },
                        DeferDate: undefined,
                        DueDate: undefined
                    }
                },
                json: true
            };
            request.post(options, (error: Error, response: request.Response,
                                   body: JSON) => {
                if (error) {
                    rej();
                } else {
                    res();
                }
            });
        });
    }

    /**
     * Startet den Prozess und somit den dazugehörigen Roboter
     */
    private async startJob(): Promise < number > {
        // tslint:disable-next-line:typedef
        return new Promise((res, rej) => {
            const options: request.Options = {
                url: 'https://platform.uipath.com/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: {
                    startInfo: {
                        ReleaseKey: 'd0646cb9-6c20-4667-a040-c48f3124bed8',
                        RobotIds: [136667],
                        NoOfRobots: 0,
                        Strategy: 'Specific'
                    }
                },
                json: true
            };
            request.post(options, (error: Error, response: request.Response,
                                   body: JSON) => {
                if (error) {
                    rej();
                } else {
                    res();
                }
            });
        });
    }

    /**
     * Wandelt sämtliche Daten der übergebenen Rechnung in einen String um und
     * fügt dabei vor jeden Anführungszeichein zwei Backslashes hinzu
     *
     * @param invoiceArray
     */
    private serializeInvoiceData(invoiceArray: IInvoiceData[]): string {
        let tempData: string = JSON.stringify(invoiceArray);
        tempData = tempData.replace('"', '\\"');

        return tempData;
    }

}
