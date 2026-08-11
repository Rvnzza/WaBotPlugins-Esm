     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝐯𝐢𝐧𝐳𝐚        
  // 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: @RevinzaX7 
 // 𝗧𝘆𝗽𝗲: Esm
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import { serialize } from './helper.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import NodeCache from "node-cache";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
global.plugins = {};
const pluginsDir = path.join(__dirname, '../plugins');
const caseFile = path.join(__dirname, 'case.js'); 

const loadSinglePlugin = async (filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    const pluginPath = path.join(pluginsDir, filename);

    if (fs.existsSync(pluginPath)) {
        try {
            const pluginUrl = pathToFileURL(pluginPath).href + `?update=${Date.now()}`;
            const pluginModule = await import(pluginUrl);
            const plugin = pluginModule.default;
            
            if (plugin && plugin.command) {
                global.plugins[filename] = plugin;
                console.log(chalk.greenBright(`Plugin Dimuat/Diupdate: ${filename}`));
            }
        } catch (e) {
            console.error(chalk.red(`Gagal memuat plugin ${filename}:`), e);
        }
    } else {
        if (global.plugins[filename]) {
            delete global.plugins[filename];
            console.log(chalk.yellowBright(`Plugin Dihapus: ${filename}`));
        }
    }
};

const loadAllPlugins = async () => {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (let file of files) {
        await loadSinglePlugin(file);
    }
    console.log(chalk.greenBright(`[ SYSTEM ] Total ${Object.keys(global.plugins).length} Plugins Siap DIGUNAKAN.`));
};
loadAllPlugins(); 

let watchTimer = null;
fs.watch(pluginsDir, (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
        if (watchTimer) clearTimeout(watchTimer);
        watchTimer = setTimeout(() => {
            loadSinglePlugin(filename);
        }, 500);
    }
}); 

let caseHandlerModule = await import('./case.js');
let caseHandler = caseHandlerModule.default;
let caseWatchTimer = null;

fs.watchFile(caseFile, { interval: 1000 }, () => {
    if (caseWatchTimer) clearTimeout(caseWatchTimer);
    caseWatchTimer = setTimeout(async () => {
        try {
            const caseUrl = pathToFileURL(caseFile).href + `?update=${Date.now()}`;
            const newCaseModule = await import(caseUrl);
            caseHandler = newCaseModule.default;
            console.log(chalk.greenBright(`File system/case.js berhasil Di-update!`));
        } catch (e) {
            console.error(chalk.red(`Gagal memuat ulang system/case.js:`), e);
        }
    }, 500);
}); 

export default async (sock, chat) => {
    try {
        if (!chat || !chat.message) return;
        if (chat.key && chat.key.remoteJid === 'status@broadcast') return;

        let m = await serialize(sock, chat);
        if (!m || m.isBot || !m.body) return;

        const prefix = global.prefix || '.';
        const isCmd = m.body.startsWith(prefix) || /^[=>$x]/.test(m.body.charAt(0));
        const command = isCmd ? m.body.replace(prefix, '').trim().split(' ').shift().toLowerCase() : '';
        const args = m.body.trim().split(/ +/).slice(1);
        const text = args.join(" "); 
        
        let senderNumber = m.sender ? m.sender.replace(/[^0-9]/g, '') : '';
        let botNumber = sock.decodeJid(sock.user.id).replace(/[^0-9]/g, '');
        let ownerList = (global.owner || []).map(v => String(v).replace(/[^0-9]/g, '')); 
        let isOwner = m.fromMe || [botNumber, ...ownerList].includes(senderNumber);
        let isPremium = isOwner || (global.premium || []).map(v => String(v).replace(/[^0-9]/g, '')).includes(senderNumber);
        
        if (!sock.public && !isOwner) return;
        
        let groupMetadata = null, participants = [], groupAdmins = [], isBotAdmin = false, isAdmin = false;
        
        if (m.isGroup && (isCmd || command)) {
            groupMetadata = groupCache.get(m.chat) || await sock.groupMetadata(m.chat).catch(() => null);
            if (groupMetadata) {
                groupCache.set(m.chat, groupMetadata);
                participants = groupMetadata.participants || [];
                groupAdmins = participants.filter(v => v.admin).map(v => v.id);
                isBotAdmin = groupAdmins.includes(sock.decodeJid(sock.user.id));
                isAdmin = groupAdmins.includes(m.sender);
            }
        }  
        if (m.body.trim().length > 0 && (isCmd || command)) {
            const timeLog = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const userName = m.pushName || "No Name";
            const groupName = (m.isGroup && groupMetadata) ? groupMetadata.subject : "Private Chat";
            const chatTypeBadge = m.isGroup ? chalk.bgYellow.black("GROUP ") : chalk.bgCyan.black("PRIVATE ");
            
            console.log(
                chalk.gray('\n╭──────────────────────────────────────────────────') +
                chalk.gray('\n│ ') + chalk.bold.green(`${timeLog} `) + chatTypeBadge +
                chalk.gray('\n│ ') + chalk.cyan('Cmd   : ') + chalk.whiteBright(m.body) +
                chalk.gray('\n│ ') + chalk.cyan('User  : ') + chalk.yellowBright(userName) + chalk.gray(` (${senderNumber})`) +
                chalk.gray('\n│ ') + chalk.cyan('Chat  : ') + chalk.magentaBright(groupName) +
                chalk.gray('\n╰──────────────────────────────────────────────────')
            );
        }
        
        let isPluginTriggered = false;
        for (let name in global.plugins) {
            let plugin = global.plugins[name];
            if (!plugin) continue;

            const isTriggered = Array.isArray(plugin.command) ? plugin.command.includes(command) : plugin.command === command;
            if (isTriggered) {
                isPluginTriggered = true;

                if (plugin.isOwner && !isOwner) return m.reply('*khusus Owner!*');
                if (plugin.isPremium && !isPremium) return m.reply('*khusus Premium!*');
                if (plugin.isGroup && !m.isGroup) return m.reply('*khusus Group!*');
                if (plugin.isAdmin && !isAdmin) return m.reply('*khusus Admin!*');
                if (plugin.isBotAdmin && !isBotAdmin) return m.reply('*Bot harus Admin Group!*');

                await plugin.run(sock, m, { args, text, command, prefix, isOwner, isPremium, groupMetadata });
                break;
            }
        }
        
        if (!isPluginTriggered && (isCmd || command)) {
            await caseHandler(sock, m, {
                command, args, text, prefix, isOwner, isPremium,
                groupMetadata, participants, groupAdmins, isBotAdmin, isAdmin
            });
        }
    } catch (err) {
        console.error(chalk.red("Error Utama Handler Engine: "), err);
    }
};
