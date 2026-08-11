     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝐯𝐢𝐧𝐳𝐚        
  // 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: @RevinzaX7 
 // 𝗧𝘆𝗽𝗲: Esm
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//

import fs from 'fs';
import chalk from 'chalk'; 
import { fileURLToPath } from 'url';

global.owner = ['6283167006954']; 
global.premium = ['6283167006954']; 
global.botname = 'RevinzaBotz'; 
global.ownername = 'ЯevinzA'; 
global.prefix = '.'; 
global.packname = 'ʀᴇᴠɪɴᴢᴀ-ʙᴏᴛ';        
global.author = 'RevinzaMods';  

const __filename = fileURLToPath(import.meta.url);

fs.watchFile(__filename, async () => {
    fs.unwatchFile(__filename);
    console.log(chalk.greenBright(`config.js telah diperbarui!`));
    await import(`${import.meta.url}?update=${Date.now()}`);
    fs.watchFile(__filename, () => {});
});
