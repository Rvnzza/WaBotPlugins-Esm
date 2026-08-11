import util from "util";
import { exec } from "child_process";

export default {
    command: ['x', '>', '=>', '$'],
    isOwner: true, 
    run: async (sock, m, { text, command }) => {
        if (command === '$') {
            if (!text) return m.reply("Masukkan command terminal/bash!");
            exec(text, async (err, stdout) => {
                if (err) return m.reply(util.format(err));
                if (stdout) return m.reply(util.format(stdout));
            });
            return;
        }
        if (!text) return m.reply("Masukkan kode JavaScript!");
        try {
            let code = text;
            if (!code.includes('return') && !code.includes('await')) {
                code = `return ${code}`;
            }

            let evaled = await eval(`(async () => { ${code} })()`);
            
            if (evaled !== undefined) {
                if (typeof evaled === 'object' && evaled !== null && evaled.key && evaled.message) {
                    return; 
                }

                if (typeof evaled !== 'string') evaled = util.inspect(evaled, { depth: 2 });
                await m.reply(evaled);
            }
        } catch (err) {
            await m.reply(util.format(err));
        }

    }
};
