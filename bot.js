import 'dotenv/config';
import {Client, GatewayIntentBits} from 'discord.js';
import { paGenerator, fiducialPhraseGenerator } from './word-generator.js';

const client = new Client({
    intents:  [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, //enabled in privileged intents
        GatewayIntentBits.GuildMembers, //enabled in privileged intents
    ],
})

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const generalChannel = message.guild.channels.cache.find(channel => channel.name === 'general' && channel.type === 'GUILD_TEXT');       
        if (generalChannel) {
            // Send a introduction message to the general channel
            generalChannel.send("hey guys im AmpFire, your custom discord bot!! i can moderate fiducial if prompted by '/fiducial' in the fiducial channel through tagging the next fiducial number in the #kindergarten channel. ill skip to the next fiducial number if there is no response in 48 hours. hopefully ill get more features soon... ");
        } else {
            console.log('General channel not found!');
        }

});

client.on('messageCreate', async (message)=> {
    const fiducialChannel = message.guild.channels.cache.find(channel => channel.name === 'fiducial'); //reads messages in fiducial channel
    const kindergartenChannel = message.guild.channels.cache.find(channel => channel.name === 'kindergarten'); //prompts the next person in fiducial order in kindergarten channel

    if (!fiducialChannel || !kindergartenChannel) {
        console.error("Channels not found!");
        return;
    }

    //fidudical moderation
    if (message.channel.id === fiducialChannel.id && message.content === '/fiducial') {
        //count number of users missing from fiducial round
        var absent = 0;
        for (let i = 1; i <= 52; i++) {
            console.log("Finding user...");
            //find user with the next fiducial number
            const user = message.guild.members.cache.find(member => member.nickname && member.nickname.includes(i.toString()) && !member.nickname.includes("1" + i.toString()) && !member.nickname.includes("2" + i.toString()) && !member.nickname.includes("3" + i.toString()) && !member.nickname.includes("4" + i.toString()) && !member.nickname.includes("5" + i.toString()));        
            if (user) {
                console.log("Found user. Waiting for message");

                //prompts the user to participate in fiducial
                await kindergartenChannel.send(`${user} ${fiducialPhraseGenerator()}`);

                const filter = (msg) => msg.content.includes(i.toString()) && msg.author.id === user.id && msg.channel.id === fiducialChannel.id;
                //second prompt after 36 hour wait
                const timeoutId = setTimeout(() => {
                    kindergartenChannel.send(`${user} 36 hours is a long time to keep us waiting...`);
                }, 100000);
                
                try {
                    //waits for message
                    const collected = await fiducialChannel.awaitMessages({
                        filter,
                        max: 1,
                        time: 1000000,
                        errors: ['time'],
                    });
                    console.log(`Message received: ${collected.first().content}`);
                    
                    // Clear the timeout when the message is received
                    clearTimeout(timeoutId);
                } catch {
                    //moves on to next user after 48 hours wait
                    fiducialChannel.send(`\"${i}\" - ${paGenerator()}`);
                    absent++;
                }
                
            }
            else {
                //skips to next user if there is no user with the fiducial number
                console.log("User cannot be found");
                await fiducialChannel.send(`\"${i}\" - ${paGenerator()}`);
                absent++;
            }
        }
        if (absent == 0) {
            await fiducialChannel.send("well done for completing fiducial!! everyone is present congratulations :D");
        }
        else if (absent == 1) {
            await fiducialChannel.send(`Well done for completing fiducial!! only ${absent} person is absent in this round `);
        }
        else {
            await fiducialChannel.send(`Well done for completing fiducial!! ${absent} people are absent in this round`);
        }

    }
});

client.login(process.env.BOT_TOKEN);