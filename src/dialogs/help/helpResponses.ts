import * as i18n from 'i18n';
import {
    DictionaryRenderer,
    LanguageTemplateDictionary,
    TemplateFunction } from '../templateManager/dictionaryRenderer';
import { TemplateManager } from '../templateManager/templateManager';

/**
 * Baut die Antworten für den MainDialog auf
 */
export class HelpResponses extends TemplateManager {

    // Eigenschaften
    public static responseIds: {
        helpPrompt: string;
        optionNr1: string;
        optionNr2: string;
        optionNr3: string;
        optionNr4: string;
        textNr1: string;
        textNr2: string;
        textNr3: string;
        textNr4: string;
        textDefault: string;
    } = {
        helpPrompt: 'helpPrompt',
        optionNr1: 'optionNr1',
        optionNr2: 'optionNr2',
        optionNr3: 'optionNr3',
        optionNr4: 'optionNr4',
        textNr1: 'textNr1',
        textNr2: 'textNr2',
        textNr3: 'textNr3',
        textNr4: 'textNr4',
        textDefault: 'textDefault'
    };

    private static readonly responseTemplate: LanguageTemplateDictionary = new Map ([
        ['default', new Map ([
            [HelpResponses.responseIds.helpPrompt, HelpResponses.fromResources('help.helpPrompt')],
            [HelpResponses.responseIds.textNr1, HelpResponses.fromResources('help.textNr1')],
            [HelpResponses.responseIds.textNr2, HelpResponses.fromResources('help.textNr2')],
            [HelpResponses.responseIds.textNr3, HelpResponses.fromResources('help.textNr3')],
            [HelpResponses.responseIds.textNr4, HelpResponses.fromResources('help.textNr4')],
            [HelpResponses.responseIds.textDefault, HelpResponses.fromResources('help.textDefault')]
        ])]
    ]);

    constructor () {
        super ();
        this.register(new DictionaryRenderer(HelpResponses.responseTemplate));
    }

    public static buildPromptOptions (): string[] {
        return [
            i18n.__('help.optionNr1'),
            i18n.__('help.optionNr2'),
            i18n.__('help.optionNr3'),
            i18n.__('help.optionNr4')
        ];
    }

    // public static async buildHelpCard (turnContext: TurnContext, data: any): Promise<Activity> {
    //     const title: string = i18n.__('help.title');
    //     const text: string = i18n.__('help.text');
    //     const attachment: Attachment = CardFactory.heroCard(title, text);
    //     const response: Partial<Activity> = MessageFactory.attachment(attachment, text, InputHints.AcceptingInput);

    //     response.suggestedActions = {
    //         actions: [
    //         {
    //             title: i18n.__('help.optionNr1'),
    //             type: ActionTypes.ImBack,
    //             value: i18n.__('help.optionNr1')
    //         },
    //         {
    //             title: i18n.__('help.optionNr2'),
    //             type: ActionTypes.ImBack,
    //             value: i18n.__('help.optionNr2')
    //         },
    //         {
    //             title: i18n.__('help.optionNr3'),
    //             type: ActionTypes.ImBack,
    //             value: i18n.__('help.optionNr3')
    //         },
    //         {
    //             title: i18n.__('help.optionNr4'),
    //             type: ActionTypes.ImBack,
    //             value: i18n.__('help.optionNr4')
    //         }
    //         ],
    //         to: []
    //     };

    //     return Promise.resolve(<Activity> response);
    // }

    /**
     * Bezieht den String entsprechend der ID aus der locale-Datei
     *
     * @param name - Id des Strings das sich innerhalb der locale-Datei befindent
     */
    private static fromResources(name: string): TemplateFunction {
        return (): Promise<string> => Promise.resolve(i18n.__(name));
    }
}