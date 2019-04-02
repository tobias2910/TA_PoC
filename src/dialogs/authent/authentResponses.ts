import { TurnContext } from 'botbuilder';
import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Antworten für den Authent Dialog
 */
export class AuthentResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        facePrompt: string;
        wrongType: string;
        faceNA: string;
        repromptFace: string;
        notInPersGrp: string;
        notInDb: string;
        registPrompt: string;
        greetingWithName: string;
        passwordInfo: string;
        passwordPrompt: string;
        thanks: string;
        confirm: string;
        wrongPw: string;
        repromptPw: string;
    } = {
        facePrompt: 'facePrompt',
        wrongType: 'wrongType',
        faceNA: 'faceNA',
        repromptFace: 'repromptFace',
        notInPersGrp: 'notInPersGrp',
        notInDb: 'notInDb',
        registPrompt: 'registPrompt',
        greetingWithName: 'greetingWithName',
        passwordInfo: 'passwordInfo',
        passwordPrompt: 'passwordPrompt',
        thanks: 'thanks',
        confirm: 'confirm',
        wrongPw: 'wrongPw',
        repromptPw: 'repromptPw'
    };

    private static readonly responseTemplate: LanguageTemplateDictionary = new Map([
        ['default', new Map([
            [AuthentResponses.responseIds.facePrompt, AuthentResponses.fromResources('authent.facePrompt')],
            [AuthentResponses.responseIds.wrongType, AuthentResponses.fromResources('authent.wrongType')],
            [AuthentResponses.responseIds.faceNA, AuthentResponses.fromResources('authent.faceNA')],
            [AuthentResponses.responseIds.repromptFace, AuthentResponses.fromResources('authent.repromptFace')],
            [AuthentResponses.responseIds.notInPersGrp, AuthentResponses.fromResources('authent.notInPersGrp')],
            [AuthentResponses.responseIds.notInDb, AuthentResponses.fromResources('authent.notInDb')],
            [AuthentResponses.responseIds.registPrompt, AuthentResponses.fromResources('authent.registPrompt')],
            [AuthentResponses.responseIds.greetingWithName, async (context: TurnContext, data: any): Promise<string> => {
                const value: string = i18n.__('authent.greetingWithName');

                return value.replace('{0}', `${data.firstName} ${data.lastName}`);
            }],
            [AuthentResponses.responseIds.passwordInfo, AuthentResponses.fromResources('authent.passwordInfo')],
            [AuthentResponses.responseIds.passwordPrompt, AuthentResponses.fromResources('authent.passwordPrompt')],
            [AuthentResponses.responseIds.thanks, async (context: TurnContext, data: any): Promise<string> => {
                const value: string = i18n.__('authent.thanks');

                return value.replace('{0}', `${data.firstName}`);
            }],
            [AuthentResponses.responseIds.confirm, AuthentResponses.fromResources('authent.confirm')],
            [AuthentResponses.responseIds.wrongPw, AuthentResponses.fromResources('authent.wrongPw')],
            [AuthentResponses.responseIds.repromptPw, AuthentResponses.fromResources('authent.repromptPw')]
        ])]
    ]);

    constructor () {
        super();
        this.register(new DictionaryRenderer(AuthentResponses.responseTemplate));
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }
}