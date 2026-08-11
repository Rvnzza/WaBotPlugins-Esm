     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝘃𝗶𝗻𝘇𝐚        
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
        }  
    });  

    sock.ev.on('creds.update', saveCreds);
}

startBot();
