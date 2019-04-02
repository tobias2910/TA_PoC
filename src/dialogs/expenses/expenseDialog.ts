import { StatePropertyAccessor } from 'botbuilder-core';
import {
    AttachmentPrompt,
    ChoicePrompt,
    ConfirmPrompt,
    DialogTurnResult,
    PromptOptions,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext} from 'botbuilder-dialogs';
import { CustomVision } from '../../API/customVision';
import { Docparser } from '../../API/docparser';
import { UiPath } from '../../API/uiPath';
import { BotServices } from '../../botServices';
import { IPredictionData } from '../../types/apiTypes';
import { EnterpriseDialog } from '../shared/enterpriseDialog';
import { IExpenseData, IInvoiceData } from '../shared/stateProperties/expenseData';
import { IUserData } from './../shared/stateProperties/userData';
import { ExpenseResponses } from './expenseResponses';

enum dialogIds {
    generalDialog = 'generalDialog',
    receiveDialog = 'receiveDialog',
    generalPrompt = 'projectNrPrompt',
    confirmPrompt = 'confirmPrompt',
    receivePrompt = 'receivePrompt',
    choicePrompt = 'choicePrompt'
}

/**
 * Dialog für den Bezug der Reisedaten
 */
export class ExpenseDialog extends EnterpriseDialog {

    // Eigenschaften festlegen
    private readonly userDataAccessor: StatePropertyAccessor;
    private readonly expenseDataAccessor: StatePropertyAccessor;
    private readonly expenseData: IExpenseData = {
        adress: '',
        departDate: '',
        invoice: [],
        occasion: '',
        projectNr: '',
        returnDate: ''
    };
    private invoiceData: IInvoiceData = {
        invoiceDate: '',
        invoiceName: '',
        invoiceTotal: '',
        invoiceType: ''
    }
    private userData: IUserData = {
        faceId: '',
        firstName: '',
        lastName: '',
        mail: '',
        userId: ''
    };
    private readonly customVisionAPI: CustomVision;
    private readonly docparserAPI: Docparser;
    private readonly uipathAPI: UiPath;
    private static readonly responder: ExpenseResponses = new ExpenseResponses();

    constructor(userDataAccessor: StatePropertyAccessor,
                expenseDataAccessor: StatePropertyAccessor, botServices: BotServices) {
        super(botServices, ExpenseDialog.name);
        // Überprüfe, ob die notwendigen Parameter übergeben worden sind
        if (!botServices) { throw Error('Missing parameter. botServices are required'); }
        if (!userDataAccessor) { throw Error('Missing parameter. userDataAccessor is required'); }
        if (!expenseDataAccessor) { throw Error('Missing parameter. expenseDataAccessor is required'); }
        // Lege den Startdialog fest
        this.initialDialogId = dialogIds.generalDialog;
        // Beziehe die benötigten Services aus der BotService Instanz
        this.customVisionAPI = < CustomVision > botServices.genericServices.get('customVision');
        this.docparserAPI = < Docparser > botServices.genericServices.get('docparser');
        this.uipathAPI = < UiPath > botServices.genericServices.get('uiPath');
        if (!this.customVisionAPI) { throw new Error ('Cant find the specified CustomVision service'); }
        if (!this.docparserAPI) { throw new Error ('Cant find the specified Docparser service'); }
        if (!this.uipathAPI) { throw new Error ('Cant find the specified UiPath service'); }
        // Erstelle die einzelnen WaterfallSteps
        const generalDialogSteps: ((sc: WaterfallStepContext) => Promise<DialogTurnResult>)[] = [
            this.promptForProjectNr.bind(this),
            this.promptForOccasion.bind(this),
            this.promptForAdress.bind(this),
            this.promptForDeparture.bind(this),
            this.promptForReturn.bind(this),
            this.listData.bind(this),
            this.confirmData.bind(this)
        ];
        const receiveDialogSteps: ((sc: WaterfallStepContext) => Promise<DialogTurnResult>)[] = [
            this.sendReceivePrompt.bind(this),
            this.sendReceiveToDocparser.bind(this),
            this.confirmRecognizedData.bind(this),
            this.finalDialog.bind(this)
        ];
        // Registriere die Dialoge
        this.addDialog(new WaterfallDialog(dialogIds.generalDialog, generalDialogSteps));
        this.addDialog(new WaterfallDialog(dialogIds.receiveDialog, receiveDialogSteps));
        // Register the text prmopts
        this.addDialog(new TextPrompt(dialogIds.generalPrompt));
        this.addDialog(new ConfirmPrompt(dialogIds.confirmPrompt));
        this.addDialog(new AttachmentPrompt(dialogIds.receivePrompt));
        this.addDialog(new ChoicePrompt(dialogIds.choicePrompt));
        // Speichere die Accessoren
        this.userDataAccessor = userDataAccessor;
        this.expenseDataAccessor = expenseDataAccessor;
    }

    private async promptForProjectNr(step: WaterfallStepContext): Promise<DialogTurnResult> {
        return step.prompt (dialogIds.generalPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.projcectNrPrompt,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async promptForOccasion(step: WaterfallStepContext): Promise<DialogTurnResult> {
        this.expenseData.projectNr = < string > step.result;

        return step.prompt(dialogIds.choicePrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.travelOccasion,
                                                                 < string > step.context.activity.locale),
            choices: ExpenseResponses.getPromptOptions()
        });
    }

    private async promptForAdress(step: WaterfallStepContext): Promise<DialogTurnResult> {
        this.expenseData.occasion = < string > step.result.value;

        return step.prompt(dialogIds.generalPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.travelAdress,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async promptForDeparture(step: WaterfallStepContext): Promise<DialogTurnResult> {
        this.expenseData.adress = < string > step.result;

        return step.prompt(dialogIds.generalPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.departDate,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async promptForReturn(step: WaterfallStepContext): Promise<DialogTurnResult> {
        this.expenseData.departDate = < string > step.result;

        return step.prompt(dialogIds.generalPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.returnDate,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async listData(step: WaterfallStepContext): Promise<DialogTurnResult> {
        this.expenseData.returnDate = < string > step.result;
        // this.expenseData.returnDate = step.context.activity.value.returnDate;
        this.userData = <IUserData> await this.userDataAccessor.get(step.context);
        await ExpenseDialog.responder.replyWith(step.context,
                                                ExpenseResponses.responseIds.summaryTitel,
                                                this.userData);
        await ExpenseDialog.responder.replyWith(step.context,
                                                ExpenseResponses.responseIds.summary,
                                                this.expenseData);

        return await step.prompt(dialogIds.confirmPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.confirmSum,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async confirmData(step: WaterfallStepContext): Promise<DialogTurnResult> {
        if (step.result === true) {
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.contin);
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.receiveInfo);

            return await step.beginDialog(dialogIds.receiveDialog);
        } else {
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.tryAgain);

            return await step.replaceDialog(dialogIds.generalDialog);
        }
    }

    private async sendReceivePrompt(step: WaterfallStepContext): Promise<DialogTurnResult> {
        return await step.prompt(dialogIds.receivePrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.uploadPrompt,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async sendReceiveToDocparser(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const result: IPredictionData = await this.customVisionAPI.classificateImage(step.result[0].contentUrl);
        const topTag: string = this.customVisionAPI.getTopTag(result);
        const parserlist = await this.docparserAPI.getParserList();
        const parserID: string = this.getParserId(parserlist, topTag);
        const documentID = await this.docparserAPI.sendDocument(step.result[0].contentUrl, parserID);
        await ExpenseDialog.responder.replyWith(step.context,
                                                ExpenseResponses.responseIds.thxReceive);
        await ExpenseDialog.responder.replyWith(step.context,
                                                ExpenseResponses.responseIds.recognizing);
        // INNERHALB DOCPARSER API SAUBER IMPLEMENTIEREN UND ANSCHLIE?END VON HIER ENTFERNEN!
        await this.timeout(3000);
        const recData = await this.docparserAPI.getDocumentData(documentID, parserID);
        this.invoiceData.invoiceType = topTag;
        this.invoiceData.invoiceName = `${recData.invoice_issuer.first} ${recData.invoice_issuer.last}`;
        this.invoiceData.invoiceDate = recData.invoice_date.match;
        this.invoiceData.invoiceTotal = recData.totals.total;
        await ExpenseDialog.responder.replyWith(step.context,
                                                ExpenseResponses.responseIds.receiveSummary,
                                                this.invoiceData);

        return await step.prompt(dialogIds.confirmPrompt, {
            prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                 ExpenseResponses.responseIds.receiveOk,
                                                                 < string > step.context.activity.locale)
        });
    }

    private async confirmRecognizedData(step: WaterfallStepContext): Promise<DialogTurnResult> {
        if (step.result === true) {
            this.addInvoiceToArray();

            return await step.prompt(dialogIds.confirmPrompt, {
                prompt: await ExpenseDialog.responder.renderTemplate(step.context,
                                                                     ExpenseResponses.responseIds.addReceive,
                                                                     < string > step.context.activity.locale)
            });
        } else {
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.tryAgain);

            return await step.replaceDialog(dialogIds.receiveDialog);
        }
    }

    private async finalDialog(step: WaterfallStepContext): Promise<DialogTurnResult> {
        if (step.result === false) {
            await this.expenseDataAccessor.set(step.context, this.expenseData);
            this.uipathAPI.apiController(this.userData, this.expenseData);
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.finish1);
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.finish2);

            return await step.endDialog();
        } else {
            await ExpenseDialog.responder.replyWith(step.context,
                                                    ExpenseResponses.responseIds.again);

            return await step.replaceDialog(dialogIds.receiveDialog);
        }
    }

    private addInvoiceToArray (): void {
        this.expenseData.invoice.push(this.invoiceData);
        this.invoiceData = {
            invoiceDate: '',
            invoiceName: '',
            invoiceTotal: '',
            invoiceType: ''
        };
    }

    /**
     * Helper function for identifacting the corresponding parser
     *
     * @param {any} parserList
     * @param {string} topTag
     */
    private getParserId(parserList: any, topTag: string): string {
        let result: string = '';
        parserList.forEach((parser: any) => {
            if (parser.label === topTag) {
                result = parser.id;
            }
        });

        // Default parser nutzen
        return result;
    }

    /**
     * ENTFERNEN
     */
    private async timeout(timeout: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }
}