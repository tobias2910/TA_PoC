import {
    AutoSaveStateMiddleware,
    BotFrameworkAdapter,
    ConversationState,
    ShowTypingMiddleware,
    TurnContext,
    UserState} from 'botbuilder';
import { BlobStorage } from 'botbuilder-azure';
import {
    BlobStorageService,
    BotConfiguration,
    IBlobStorageService,
    IBotConfiguration,
    IConnectedService,
    IEndpointService,
    ServiceTypes} from 'botframework-config';
import { config } from 'dotenv';
import * as i18n from 'i18n';
import * as path from 'path';
import * as restify from 'restify';
import { BotServices } from './botServices';

// Importiere den eigentlichen Bot
import { TravelAssistantBot } from './travelAssistantBot';

// Lege die Einstellungen für i18n fest
i18n.configure({
    directory: path.join(__dirname, '..', 'locales'),
    defaultLocale: 'de',
    objectNotation: true
});

// Funktion zum überprüfen, ob ein Service in der botConfig-Datei vorhanden ist
function searchService (botConfig: IBotConfiguration, serviceType: ServiceTypes, nameOrId: string): IConnectedService|undefined {
    const service: IConnectedService|undefined = botConfig.services
        // Array-Funktionen, um zunächst die Elemente zu Filtern und anschließend in den Ergebnissen
        // nach dem übergebenen Namen zu suchen
        .filter((s: IConnectedService) => s.type === serviceType)
        .find((s: IConnectedService) => s.id === nameOrId || s.name === nameOrId);
    // Sollte der Service innerhalb des Service-Arrays nicht gefunden worden sein
    // muss eine Fehlermeldung ausgeworfen werden
    if (!service && nameOrId) {
        throw new Error(`Service '${nameOrId}' [type: ${serviceType}] not found in .bot file.`);
    }

    // Falls der Service gefunden wurde, wird der Service zurück gegeben
    return service;
}

// Baut den Pfad zur .env-Datei auf und liest diese anschließend ein
// Dadurch stehen die Variablen innerhalb der Datei in dem env-Objekt
// des aktuellen Prozesses zur Verfügung
const ENV_FILE: string = path.join (__dirname, '..' , '.env');
config ({path: ENV_FILE});

// Baue den Pfad zur .bot-Datei auf und lese den Secret-Key ein
const CONFIG_PATH: string = path.join(__dirname, '..', process.env.BOT_FILE_PATH || '.bot');
const BOT_SECRET: string = process.env.BOT_FILE_SECRET || '';

// Versucht die Datei einzulesen
try {
    require.resolve(CONFIG_PATH);
} catch (err) {
    throw new Error ('Error reading the bot-file');
}

// Liest die .bot-Datei ein und speichert sie das Objekt
const BOT_CONFIG: BotConfiguration = BotConfiguration.loadSync(CONFIG_PATH, BOT_SECRET);
const ENDPOINT_CONFIG: IEndpointService = <IEndpointService> searchService(BOT_CONFIG, ServiceTypes.Endpoint, 'TravelExpense');

// Der Adapter ist dafür zuständig, die eingehende JSON innerhalb des HTTP Post-Bodys zu erhalten, zu deserialisieren und
// daraus ein acitivty-Objekt zu erstellen. Dieser wird innerhalb der Methode adapter.processActivity() anschließend in
// den TurnContext umgewandelt. Das ganze läuft wie folgt ab: Der Botframework Service sendet dem  Web Server (restify)
// bei einer eingehenden Nachricht, eine POST Anfrage die auch benötigte Information im Form eines JSON enthält.
// Anschließend wird diese an den Adapter übergeben, der daraus das TurnContext-Objekt erstellt und diesen schlussendlich dem Bot übergibt
const ADAPTER: BotFrameworkAdapter = new BotFrameworkAdapter ({
    appId: ENDPOINT_CONFIG.appId || process.env.microsoftAppID,
    appPassword: ENDPOINT_CONFIG.appPassword || process.env.microsoftAppPassword
});

// Diese Middleware ist dafür zuständig, bei Eingang einer Nachricht, dem Benutzer einen Schreibindikator anzuzeigen
// Es KANN sowohl die Verzögerung als auch die Dauer angegeben werden. Default liegt hier bei 500 und 2000
ADAPTER.use(new ShowTypingMiddleware (0, 1000));

// Der MemomoryStorage dient ausschließlich der lokalen Entwicklung
// const MEMORY_STORAGE: MemoryStorage = new MemoryStorage ();
// Ein Speicher, der sich innerhalb von Azure befindet und der in diesme Fall dazu dient,
// die Unterhaltungen zu speichern
const BLOB_CONFIGURATION: string = process.env.BLOB_NAME || 'blob';
const BLOB_CONFIG: IBlobStorageService = <IBlobStorageService> searchService(
    BOT_CONFIG, ServiceTypes.BlobStorage, BLOB_CONFIGURATION);
const BLOB_STORAGE: BlobStorageService = new BlobStorageService(BLOB_CONFIG);
if (!BLOB_STORAGE) {
    // tslint:disable-next-line:no-console
    console.log('Please configure your Blob storage connection in your .bot file.');
    throw new Error ('Missing Blob configuration');
}
const STATE_STORAGE: BlobStorage = new BlobStorage ({
    containerName: BLOB_STORAGE.container,
    storageAccountOrConnectionString: BLOB_STORAGE.connectionString
});

// Den einzelnen States muss der Speicherort (z. B. MemoryStorage) übergeben werden
// Dadurch kann der jeweilige State aus dem Speicher lesen und schreiben
const CONVERSATION_STATE: ConversationState = new ConversationState (STATE_STORAGE);
const USER_STATE: UserState = new UserState (STATE_STORAGE);

// Diese Middleware ist dafür zuständig, die einzelnen States automatisch zu speichern.
// Es muss somit nicht jedes mal der Befehl state.saveChanges aufgerufen werden!
ADAPTER.use(new AutoSaveStateMiddleware(USER_STATE, CONVERSATION_STATE));

// Wird aufgerufen, sobald eine Exception fällt
ADAPTER.onTurnError = async (turnContext: TurnContext, error: Error): Promise <void> => {
    // tslint:disable-next-line: no-console
    console.log(`OnTurnError: ${error}`);
    await turnContext.sendActivity('Es tut mir leid. Leider ist ein Fehler aufgetreten');
    // Conversation state wieder leeren und Änderungen speichern
    await CONVERSATION_STATE.clear(turnContext);
};

// Erstelle einen neuen Bot und übergebe ihn die benötigten Parameter
const BOT_SERVICES: BotServices = new BotServices (BOT_CONFIG);
const bot: TravelAssistantBot = new TravelAssistantBot (
    BOT_SERVICES,
    CONVERSATION_STATE,
    USER_STATE
);

// Erstelle den Server
const SERVER: restify.Server = restify.createServer();

// Lege den Port fest
SERVER.listen(process.env.port || process.env.PORT || 3978, (): void => {
    // tslint:disable-next-line: no-console
    console.log(`${SERVER.name} listening to ${SERVER.url}`);
});

// Warte auf eingehende Nachrichten
SERVER.post('/api/messages', (req: restify.Request, res: restify.Response) => {
    ADAPTER.processActivity(req, res, async (turnContext: TurnContext) => {
        // Der turnContext bekommt auch in dem activity objekt die Sprache mitgegeben
        // Das wird verwendet, um die Sprache festzulegen
        // i18n.setLocale(turnContext.activity.locale || i18n.getLocale());

        await bot.onTurn(turnContext);
    });
});
