import { ComponentDialog, Dialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { HelpDialog } from '../help/helpDialog';
import { InterruptionStatus } from './interruptionStatus';

/**
 * Document
 */
export abstract class InterruptableDialog extends ComponentDialog {
    constructor(dialogId: string) { super(dialogId); }

    protected async onContinueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        const status: InterruptionStatus = await this.onDialogInterruption(dc);

        if (status === InterruptionStatus.Interrupted) {
            if (dc.activeDialog) {
                if (dc.activeDialog.id !== HelpDialog.name) {
                    // Resume the waiting dialog after interruption.
                    await dc.repromptDialog();
                }
            }

            return Dialog.EndOfTurn;
        } else if (status === InterruptionStatus.Waiting) {
            // Stack is already waiting for a response, shelve innner stack.
            return Dialog.EndOfTurn;
        }

        return super.onContinueDialog(dc);
    }

    protected abstract onDialogInterruption(dc: DialogContext): Promise<InterruptionStatus>;
}