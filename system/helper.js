     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝐯𝐢𝐧𝐳𝐚        
  // 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: @RevinzaX7 
 // 𝗧𝘆𝗽𝗲: Esm
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from 'url';
import baileys from "@whiskeysockets/baileys";
const {
    jidNormalizedUser,
    proto,
    getContentType,
    generateWAMessageFromContent,
    downloadMediaMessage 
} = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lidPath = path.join(__dirname, "../database/lidCache.json");

if (!global.lidCache) {
    global.lidCache = new Map();
    if (fs.existsSync(lidPath)) {
        try {
            const raw = fs.readFileSync(lidPath, "utf-8");
            const data = JSON.parse(raw);
            for (const [k, v] of Object.entries(data)) {
                global.lidCache.set(k, v);
            }
        } catch (e) {}
    }
}

function saveLidCache() {
    try {
        const dir = path.dirname(lidPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const obj = Object.fromEntries(global.lidCache);
        fs.writeFileSync(lidPath, JSON.stringify(obj, null, 2));
    } catch (e) {}
} 

export async function serialize(sock, m) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBot = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        let rawSender = m.fromMe 
            ? (sock.user.id || sock.user.jid) 
            : m.isGroup 
                ? (m.key.participant || m.participant) 
                : m.chat;

        m.sender = jidNormalizedUser(rawSender);
        if (m.isGroup && !global.lidCache.has(m.sender)) {
            let meta = await sock.groupMetadata(m.chat).catch(() => null);
            if (meta && meta.participants) {
                let hasNew = false;
                for (let p of meta.participants) {
                    if (p.lid && p.id) {
                        let normLid = jidNormalizedUser(p.lid);
                        let normPn = jidNormalizedUser(p.id);
                        if (!global.lidCache.has(normLid)) {
                            global.lidCache.set(normLid, normPn);
                            hasNew = true;
                        }
                    }
                }
                if (hasNew) saveLidCache(); 
            }
        }
        if (m.sender && m.sender.endsWith("@lid") && global.lidCache.has(m.sender)) {
            m.sender = global.lidCache.get(m.sender);
        }
        if (m.chat && m.chat.endsWith("@lid") && !m.isGroup && global.lidCache.has(m.chat)) {
            m.chat = global.lidCache.get(m.chat);
        }
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        if (!m.mtype) {
            m.body = '';
            return m;
        }

        m.msg = (m.mtype === 'viewOnceMessage' || m.mtype === 'viewOnceMessageV2') 
            ? (m.message[m.mtype]?.message?.[getContentType(m.message[m.mtype]?.message || {})]) 
            : m.message[m.mtype];

        if (!m.msg) m.msg = {};
        
        let responseId = '';
        if (m.mtype === 'interactiveResponseMessage') {
            try {
                let parseParams = JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson || '{}');
                responseId = parseParams.id || '';
            } catch (e) {
                responseId = '';
            }
        }

        m.body = m.mtype === "conversation" ? m.message.conversation :
                 m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage?.text :
                 m.mtype === "imageMessage" ? m.message.imageMessage?.caption :
                 m.mtype === "videoMessage" ? m.message.videoMessage?.caption :
                 m.mtype === "documentMessage" ? m.message.documentMessage?.caption || "" :
                 m.mtype === "audioMessage" ? m.message.audioMessage?.caption || "" :
                 m.mtype === "stickerMessage" ? m.message.stickerMessage?.caption || "" :
                 m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage?.selectedButtonId :
                 m.mtype === "listResponseMessage" ? m.message.listResponseMessage?.singleSelectReply?.selectedRowId :
                 m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage?.selectedId :
                 m.mtype === "interactiveResponseMessage" ? responseId :
                 m.mtype === "messageContextInfo" ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.text) :
                 m.mtype === "reactionMessage" ? m.message.reactionMessage?.text :
                 m.mtype === "contactMessage" ? m.message.contactMessage?.displayName :
                 m.mtype === "contactsArrayMessage" ? m.message.contactsArrayMessage?.contacts?.map(c => c.displayName).join(", ") :
                 m.mtype === "locationMessage" ? `${m.message.locationMessage?.degreesLatitude}, ${m.message.locationMessage?.degreesLongitude}` :
                 m.mtype === "liveLocationMessage" ? `${m.message.liveLocationMessage?.degreesLatitude}, ${m.message.liveLocationMessage?.degreesLongitude}` :
                 m.mtype === "pollCreationMessage" ? m.message.pollCreationMessage?.name :
                 m.mtype === "pollUpdateMessage" ? m.message.pollUpdateMessage?.name :
                 m.mtype === "groupInviteMessage" ? m.message.groupInviteMessage?.groupJid :
                 m.mtype === "viewOnceMessage" ? (m.message.viewOnceMessage?.message?.imageMessage?.caption || m.message.viewOnceMessage?.message?.videoMessage?.caption || "[Pesan sekali lihat]") :
                 m.mtype === "viewOnceMessageV2" ? (m.message.viewOnceMessageV2?.message?.imageMessage?.caption || m.message.viewOnceMessageV2?.message?.videoMessage?.caption || "[Pesan sekali lihat]") :
                 m.mtype === "viewOnceMessageV2Extension" ? (m.message.viewOnceMessageV2Extension?.message?.imageMessage?.caption || m.message.viewOnceMessageV2Extension?.message?.videoMessage?.caption || "[Pesan sekali lihat]") :
                 m.mtype === "ephemeralMessage" ? (m.message.ephemeralMessage?.message?.conversation || m.message.ephemeralMessage?.message?.extendedTextMessage?.text || "[Pesan sementara]") :
                 m.mtype === "interactiveMessage" ? "[Pesan interaktif]" :
                 m.mtype === "protocolMessage" ? "[Pesan telah dihapus]" :
                 (m.msg?.caption || m.msg?.text || m.text || '');
        
        if (typeof m.body !== 'string') m.body = '';

        m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        if (m.quoted) {
            let type = getContentType(m.quoted);
            if (type) {
                m.quoted = m.quoted[type];
                if (['productMessage'].includes(type)) {
                    type = getContentType(m.quoted);
                    m.quoted = m.quoted ? m.quoted[type] : null;
                }
                if (m.quoted) {
                    if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
                    m.quoted.mtype = type;
                    m.quoted.id = m.msg.contextInfo.stanzaId;
                    m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant);
                    if (m.quoted.sender && m.quoted.sender.endsWith("@lid") && global.lidCache.has(m.quoted.sender)) {
                        m.quoted.sender = global.lidCache.get(m.quoted.sender);
                    }

                    m.quoted.fromMe = m.quoted.sender === jidNormalizedUser(sock.user.id);
                    m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || '';
                }
            }
        }
    }
    
    m.reply = async (text, options = {}) => {
        return sock.sendMessage(
            m.chat,
            { text: String(text), ...options },
            { quoted: m }
        );
    }

    m.download = async () => {
        return await downloadMediaMessage(m, 'buffer', {});
    }

    if (m.quoted) {
        m.quoted.download = async () => {
            return await downloadMediaMessage({
                key: {
                    remoteJid: m.chat,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                },
                message: {
                    [m.quoted.mtype]: m.quoted
                }
            }, 'buffer', {});
        };
    }

    return m;
}
