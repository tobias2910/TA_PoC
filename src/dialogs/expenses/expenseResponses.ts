import { TurnContext } from 'botbuilder';
import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Antworten für den ExpenseDialog
 */
export class ExpenseResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        projcectNrPrompt: string;
        travelOccasion: string;
        travelAdress: string;
        departDate: string;
        returnDate: string;
        summaryTitel: string;
        summary: string;
        confirmSum: string;
        contin: string;
        receiveInfo: string;
        restart: string;
        uploadPrompt: string;
        thxReceive: string;
        recognizing: string;
        receiveSummary: string;
        receiveOk: string;
        addReceive: string;
        tryAgain: string;
        again: string;
        finish1: string;
        finish2: string;
    } = {
        projcectNrPrompt: 'projectNrPrompt',
        travelOccasion: 'travelOccasion',
        travelAdress: 'travelAdress',
        departDate: 'departDate',
        returnDate: 'returnDate',
        summaryTitel: 'summaryTitel',
        summary: 'summary',
        confirmSum: 'confirmSum',
        contin: 'contin',
        receiveInfo: 'receiveInfo',
        restart: 'restart',
        uploadPrompt: 'uploadPrompt',
        thxReceive: 'thxReceive',
        recognizing: 'recognizin',
        receiveSummary: 'receiveSummary',
        receiveOk: 'receiveOk',
        addReceive: 'addReceive',
        tryAgain: 'tryAgain',
        again: 'again',
        finish1: 'finish1',
        finish2: 'finish2'
    };

    private static readonly responseTemplate: LanguageTemplateDictionary = new Map([
        ['default', new Map([
            [ExpenseResponses.responseIds.projcectNrPrompt, ExpenseResponses.fromResources('expenses.projectNrPrompt')],
            [ExpenseResponses.responseIds.travelOccasion, ExpenseResponses.fromResources('expenses.travelOccasion')],
            [ExpenseResponses.responseIds.travelAdress, ExpenseResponses.fromResources('expenses.travelAdress')],
            [ExpenseResponses.responseIds.departDate, ExpenseResponses.fromResources('expenses.departDate')],
            [ExpenseResponses.responseIds.returnDate, ExpenseResponses.fromResources('expenses.returnDate')],
            [ExpenseResponses.responseIds.confirmSum, ExpenseResponses.fromResources('expenses.confirmSum')],
            [ExpenseResponses.responseIds.contin, ExpenseResponses.fromResources('expenses.continue')],
            [ExpenseResponses.responseIds.receiveInfo, ExpenseResponses.fromResources('expenses.receiveInfo')],
            [ExpenseResponses.responseIds.restart, ExpenseResponses.fromResources('expenses.restart')],
            [ExpenseResponses.responseIds.uploadPrompt, ExpenseResponses.fromResources('expenses.uploadPrompt')],
            [ExpenseResponses.responseIds.thxReceive, ExpenseResponses.fromResources('expenses.thxReceive')],
            [ExpenseResponses.responseIds.recognizing, ExpenseResponses.fromResources('expenses.recognizing')],
            [ExpenseResponses.responseIds.receiveOk, ExpenseResponses.fromResources('expenses.receiveOk')],
            [ExpenseResponses.responseIds.addReceive, ExpenseResponses.fromResources('expenses.addReceive')],
            [ExpenseResponses.responseIds.tryAgain, ExpenseResponses.fromResources('expenses.tryAgain')],
            [ExpenseResponses.responseIds.again, ExpenseResponses.fromResources('expenses.again')],
            [ExpenseResponses.responseIds.finish1, ExpenseResponses.fromResources('expenses.finish1')],
            [ExpenseResponses.responseIds.finish2, ExpenseResponses.fromResources('expenses.finish2')],
            [ExpenseResponses.responseIds.summaryTitel, async (context: TurnContext, data: any): Promise < string > => {
                const value: string = i18n.__('expenses.summaryTitel');

                return value.replace('{0}', data.firstName);
            }],
            [ExpenseResponses.responseIds.summary, async (context: TurnContext, data: any): Promise < string > => {
                return i18n.__('expenses.summary')
                    .replace('{0}', data.userId)
                    .replace('{1}', data.projectNr)
                    .replace('{2}', data.occasion)
                    .replace('{3}', data.adress)
                    .replace('{4}', data.departDate)
                    .replace('{5}', data.returnDate);
            }],
            [ExpenseResponses.responseIds.receiveSummary, async (context: TurnContext, data: any): Promise < string > => {
                return i18n.__('expenses.receiveSummary')
                    .replace('{0}', data.invoiceType)
                    .replace('{1}', data.invoiceName)
                    .replace('{2}', data.invoiceDate)
                    .replace('{3}', data.invoiceTotal);

            }]
        ])]
    ]);

    constructor() {
        super();
        this.register(new DictionaryRenderer(ExpenseResponses.responseTemplate));
    }

    public static getPromptOptions(): string[] {
        return [
            i18n.__('expenses.choiceNr1'),
            i18n.__('expenses.choiceNr2'),
            i18n.__('expenses.choiceNr3'),
            i18n.__('expenses.choiceNr4')
        ]
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise < string > => Promise.resolve(i18n.__(name));
    }
}