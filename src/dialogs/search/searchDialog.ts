import { ComponentDialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { Bing } from '../../API/bing';
import { BotServices } from '../../botServices';
import { IBingSearchData } from '../../types/apiTypes';
import { MessageFactory, Activity, CardFactory, ActionTypes } from 'botbuilder';

/**
 * Dialog für das Anzeigen eines Suchbefehls
 */
export class SearchDialog extends ComponentDialog {

    // Eigenschaften festlegen
    private readonly bing: Bing;

    constructor (botServices: BotServices) {
        super (SearchDialog.name);
        this.bing = < Bing > botServices.genericServices.get('bing');
        if (!this.bing) { throw new Error ('Cant find the specified Bing-Service'); }
    }

    public async beginDialog(dc: DialogContext, options?: any): Promise < DialogTurnResult > {
        const bingResult: IBingSearchData | undefined = await this.bing.getSearchResults(options.searchFor[0]);
        if (!bingResult) {
            await dc.context.sendActivity('Keine Ergebnisse gefunden');
        } else {
            await dc.context.sendActivity(this.buildResultCard(bingResult));
        }

        return await dc.endDialog();
    }

    private buildResultCard(bingResult: IBingSearchData): Activity  {
        const resultCard: Partial < Activity > = MessageFactory.attachment(
            CardFactory.heroCard(
                bingResult.webPages.value[0].name,
                [bingResult.images.value[0].thumbnailUrl],
                [{
                    type: ActionTypes.OpenUrl,
                    title: 'Webseite öffnen',
                    value: bingResult.webPages.value[0].url
                }]
            )
        );

        return < Activity > resultCard;
    }
}