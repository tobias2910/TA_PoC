import {
    Activity,
    ActivityTypes,
    ChannelAccount } from 'botbuilder';

export namespace ActivityExtensions {
    export function createReply(source: Activity, text?: string, local?: string): Activity {
        const reply: string = text || '';

        return {
            channelId: source.channelId,
            conversation: source.conversation,
            from: source.recipient,
            label: source.label,
            locale: local,
            recipient: source.from,
            replyToId: source.id,
            serviceUrl: source.serviceUrl,
            text: reply,
            timestamp: new Date(),
            type: ActivityTypes.Message,
            valueType: source.valueType,
            localTimezone: source.localTimezone,
            listenFor: source.listenFor,
            semanticAction: source.semanticAction
        };
    }

    /**
     * Überprüft, ob es sich um eine Start-Aktiivtät handelt
     */
    export function isStartActivity(activity: Activity): boolean {
        switch (activity.channelId) {
            case 'skype': {
                if (activity.type === ActivityTypes.ContactRelationUpdate && activity.action === 'add') {
                    return true;
                }

                return false;
            }
            case 'directline':
            case 'emulator':
            case 'webchat':
            case 'msteams': {
                if (activity.type === ActivityTypes.ConversationUpdate) {
                    if (activity.membersAdded && activity.membersAdded.some((m: ChannelAccount) => m.id === activity.recipient.id)) {
                        return true;
                    }
                }

                return false;
            }
            default:
                return false;
        }
    }
}