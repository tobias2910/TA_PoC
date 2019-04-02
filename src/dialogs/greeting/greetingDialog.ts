import { StatePropertyAccessor } from 'botbuilder-core';
import { ComponentDialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { GreetingResponses } from '../greeting/greetingResponses';
import { IUserData } from '../shared/stateProperties/userData';

/**
 * Dialog für das Verabschieden des Nutzres
 */
export class GreetingDialog extends ComponentDialog {
    // Eigenschaften festlegen
    private readonly userDataAccesor: StatePropertyAccessor;
    private static readonly responder: GreetingResponses = new GreetingResponses ();

    constructor (userDataAccessor: StatePropertyAccessor) {
        super (GreetingDialog.name);
        this.initialDialogId = GreetingDialog.name;
        // Save the arguments
        this.userDataAccesor = userDataAccessor;
    }

    /**
     * Wird beim starten des Dialogs automatisch aufgerufen.
     * @param dc - DialogCOntext
     * @param options - optionen
     */
    public async beginDialog (dc: DialogContext, options?: any): Promise<DialogTurnResult> {
        const userData: IUserData = <IUserData> await this.userDataAccesor.get (dc.context);

        if (userData !== undefined) {
            await GreetingDialog.responder.replyWith(dc.context,
                                                     GreetingResponses.responseIds.GreetingUser,
                                                     userData);
        } else {
            await GreetingDialog.responder.replyWith(dc.context,
                                                     `${GreetingResponses.responseIds.GreetingNr}${this.generateRandomNumber()}`);
        }

        return await dc.endDialog();
    }

    /**
     * Gibt eine zufällig ausgewählte Abschiedsnachricht zurück
     *
     * @param dc - DialogContext
     */
    private generateRandomNumber (): number {

        return Math.floor(Math.random() * GreetingResponses.getResponseNumbers()) + 1;
    }
}