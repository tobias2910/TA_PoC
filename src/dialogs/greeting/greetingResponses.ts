import { TurnContext } from 'botbuilder';
import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Antworten für den Verabschiedungsdialog
 */
export class GreetingResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        GreetingNr1: string;
        GreetingNr2: string;
        GreetingNr3: string;
        GreetingNr4: string;
        GreetingUser: string;
        GreetingNr: string;
    }  = {
        GreetingNr1: 'greetingNr1',
        GreetingNr2: 'greetingNr2',
        GreetingNr3: 'greetingNr3',
        GreetingNr4: 'greetingNr4',
        GreetingUser: 'greetingUser',
        GreetingNr: 'greetingNr'
    };

    private static readonly responseTemplates: LanguageTemplateDictionary = new Map([
        ['default', new Map([
            [GreetingResponses.responseIds.GreetingNr1, GreetingResponses.fromResources('greeting.number1')],
            [GreetingResponses.responseIds.GreetingNr2, GreetingResponses.fromResources('greeting.number2')],
            [GreetingResponses.responseIds.GreetingNr3, GreetingResponses.fromResources('greeting.number3')],
            [GreetingResponses.responseIds.GreetingNr4, GreetingResponses.fromResources('greeting.number4')],
            // tslint:disable-next-line:no-any
            [GreetingResponses.responseIds.GreetingUser, async (context: TurnContext, data: any): Promise<string> => {
                const value: string = i18n.__('greeting.withName');

                // tslint:disable-next-line:no-unsafe-any
                return value.replace('{0}', `${data.firstName}`);
            }]
        ])]
    ]);

    constructor() {
        super();
        this.register(new DictionaryRenderer(GreetingResponses.responseTemplates));
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }

    public static getResponseNumbers (): number {
        return Number(i18n.__('greeting.amount'));
    }
}