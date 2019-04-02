import {
    ConversationState,
    TurnContext,
    UserState } from 'botbuilder';
import {
    DialogContext,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus } from 'botbuilder-dialogs';
import { BotServices } from './botServices';
import { MainDialog } from './dialogs/main/mainDialog';

/**
 * Startpunkt des Bots.
 * Diese Klasse ist für die Steuerung des Bots zuständig
 */
export class TravelAssistantBot {
    private readonly botServices: BotServices;
    private readonly conversationState: ConversationState;
    private readonly userState: UserState;
    private readonly dialogs: DialogSet;

    /**
     * Konstruktor des TravelAssistants
     */
    constructor (botServices: BotServices, conversationState: ConversationState,
                 userState: UserState) {
        if (!botServices) { throw new Error(('Missing parameter. botServices is required')); }
        if (!conversationState) { throw new Error(('Missing parameter. conversationState is required')); }
        if (!userState) { throw new Error(('Missing parameter. userState is required')); }

        this.botServices = botServices;
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogs = new DialogSet (this.conversationState.createProperty<DialogState>('TravelAssistantBot'));
        this.dialogs.add(new MainDialog(this.botServices, this.conversationState, this.userState));
    }

    /**
     * Behandelt jede eingehende Nachricht
     *
     * @param context Das aktuelle TurnContext
     */
    public async onTurn (context: TurnContext): Promise<void> {
        const dc: DialogContext = await this.dialogs.createContext(context);
        // tslint:disable-next-line: use-default-type-parameter no-any
        const result: DialogTurnResult<any> = await dc.continueDialog();

        if (result.status === DialogTurnStatus.empty) {
            await dc.beginDialog('MainDialog');
        }
    }
}