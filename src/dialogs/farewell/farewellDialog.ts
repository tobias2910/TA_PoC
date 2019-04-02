import { StatePropertyAccessor } from 'botbuilder-core';
import {
    ComponentDialog,
    DialogContext,
    DialogTurnResult } from 'botbuilder-dialogs';
import { FarewellResponses } from '../farewell/farewellResponses';
import { IUserData } from '../shared/stateProperties/userData';

/**
 * Dialog für das Verabschieden des Nutzres
 */
export class FarewellDialog extends ComponentDialog {
    // Eigenschaften festlegen
    private readonly userDataAccesor: StatePropertyAccessor;
    private static readonly responder: FarewellResponses = new FarewellResponses ();

    constructor (userDataAccessor: StatePropertyAccessor) {
        super (FarewellDialog.name);
        this.initialDialogId = FarewellDialog.name;
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
            await FarewellDialog.responder.replyWith(dc.context,
                                                     FarewellResponses.responseIds.FarewellUser,
                                                     userData);
        } else {
            await FarewellDialog.responder.replyWith(dc.context,
                                                     `${FarewellResponses.responseIds.FarewellNr}${this.generateRandomNumber()}`);
        }

        return await dc.endDialog();
    }

    /**
     * Gibt eine zufällig ausgewählte Abschiedsnachricht zurück
     *
     * @param dc - DialogContext
     */
    private generateRandomNumber (): number {
        return Math.floor(Math.random() * FarewellResponses.getResponseNumbers()) + 1;
    }
}