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
export class FarewellResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        FarewellNr1: string;
        FarewellNr2: string;
        FarewellNr3: string;
        FarewellNr4: string;
        FarewellUser: string;
        FarewellNr: string;
    }  = {
        FarewellNr1: 'farewellNr1',
        FarewellNr2: 'farewellNr2',
        FarewellNr3: 'farewellNr3',
        FarewellNr4: 'farewellNr4',
        FarewellUser: 'farewellUser',
        FarewellNr: 'farewellNr'
    };

    private static readonly responseTemplates: LanguageTemplateDictionary = new Map([
        ['default', new Map([
            [FarewellResponses.responseIds.FarewellNr1, FarewellResponses.fromResources('farewell.number1')],
            [FarewellResponses.responseIds.FarewellNr2, FarewellResponses.fromResources('farewell.number2')],
            [FarewellResponses.responseIds.FarewellNr3, FarewellResponses.fromResources('farewell.number3')],
            [FarewellResponses.responseIds.FarewellNr4, FarewellResponses.fromResources('farewell.number4')],
            // tslint:disable-next-line:no-any
            [FarewellResponses.responseIds.FarewellUser, async (context: TurnContext, data: any): Promise<string> => {
                const value: string = i18n.__('farewell.withName');

                // tslint:disable-next-line:no-unsafe-any
                return value.replace('{0}', `${data.firstName}`);
            }]
        ])]
    ]);

    constructor() {
        super();
        this.register(new DictionaryRenderer(FarewellResponses.responseTemplates));
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }

    public static getResponseNumbers (): number {
        return Number(i18n.__('farewell.amount'));
    }
}