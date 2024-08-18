import 'dotenv/config';
import {Client, GatewayIntentBits} from 'discord.js';
import { paGenerator } from './paGenerator.js';

const client = new Client({
    intents:  [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
})

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message)=> {
    const fiducialChannel = message.guild.channels.cache.find(channel => channel.name === 'fiducial');
    const kindergartenChannel = message.guild.channels.cache.find(channel => channel.name === 'kindergarten');

    if (!fiducialChannel || !kindergartenChannel) {
        console.error("Channels not found!");
        return;
    }

    if (message.channel.id === fiducialChannel.id && message.content === '/fiducial') {
        var absent = 0;
        for (let i = 1; i <= 52; i++) {
            const user = message.guild.members.cache.find(member => member.nickname && member.nickname.includes(i.toString()));        
            if (user) {
                await kindergartenChannel.send(`${user} you're up for fiducial!!`);
                const filter = (msg) => msg.content.includes(i.toString()) && msg.author.id === user.id && msg.channel === fiducialChannel.id;
                
                // setTimeout(() => {
                //     kindergartenChannel.send(`${user} 36 hours is a long time to keep us waiting...`);
                // }, 10000);
                await fiducialChannel.awaitMessages({
                    filter,
                    max: 1,
                    time: 100000,
                    error: ['time'],
                })
                .catch(() => {
                    fiducialChannel.send(`\"${i}\" - ${paGenerator()}`);
                    absent++;
                })

                
            }
            else {
                await fiducialChannel.send(`\"${i} \"- ${paGenerator()}`);
                absent++;
            }
        }
        if (absent == 0) {
            await fiducialChannel.send("well done for completing fiducial!! everyone is present congratulations :D");
        }
        else {
            await fiducialChannel.send(`Well done for completing fiducial!! ${absent} people are absent in this round`);
        }

    }
});

client.login(process.env.BOT_TOKEN);