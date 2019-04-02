import { TurnContext } from 'botbuilder-core';
import { ITemplateRenderer } from './ITemplateRenderer';

// tslint:disable-next-line:no-any
export declare type TemplateFunction = (turnContext: TurnContext, data: any) => Promise<any>;

/**
 * Eine Map mit den Template IDs und den Template Funktionen
 */
export declare type TemplateIdMap = Map<string, TemplateFunction>;

/**
 * Eine Map mit der Sprache und den TemplateIdMaps
 */
export declare type LanguageTemplateDictionary = Map<string, TemplateIdMap | undefined>;

/**
 * Das ist eine simple Template engine, die über eine Map mit Templatefunktionen verfügt
 * let myTemplates  = {
 *      "en" : {
 *        "templateId": (context, data) => $"your name  is {data.name}",
 *        "templateId": (context, data) => { return new Activity(); }
 *    }`
 * }
 * }
 *  Um diese zu verwenden, reicht eine Registrierung mit dem templateManager aus
 *  templateManager.register(new DictionaryRenderer(myTemplates))
 */
export class DictionaryRenderer implements ITemplateRenderer {
    // tslint:disable-next-line:prefer-readonly
    private languages: LanguageTemplateDictionary;

    constructor(templates: LanguageTemplateDictionary) {
        this.languages = templates;
    }

    // tslint:disable-next-line:no-any
    public async renderTemplate(turnContext: TurnContext, language: string, templateId: string, data: any): Promise<any> {
        const templates: TemplateIdMap | undefined = this.languages.get(language);
        if (templates) {
            const template: TemplateFunction | undefined = templates.get(templateId);
            if (template) {
                // tslint:disable-next-line:no-any
                const result: Promise<any> = template(turnContext, data);
                if (result) {
                    return result;
                }
            }
        }

        return Promise.resolve(undefined);
    }
}