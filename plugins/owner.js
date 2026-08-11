export default {
    command: ["owner", "creator", "developer"],
    help: ["owner"],
    tags: ["main"],
    run: async (sock, m) => {
        let rawOwner = Array.isArray(global.owner) ? global.owner[0] : global.owner;
        let ownerNum = String(rawOwner).replace(/[^0-9]/g, "");
        let ownerJid = ownerNum + "@s.whatsapp.net";
        let ownerName = global.ownername || "Owner";
        try {
            if (m.sender === ownerJid && m.pushName) {
                ownerName = m.pushName;
            } 
            else if (sock.contacts && sock.contacts[ownerJid]) {
                ownerName = sock.contacts[ownerJid].name || sock.contacts[ownerJid].notify || ownerName;
            }
        } catch (e) {
            console.log("Gagal mengambil nama owner dinamis, menggunakan nama default.");
        }
        
        let botName = global.botname || "RevinzaBotz";

        let vcard = 
            `BEGIN:VCARD\n` +
            `VERSION:3.0\n` +
            `FN:${ownerName}\n` +
            `ORG:${botName};\n` +
            `TEL;type=CELL;type=VOICE;waid=${ownerNum}:+${ownerNum}\n` +
            `END:VCARD`;

        await sock.sendMessage(
            m.chat,
            {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }],
                },
            },
            { quoted: m }
        );
    }
};
