import fs from "fs";
import path from "path";
import jimp from "jimp";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resize = async (image, width, height) => {
  try {
    let oyy = await jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).quality(70).getBufferAsync(jimp.MIME_JPEG);
    return kiyomasa;
  } catch {
    return Buffer.alloc(0);
  }
};

const parseCases = () => {
  try {
    const casePath = path.join(__dirname, "../system/case.js"); 
    if (!fs.existsSync(casePath)) return { total: 0, commands: {}, tags: [] };

    const content = fs.readFileSync(casePath, "utf8");
    const lines = content.split("\n");
  
    let currentTag = "main";
    let totalCases = 0;
    let extractedCommands = {};
    let detectedTags = new Set();

    for (let line of lines) {
      let tagMatch = line.match(/\/\/\s*──\s*\[\s*([\w-]+)\s*\]\s*──/);
      if (tagMatch) {
        currentTag = tagMatch[1].toLowerCase().trim();
        continue;
      }

      let caseMatch = line.match(/case\s+["']([^"']+)["']\s*:/);
      if (caseMatch) {
        let cmdName = caseMatch[1];
        if (["menu", "allmenu", "help", "test", "${cleanCmd}", "${cleancmd}"].includes(cmdName)) continue;
        
        totalCases++;
        detectedTags.add(currentTag);
        if (!extractedCommands[currentTag]) extractedCommands[currentTag] = [];
        extractedCommands[currentTag].push({ help: cmdName });
      }
    }
    return { total: totalCases, commands: extractedCommands, tags: Array.from(detectedTags) };
  } catch (e) {
    console.error(e);
    return { total: 0, commands: {}, tags: [] };
  }
}; 

export default {
  command: ["menu", "allmenu", "help"],
  help: ["menu", "allmenu"],
  tags: ["main"],
  run: async (sock, m, { text, prefix, command }) => {
    try {
      let autoTags = new Set();
      
      if (global.plugins) {
        Object.values(global.plugins).forEach(p => {
          if (p.tags) {
            if (Array.isArray(p.tags)) {
              p.tags.forEach(t => t && autoTags.add(t.toLowerCase().trim()));
            } else {
              autoTags.add(p.tags.toLowerCase().trim());
            }
          }
        });
      }

      const caseData = parseCases();
      caseData.tags.forEach(t => autoTags.add(t));
      autoTags.delete("owner");
      
      const sortedTags = Array.from(autoTags).sort();
      const hour = Number(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }));
      let greeting = (hour >= 4 && hour < 10) ? "Selamat Pagi" : (hour >= 10 && hour < 15) ? "Selamat Siang" : (hour >= 15 && hour < 18) ? "Selamat Sore" : "Selamat Malam";
      
      let senderJid = m.sender || m.key.remoteJid;
      let name = m.pushName || m.pushname || "User";
      let senderNumber = senderJid.split('@')[0];
      
      let isOwner = senderNumber === String(global.owner).replace(/[^0-9]/g, '');
      let status = isOwner ? "Owner" : (m.isPremium ? "Premium User" : "User");
      
      let uptimeRuntime = process.uptime();
      let days = Math.floor(uptimeRuntime / 86400);
      let hours = Math.floor((uptimeRuntime % 86400) / 3600);
      let minutes = Math.floor((uptimeRuntime % 3600) / 60);
      let seconds = Math.floor(uptimeRuntime % 60);
      
      let timestamp = m.messageTimestamp ? Number(m.messageTimestamp) * 1000 : Date.now();
      let ping = Date.now() - timestamp;
      let mode = sock.public ? "Public" : "Self";
      
      let bodyText = `*Hello, @${senderNumber}. I am ${global.botname || "Revinza"}, a WhatsApp assistant bot. Is there anything I can help you with? Please press the button to display the next menu page*\n`;

      let footerText = `- Developer : *${global.ownername || 'Revinza'}*\n` +
                       `- Type : *Plugins*\n` +
                       `- Mode : *${mode}*\n` +
                       `- Ping : *${Math.floor(ping)} ms*\n` +
                       `- Runtime : *${days}D ${hours}H ${minutes}M ${seconds}S*\n\n⦿ User : *${name}*\n⦿ Number : *${senderNumber}*\n⦿ Status : *${status}*\n\n`;

      const formatCategory = (tagName, list) => {
        let spacedTitle = (tagName.toUpperCase() + " MENU").split("").join(" ");
        let res = `[ ${spacedTitle} ]\n`;
        for (let p of list) {
          let helps = Array.isArray(p.help) ? p.help : [p.help];
          for (let h of helps) {
            if (h) res += `${prefix}${h}\n`;
          }
        }
        res += `───\n\n`;
        return res;
      };
      
      if (text || command === "allmenu") {
        let targetTag = text?.toLowerCase().trim();
        if (command === "allmenu" || targetTag === "all") {
          let fullTagsList = ["owner", ...sortedTags];
          for (let tagKey of fullTagsList) {
            let filteredPlugin = global.plugins ? Object.values(global.plugins).filter(p => p.tags && (Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()).includes(tagKey) : p.tags.toLowerCase() === tagKey)) : [];
            let filteredCase = caseData.commands[tagKey] || [];
            let combined = [...filteredPlugin, ...filteredCase];
            if (combined.length > 0) footerText += formatCategory(tagKey, combined);
          }
        } else if (targetTag === "owner" || sortedTags.includes(targetTag)) {
          let filteredPlugin = global.plugins ? Object.values(global.plugins).filter(p => p.tags && (Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()).includes(targetTag) : p.tags.toLowerCase() === targetTag)) : [];
          let filteredCase = caseData.commands[targetTag] || [];
          let combined = [...filteredPlugin, ...filteredCase];
          footerText += combined.length > 0 ? formatCategory(targetTag, combined) : `*fitur ${targetTag} kosong.*`;
        }
      }

      let sections = [
        {
            title: "",
            highlight_label: "RevinzaBotz",
            rows: [
                { title: "All Features", description: "", id: `${prefix}allmenu`, highlight_label: "All Menu" },
            ]
        },
        { 
            title: "Features", 
            highlight_label: "Features", 
            rows: [] 
        }
      ];

      for (let tag of sortedTags) {
        if (tag !== 'group' && tag !== 'owner') { 
            let labelName = tag.charAt(0).toUpperCase() + tag.slice(1); 
            
            sections[1].rows.push({
                title: `MENU ${tag.toUpperCase()}`,
                id: `${prefix}menu ${tag}`,
                highlight_label: labelName 
            });
        }
      }

      const thumbnailPath = path.join(__dirname, "../media/image/thumbnail.jpg");
      const audioPath = path.join(__dirname, "../media/audio/start.opus"); 
      
      const imageBuffer = fs.existsSync(thumbnailPath) ? fs.readFileSync(thumbnailPath) : Buffer.alloc(0);
      const stif = await resize(imageBuffer, 300, 180);

      const buttonMessage = {
          location: {
              degreesLatitude: 0,
              degreesLongitude: 0,
              name: `${greeting}, ${name}✨`,
              address: `${global.botname || "Revinza"}`,
              jpegThumbnail: stif 
          },
          limited_time_offer: {
              text: "bokep",
              url: "https://t.me/ReVinzzamodss",
              copy_code: "bokep",
              expiration_time: Math.floor(Date.now() / 1000) + 86400
          },
          caption: bodyText.trim(),
          footer: footerText.trim(),
          headerType: 6,
          viewOnce: true,
          mentions: [senderJid],
          contextInfo: {
              mentionedJid: [senderJid] 
          },
          buttons: [
              {
                  buttonId: 'action',
                  buttonText: { displayText: '☰ Click' },
                  type: 4,
                  nativeFlowInfo: {
                      name: 'single_select',
                      paramsJson: JSON.stringify({
                          title: "RevinzaBotz",
                          sections: sections
                      })
                  }
              },
              { buttonId: `${prefix}owner`, buttonText: { displayText: 'ᴏᴡɴᴇʀ' }, type: 1 }, 
          ],
      };

      await sock.sendMessage(m.chat, buttonMessage, { quoted: m.qkontak || m });

      if (fs.existsSync(audioPath)) {
        await sock.sendMessage(
          m.chat,
          {
            audio: fs.readFileSync(audioPath), 
            mimetype: 'audio/mpeg',  
            ptt: true,
            contextInfo: {
              isForwarded: true,
              mentionedJid: [senderJid],
              forwardedNewsletterMessageInfo: {
                newsletterName: global.botname || "Revinza",
                newsletterJid: '120363399189153374@newsletter',
              }
            }
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("[ERROR MENU]", err);
    }
  }
};
