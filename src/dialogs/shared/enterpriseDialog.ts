import { RecognizerResult } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { DialogContext } from 'botbuilder-dialogs';
import { BotServices } from '../../botServices';
import { CancelDialog } from '../cancel/cancelDialog';
import { HelpDialog } from '../help/helpDialog';
import { InterruptableDialog } from './interruptableDialog';
import { InterruptionStatus } from './interruptionStatus';

/**
 * Stellt einen EnterpiseDialog dar, der sämtliche Funktionen bereitstellt, um den Dialog
 * zu unterbrechen bzw. zu beenden
 */
export class EnterpriseDialog extends InterruptableDialog {

    private readonly botServices: BotServices;

    constructor(botServices: BotServices, dialogId: string) {
        super(dialogId);

        this.botServices = botServices;
        this.addDialog(new CancelDialog());
    }

    protected async onDialogInterruption(dc: DialogContext): Promise<InterruptionStatus> {

        // Check dispatch intent.
        const luisService: LuisRecognizer | undefined = this.botServices.luisServices.get('luis_de');
        if (!luisService) {
            return Promise.reject (
                new Error ('Cant find the specified LUIS Model')
            );
        } else {
            const luisResult: RecognizerResult = await luisService.recognize(dc.context);
            const intent: string = LuisRecognizer.topIntent(luisResult);

            switch (intent) {
                case 'Cancel':
                    return this.onCancel(dc);
                case 'Help':
                    return this.onHelp(dc);
                default:
            }
        }

        return InterruptionStatus.NoAction;
    }

    protected async onCancel(dc: DialogContext): Promise<InterruptionStatus> {
        if (dc.activeDialog && dc.activeDialog.id !== CancelDialog.name) {
            // Dont start restart cancel dialog.
            await dc.beginDialog(CancelDialog.name);

            return InterruptionStatus.Waiting;
        }

        return InterruptionStatus.NoAction;
    }

    protected async onHelp(dc: DialogContext): Promise<InterruptionStatus> {
        await dc.beginDialog(HelpDialog.name);

        return InterruptionStatus.Interrupted;
    }
}