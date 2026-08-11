export default {
    command: ["status", "cekmode", "mode"],
    help: ["mode"],
    tags: ["tools"],
    owner: true,
    run: async (sock, m, { command }) => {
        let status = sock.public ? "🟢 Public" : "🔴 Self";
        let caption = `
*Bot Name :* ${global.botname || "Bot"}
*Mode :* ${status}
`.trim();
        await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
    }
};
