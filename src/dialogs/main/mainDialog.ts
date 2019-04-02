import {
    ConversationState,
    RecognizerResult,
    StatePropertyAccessor,
    UserState } from 'botbuilder';
import {
    LuisRecognizer,
    QnAMaker,
    QnAMakerResult } from 'botbuilder-ai';
import { DialogContext } from 'botbuilder-dialogs';
import { BotServices } from '../../botServices';
import { AuthentDialog } from '../authent/authentDialog';
import { ExpenseDialog } from '../expenses/expenseDialog';
import { FarewellDialog } from '../farewell/farewellDialog';
import { GreetingDialog } from '../greeting/greetingDialog';
import { HelpDialog } from '../help/helpDialog';
import { SearchDialog } from '../search/searchDialog';
import { RouterDialog } from '../shared/routerDialog';
import { IExpenseData } from '../shared/stateProperties/expenseData';
import { IUserData } from '../shared/stateProperties/userData';
import { MainResponses } from './mainResponses';

/**
 * Hauptdialog, dass sämtliche angebunde Dialoge steuert
 */
export class MainDialog extends RouterDialog {

    // Eigenschaften
    private readonly botServices: BotServices;
    private readonly userState: UserState;
    private readonly expenseDataAccessor: StatePropertyAccessor<IExpenseData>;
    private readonly userDataAccessor: StatePropertyAccessor<IUserData>;
    private readonly responder: MainResponses = new MainResponses ();

    constructor(botServices: BotServices, conversationState: ConversationState, userState: UserState) {
        super(MainDialog.name);
        if (!botServices) { throw new Error(('Missing parameter.  botServices is required')); }
        if (!conversationState) { throw new Error(('Missing parameter.  conversationState is required')); }
        if (!userState) { throw new Error(('Missing parameter.  userState is required')); }
        this.botServices = botServices;
        this.userState = userState;
        // Prpertys für die Accessors anlegen
        this.expenseDataAccessor = this.userState.createProperty<IExpenseData>('expenseData');
        this.userDataAccessor = this.userState.createProperty<IUserData>('userState');

        this.addDialog(new AuthentDialog(botServices, this.userDataAccessor, this.expenseDataAccessor));
        this.addDialog(new ExpenseDialog(this.userDataAccessor, this.expenseDataAccessor, this.botServices));
        this.addDialog(new FarewellDialog(this.userDataAccessor));
        this.addDialog(new GreetingDialog(this.userDataAccessor));
        this.addDialog(new SearchDialog(botServices));
        this.addDialog(new HelpDialog());
    }

    protected async onStart(dc: DialogContext): Promise<void> {
        const view: MainResponses = new MainResponses();
        await view.replyWith(dc.context, MainResponses.responseIds.Intro);
    }

    protected async route(dc: DialogContext): Promise<void> {
        // Überprüfe zunächst die Ergebnisse des Dispatchers
        const dispatchResult: RecognizerResult = await this.botServices.dispatchRecognizer.recognize(dc.context);
        const topIntent: string = LuisRecognizer.topIntent(dispatchResult);
        // Überprüfe um welchen Dispatch intent es sich handelt
        if (topIntent === 'l_luis_de') {
            // Sollte es um eine LUIS-Anfrage handeln, verarbeite sie
            const luisService: LuisRecognizer | undefined = this.botServices.luisServices.get('luis_de');
            if (!luisService) {
                return Promise.reject(
                    new Error('Cant find the specified LUIS Model'));
            } else {
                const luisResult: RecognizerResult = await luisService.recognize(dc.context);
                const generalIntent: string = LuisRecognizer.topIntent(luisResult);
                // Überprüfe um welchen allgemeinen Intent es sich handelt
                switch (generalIntent) {
                    case 'Cancel': {
                        await this.responder.replyWith(dc.context, MainResponses.responseIds.NoCancel);
                        break;
                    }
                    case 'Farewell': {
                        await dc.beginDialog(FarewellDialog.name);
                        break;
                    }
                    case 'Greeting': {
                        await dc.beginDialog(GreetingDialog.name);
                        break;
                    }
                    case 'Help': {
                        await dc.beginDialog(HelpDialog.name);
                        break;
                    }
                    case 'Search': {
                        await dc.beginDialog(SearchDialog.name, luisResult.entities);
                        break;
                    }
                    case 'TravelExpenses': {
                        const userData: IUserData | undefined = await this.userDataAccessor.get(dc.context);
                        if (userData === undefined) {
                            await dc.beginDialog(AuthentDialog.name);
                        } else {
                            await dc.beginDialog(ExpenseDialog.name);
                        }
                        break;
                    }
                    case 'None':
                    default: {
                        await this.responder.replyWith(dc.context, MainResponses.responseIds.Confused);
                    }
                }
            }
        } else if (topIntent === 'q_qna_de') {
            const qnaService: QnAMaker | undefined = this.botServices.qnaServices.get('qna_de');
            if (!qnaService) {
                return Promise.reject(new Error ('Cant find the specified QnA Model'));
            } else {
                const answers: QnAMakerResult [] = await qnaService.getAnswers(dc.context);

                if (answers && answers.length !== 0) {
                    await dc.context.sendActivity(answers[0].answer);
                }
            }
        } else if (topIntent === 'q_chitchat_de') {
            const qnaService: QnAMaker | undefined = this.botServices.qnaServices.get('chitchat_de');
            if (!qnaService) {
                return Promise.reject(new Error ('Cant find the specified QnA Model'));
            } else {
                const answers: QnAMakerResult [] = await qnaService.getAnswers(dc.context);

                if (answers && answers.length !== 0) {
                    await dc.context.sendActivity(answers[0].answer);
                }
            }
        } else {
            await this.responder.replyWith(dc.context, MainResponses.responseIds.Confused);
        }
    }

    protected async onEvent(dc: DialogContext): Promise<void> {
        if (dc.context.activity.value) {
            // tslint:disable-next-line:no-any
            const value: any = dc.context.activity.value;
            // tslint:disable-next-line:no-unsafe-any
            if (value.action === 'travelExpense') {
                await dc.beginDialog(AuthentDialog.name);
            } else {
                await dc.beginDialog(HelpDialog.name);
            }
        }

        return Promise.resolve(undefined);
    }

    protected async complete(dc: DialogContext): Promise<void> {
        return this.responder.replyWith(dc.context, MainResponses.responseIds.Completed);
    }
}