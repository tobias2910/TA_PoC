import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Responses for the cancel dialog
 */
export class CancelResponses extends TemplateManager {
    // Eigenschaften
    public static responseIds: {
        CancelPrompt: string;
        CancelConfirmedMessage: string;
        CancelDeniedMessage: string;
    }  = {
        CancelPrompt:  'cancelPrompt',
        CancelConfirmedMessage: 'cancelConfirmed',
        CancelDeniedMessage: 'cancelDenied'
    };

    private static readonly responseTemplates: LanguageTemplateDictionary = new Map([
        ['default', new Map([
            [CancelResponses.responseIds.CancelPrompt, CancelResponses.fromResources('cancel.prompt')],
            [CancelResponses.responseIds.CancelConfirmedMessage, CancelResponses.fromResources('cancel.confirmed')],
            [CancelResponses.responseIds.CancelDeniedMessage, CancelResponses.fromResources('cancel.denied')]
        ])]
    ]);

    constructor() {
        super();
        this.register(new DictionaryRenderer(CancelResponses.responseTemplates));
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }
}