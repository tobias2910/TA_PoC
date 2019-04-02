import { TurnContext } from 'botbuilder-core';
import {
        Activity,
        ActivityTypes} from 'botframework-schema';
import { ITemplateRenderer } from './ITemplateRenderer';

/**
 * Verwaltet die registrierten Templates
 */
export class TemplateManager {
    // tslint:disable-next-line:prefer-readonly
    private templateRenders: ITemplateRenderer[] = [];
    private languageFallback: string[] = [];

    /**
     * Registriert den übergebenen renderer, sollte dieser noch nicht in dem Array vorhanden sein
     */
    public register(renderer: ITemplateRenderer): TemplateManager {
        if (!this.templateRenders.some((x: ITemplateRenderer) => x === renderer)) {
            this.templateRenders.push(renderer);
        }

        return this;
    }

    /**
     * Listet alle registrierten template engines
     */
    public list(): ITemplateRenderer[] {
        return this.templateRenders;
    }

    public setLanguagePolicy(languageFallback: string[]): void {
        this.languageFallback = languageFallback;
    }

    public getLanguagePolicy(): string[] {
        return this.languageFallback;
    }

    /**
     * Sended eine Antwort mittels des Templates
     */
    // tslint:disable-next-line:no-any
    public async replyWith(turnContext: TurnContext, templateId: string, data?: any): Promise<void> {
        if (!turnContext) { throw new Error ('no turnContext'); }

        // Template anwenden
        const boundActivity: Activity | undefined = await this.renderTemplate(turnContext, templateId, turnContext.activity.locale, data);
        if (boundActivity !== undefined) {
            await turnContext.sendActivity(boundActivity);

            return;
        }

        return;
    }

    /**
     * Gibt den benötigten String anhand der Id zurück
     *
     * @param turnContext - Aktueller Context
     * @param templateId - Zu verwendende DialogId
     * @param language - Sprache
     * @param data - Weitere Daten
     */
    public async renderTemplate (turnContext: TurnContext,
                                 templateId: string,
                                 // tslint:disable-next-line:no-any
                                 language?: string, data?: any): Promise<Activity | undefined> {
        const fallbackLocales: string [] = this.languageFallback;

        if (language) {
            fallbackLocales.push(language);
        }

        fallbackLocales.push('default');

        for (const locale of fallbackLocales) {
            for (const renderer of this.templateRenders) {
                // tslint:disable-next-line:no-any
                const templateOutput: any = await renderer.renderTemplate(turnContext, locale, templateId, data);
                if (templateOutput) {
                    if (typeof templateOutput === 'string' || templateOutput instanceof String) {
                        const def : Partial <Activity> = { type: ActivityTypes.Message, text: <string> templateOutput};

                        return <Activity> def;
                    } else {
                        return <Activity> templateOutput;
                    }
                }
            }
        }

        return undefined;
    }
}