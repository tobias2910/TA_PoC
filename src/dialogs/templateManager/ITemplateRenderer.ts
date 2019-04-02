import { TurnContext } from 'botbuilder-core';

/**
 * Definiert die Schnittstelle für die Datenbindung an die Vorlage und das Rendern eines Strings.
 */
export interface ITemplateRenderer {
    /**
     * Rendert ein Template zu einer Aktivität oder einem String
     * @param turnContext - context
     * @param language - Sprache, die zu Rendern ist
     * @param templateId - Template das zu Rendern ist
     * @param data - Datenobjekt, dass zum Rendern verwendet werden soll
     */
    // tslint:disable-next-line:no-any
    renderTemplate(turnContext: TurnContext, language: string, templateId: string, data: any): Promise<any>;

}