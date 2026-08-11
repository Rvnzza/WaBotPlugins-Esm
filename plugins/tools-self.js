export default {
    command: ['self', 'public'],
    help: ['public', 'self'],
    tags: ['tools'],
    owner: true,
    run: async (sock, m, { command }) => {
        if (command === 'self') {
            sock.public = false;
            await m.reply("✅ *Done mengubah ke mode SELF!*");
        } else if (command === 'public') {
            sock.public = true;
            await m.reply("✅ *Done mengubah ke mode PUBLIC!*");
        }
    }
};
