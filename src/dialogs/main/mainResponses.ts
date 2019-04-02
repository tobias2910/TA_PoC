import {
    Activity,
    Attachment,
    CardFactory,
    InputHints,
    MessageFactory,
    TurnContext } from 'botbuilder';
import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Baut die Antworten für den MainDialog auf
 */
export class MainResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        Cancelled: string;
        Completed: string;
        Confused: string;
        Intro: string;
        NoCancel: string;
    } = {
        Cancelled: 'cancelled',
        Completed: 'completed',
        Confused: 'confused',
        Intro: 'intro',
        NoCancel: 'noCancel'
    };

    private static readonly responseTemplates: LanguageTemplateDictionary = new Map ([
        ['default', new Map([
            [MainResponses.responseIds.Cancelled, MainResponses.fromResources('main.cancelDialog')],
            [MainResponses.responseIds.NoCancel, MainResponses.fromResources('main.noCancelDialog')],
            [MainResponses.responseIds.Completed, MainResponses.fromResources('main.askForHelp')],
            [MainResponses.responseIds.Confused, MainResponses.fromResources('main.notUnderstand')],
            [MainResponses.responseIds.Intro,
                // tslint:disable-next-line:no-any
                (context: TurnContext, data: any): Promise<Activity> => MainResponses.buildIntroCard(context, data)]
        ])]
    ]);

    constructor() {
        super();
        this.register(new DictionaryRenderer(MainResponses.responseTemplates));
    }

    // tslint:disable-next-line:no-any
    public static async buildIntroCard(turnContext: TurnContext, data: any): Promise<Activity> {
        const introPath: string = i18n.__('welcomeCard.path');
        // tslint:disable-next-line:no-any non-literal-require
        const introCard: any = require(introPath);
        const attachment: Attachment = CardFactory.adaptiveCard(introCard);
        const response: Partial<Activity> = MessageFactory.attachment(attachment, '', attachment.content.speak, InputHints.AcceptingInput);

        return Promise.resolve(<Activity> response);
    }

    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }
}