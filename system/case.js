     //﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
    //       𝐂𝐫𝐞𝐝𝐢𝐭𝐬       
   // 𝗠𝗮𝗸𝗲𝗿:𝐑𝐞𝐯𝐢𝐧𝐳𝐚        
  // 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺: @RevinzaX7 
 // 𝗧𝘆𝗽𝗲: Esm
//﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌//
import util from 'util';

export default async (
    sock,
    m,
    { command, args, text, prefix, isOwner, isPremium }
) => {

    switch(command) {
        case 'ping': {
            m.reply('Pong!');
            break;
        }
    }
    return false;
};
