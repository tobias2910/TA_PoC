import {
    Attachment,
    StatePropertyAccessor } from 'botbuilder-core';
import {
    AttachmentPrompt,
    DialogTurnResult,
    PromptValidatorContext,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext} from 'botbuilder-dialogs';
import { RowDataPacket } from 'mysql';
import { FaceAPI } from '../../API/faceAPI';
import { MySql } from '../../API/mysql';
import { BotServices } from '../../botServices';
import { ExpenseDialog } from '../expenses/expenseDialog';
import { EnterpriseDialog } from '../shared/enterpriseDialog';
import { IUserData } from '../shared/stateProperties/userData';
import { AuthentResponses } from './authentResponses';

enum DialogIds {
    faceDialog = 'faceDialog',
    loginDialog = 'loginDialog',
    attachPrompt = 'attachPrompt',
    secretPrompt = 'secretPrompt'
}

/**
 * Dialog für die Authentifizierung des Nutzers
 */
export class AuthentDialog extends EnterpriseDialog {

    // Eigenschaften
    private readonly userData: IUserData = {
        userId: '',
        firstName: '',
        lastName: '',
        mail: '',
        faceId: ''
    };
    private readonly userDataAccessor: StatePropertyAccessor;
    private readonly expenseDataAccesor: StatePropertyAccessor;
    private readonly faceAPI: FaceAPI;
    private readonly mySQL: MySql;
    private static readonly responder: AuthentResponses = new AuthentResponses ();

    constructor(botServices: BotServices, userDataAccessor: StatePropertyAccessor,
                expenseDataAccessor: StatePropertyAccessor) {
        super(botServices, AuthentDialog.name);
        // Überprüfe, ob die notwendigen Parameter übergeben worden sind
        if (!botServices) { throw Error('Missing parameter. botServices are required'); }
        if (!userDataAccessor) { throw Error('Missing parameter. userDataAccessor is required'); }
        if (!expenseDataAccessor) { throw Error('Missing parameter. expenseDataAccessor is required'); }
        // Lege den Startdialog fest
        this.initialDialogId = DialogIds.faceDialog;
        // Speichere die übergebenen Parameter
        this.userDataAccessor = userDataAccessor;
        this.expenseDataAccesor = expenseDataAccessor;
        // Initialisiere die Schnittstellen
        this.faceAPI = <FaceAPI> botServices.genericServices.get('faceAPI');
        this.mySQL = <MySql> botServices.genericServices.get('mySQL');
        // Prüfe ob Services gefunden werden konnten
        if (!this.faceAPI) { throw new Error ('Cant find the specified FaceAPI service'); }
        if (!this.mySQL) { throw new Error ('Cant find the specified mySQL service'); }
        // Definiere die Schritte für die Wasserfalldialoge
        const faceSteps: ((sc: WaterfallStepContext) => Promise<DialogTurnResult>)[] = [
            this.promptForImageStep.bind(this),
            this.identificateFaceId.bind(this),
            this.detectPersonId.bind(this)
        ];
        const loginSteps: ((sc: WaterfallStepContext) => Promise<DialogTurnResult>)[] = [
            this.getEmployeeName.bind(this),
            this.checkSecurityPassword.bind(this),
            this.greetUser.bind(this)
        ];
        // Registriere die Wasserfalldialoge
        this.addDialog(new WaterfallDialog(DialogIds.faceDialog, faceSteps));
        this.addDialog(new WaterfallDialog(DialogIds.loginDialog, loginSteps));
        // Registriere die Prompts
        this.addDialog(new AttachmentPrompt(DialogIds.attachPrompt));
        this.addDialog(new TextPrompt(DialogIds.secretPrompt, this.passwortValidator.bind(this)));
        // Stelle die Verbindung zum mySQL-Server auf
        this.mySQL.connectToDB();
        this.addDialog(new ExpenseDialog (this.userDataAccessor, this.expenseDataAccesor, botServices));
    }

    /**
     * Prompt the user to upload a photo.
     *
     * @param step - StepContext
     */
    private async promptForImageStep (step: WaterfallStepContext): Promise<DialogTurnResult> {
        return step.prompt(DialogIds.attachPrompt, {
            prompt: await AuthentDialog.responder.renderTemplate(
                step.context,
                AuthentResponses.responseIds.facePrompt,
                <string> step.context.activity.locale)
        });
    }

    /**
     * Calls the FaceApi to get a FaceId for the photo passed.
     *
     * @param step - StepContext
     */
    private async identificateFaceId (step: WaterfallStepContext): Promise<DialogTurnResult> {
        // Check if the result of the previous step contains a contentUrl
        // tslint:disable-next-line:no-unsafe-any
        const attachments: Attachment = <Attachment> step.result[0];
        if (attachments.contentUrl === undefined) {
            await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.wrongType);

            // Beginn the dialog again
            return await step.replaceDialog(DialogIds.faceDialog);
        } else {
            // Get the faceID
            const faceID: string = await this.faceAPI.getDetectedFaceId(attachments.contentUrl);
            // Check if FaceAPI was able to identify a face
            if (faceID === undefined) {
                await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.faceNA);
                await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.repromptFace);

                return await step.replaceDialog(DialogIds.faceDialog);
            } else {
                return await step.next(faceID);
            }
        }
    }
    /**
     * Checks whether the recognized face matches a face within the
     * PersonGroup. If yes, the corresponding PersonId is returned.
     *
     * @param step - StepContext
     */
    private async detectPersonId (step: WaterfallStepContext): Promise<DialogTurnResult> {
        const personId: string = await this.faceAPI.getIdentifiedPersonId(<string> step.result);
        if (personId === undefined) {
            await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.notInPersGrp);
            await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.registPrompt);

            return await step.replaceDialog(DialogIds.faceDialog);
        } else {
            this.userData.faceId = personId;

            return await step.beginDialog(DialogIds.loginDialog);
        }
    }
    /**
     * Based on the previously recognized personID, the required data is now
     * retrieved from the database. This includes the first name and surname
     * as well as the employee ID.
     *
     * @param step - StepContext
     */
    private async getEmployeeName (step: WaterfallStepContext): Promise<DialogTurnResult> {
        const result: undefined | RowDataPacket = await this.mySQL.getUserData(this.userData.faceId);
        if (result === undefined) {
            await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.notInDb);
            await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.registPrompt);

            return await step.endDialog();
        } else {
            // Save the data within the userData object
            this.userData.firstName = <string> result.firstName;
            this.userData.lastName = <string> result.lastName;
            this.userData.userId = <string> result.personId;
            this.userData.mail = <string> result.mail;

            return await step.next();
        }
    }
    /**
     * Checks, if  the provided password is correct. Therefore the prompt
     * has it own validator.
     *
     * @param step - StepContext
     */
    private async checkSecurityPassword (step: WaterfallStepContext): Promise<DialogTurnResult> {
        await AuthentDialog.responder.replyWith(
            step.context, AuthentResponses.responseIds.greetingWithName, {
                firstName: this.userData.firstName,
                lastName: this.userData.lastName
        });
        await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.passwordInfo);

        return step.prompt(DialogIds.secretPrompt, {
           prompt: await AuthentDialog.responder.renderTemplate(
                                step.context,
                                AuthentResponses.responseIds.passwordPrompt,
                                <string> step.context.activity.locale
        )});
    }

    /**
     * Inform the user that everything is set and he can start.
     * This function is also saving the userData within the userState.
     *
     * @param step - StepContext
     */
    private async greetUser (step: WaterfallStepContext): Promise<DialogTurnResult> {
        // Save the userData within the userState
        await this.userDataAccessor.set(step.context, this.userData);
        this.mySQL.disconectFromDb();
        await AuthentDialog.responder.replyWith(
            step.context, AuthentResponses.responseIds.thanks, {
                firstName: this.userData.firstName
        });
        await AuthentDialog.responder.replyWith(step.context, AuthentResponses.responseIds.confirm);

        return await step.beginDialog(ExpenseDialog.name);
    }

    /**
     * Checks if the provided security passwort is right.
     *
     * @param validatorContext - Context to validate
     */
    private async passwortValidator (validatorContext: PromptValidatorContext<string>): Promise <boolean> {
        const valueToCheck: string | undefined = validatorContext.recognized.value;
        if (!valueToCheck) { throw new Error ('Value not recognized'); }
        const result: boolean = await this.mySQL.validatePassword(this.userData.userId, valueToCheck);
        if (result === true) {
            return true;
        } else {
            await AuthentDialog.responder.replyWith(validatorContext.context, AuthentResponses.responseIds.wrongPw);
            await AuthentDialog.responder.replyWith(validatorContext.context, AuthentResponses.responseIds.repromptPw);

            return false;
        }
    }
}