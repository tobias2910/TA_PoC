import {
    ChoicePrompt,
    ComponentDialog,
    DialogTurnResult,
    WaterfallDialog,
    WaterfallStepContext} from 'botbuilder-dialogs';
import { HelpResponses } from './helpResponses';

enum dialogIds {
    helpDialog = 'helpDialog',
    helpPrompt = 'helpPrompt'
}

/**
 * Dialog für die Bereitstellung einer Hilfe
 */
export class HelpDialog extends ComponentDialog {

    private static readonly responder: HelpResponses = new HelpResponses();

    constructor () {
        super (HelpDialog.name);
        this.initialDialogId = dialogIds.helpDialog;

        const helpSteps: ((sc: WaterfallStepContext) => Promise<DialogTurnResult>)[] = [
            this.promptUser.bind(this),
            this.answerUser.bind(this)
        ];

        this.addDialog(new WaterfallDialog(dialogIds.helpDialog, helpSteps));
        this.addDialog(new ChoicePrompt(dialogIds.helpPrompt));
    }

    private async promptUser (step: WaterfallStepContext): Promise<DialogTurnResult> {
        return step.prompt(dialogIds.helpPrompt, {
            prompt: await HelpDialog.responder.renderTemplate(step.context,
                                                              HelpResponses.responseIds.helpPrompt,
                                                              <string> step.context.activity.locale),
            choices: HelpResponses.buildPromptOptions()
        });
    }

    private async answerUser (step: WaterfallStepContext): Promise<DialogTurnResult> {
        // tslint:disable-next-line:no-unsafe-any
        switch (step.result.index) {
            case 0:
                await HelpDialog.responder.replyWith(step.context,
                                                     HelpResponses.responseIds.textNr1);
                break;
            case 1:
                await HelpDialog.responder.replyWith(step.context,
                                                     HelpResponses.responseIds.textNr2);
                break;
            case 2:
                await HelpDialog.responder.replyWith(step.context,
                                                     HelpResponses.responseIds.textNr3);
                break;
            case 3:
                await HelpDialog.responder.replyWith(step.context,
                                                     HelpResponses.responseIds.textNr4);
                break;
            default:
                await HelpDialog.responder.replyWith(step.context,
                                                     HelpResponses.responseIds.textDefault);
        }

        return await step.endDialog();
    }
}
