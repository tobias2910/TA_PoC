import {
    Activity,
    ActivityTypes } from 'botbuilder';
import {
    ComponentDialog,
    Dialog,
    DialogContext,
    DialogTurnResult,
    DialogTurnStatus} from 'botbuilder-dialogs';
import { ActivityExtensions } from '../../extensions/activityExtensions';

/**
 * Abstrakte Klasse die Funktionen für die Weiterleitung bereitstellt
 */
export abstract class RouterDialog extends ComponentDialog {
    constructor(dialogId: string) { super(dialogId); }

    /**
     * Wird aufgerufen, sobald der Dialog gestartet wird. Leitet automatisch an die
     * onContinueDialog-Funktion weiter
     * @param dc - DialogContext
     */
    protected async onBeginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        return this.onContinueDialog(dc);
    }

    /**
     * Überprüft zunächst, ob es sich um eine Startaktivität handelt. Anschließend wird
     * der Typ der eingehenden Nachricht überprüft.
     * @param dc - DialogContext
     */
    protected async onContinueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        const activity: Activity = dc.context.activity;
        if (ActivityExtensions.isStartActivity(activity)) {
            await this.onStart(dc);
        }
        switch (activity.type) {
            case ActivityTypes.Message: {
                if (activity.value !== undefined) {
                    await this.onEvent(dc);
                } else if (typeof activity.text !== undefined && activity.text ||
                            dc.context.activity.attachments !== undefined) {
                     // tslint:disable-next-line:no-any use-default-type-parameter
                     const result: DialogTurnResult<any> = await dc.continueDialog();
                     switch (result.status) {
                         case DialogTurnStatus.empty: {
                             await this.route(dc);
                             break;
                         }
                         case DialogTurnStatus.complete: {
                             await this.complete(dc);
                             // Beende den aktuellen Dialog
                             await dc.endDialog();
                         }
                         default:
                     }
                }
                break;
            }
            case ActivityTypes.Event: {
                await this.onEvent(dc);
                break;
            }
            default: {
                await this.onSystemMessage(dc);
            }
        }

        return Dialog.EndOfTurn;
    }

    /**
     * Wird aufgerufen, sobald der Dialogstack leer ist
     * @param innerDC - Der Dialogcontext für die Komponente
     */
    protected abstract route(innerDC: DialogContext): Promise <void>;

    /**
     * Wird aufgerufen, sobald sämtliche Dialoge komplett sind
     * @param innerDC - Der Dialogcontext für die Komponente
     */
    protected async complete(innerDC: DialogContext): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Wird aufgerufen, sobald eine Event-Aktivität reinkommt
     * @param innerDC - Der Dialogcontext für die Komponente
     */
    protected async onEvent(innerDC: DialogContext): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Wird aufgerufen, sobald eine System-Nachricht reinkommt
     * @param innerDC - Der Dialogcontext für die Komponente
     */
    protected async onSystemMessage(innerDC: DialogContext): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Wird aufgerufen, sobald ein Nutzer die Unterhaltung betritt
     * @param innerDC - Der Dialogcontext für die Komponente
     */
    protected async onStart(innerDC: DialogContext): Promise<void> {
        return Promise.resolve();
    }
}