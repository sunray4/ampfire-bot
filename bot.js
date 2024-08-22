import 'dotenv/config';
import {Client, GatewayIntentBits} from 'discord.js';
import { fiducial } from './fiducial.js';
import { obtainBirthday, scheduleDailyCheck } from './birthday.js';


const client = new Client({
    intents:  [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, //enabled in privileged intents
        GatewayIntentBits.GuildMembers, //enabled in privileged intents
        GatewayIntentBits.DirectMessages, 
    ],
})

let hasSentWelcomeMessage = false; // Track if the welcome message has been sent

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    scheduleDailyCheck(client);
});

client.on('guildCreate', async (guild) => {
    // Check if the welcome message has already been sent
    if (hasSentWelcomeMessage) return;

    const generalChannel = guild.channels.cache.find(channel => channel.name === 'general');
    if (generalChannel) {
        // Send a welcome message to the general channel
        await generalChannel.send("hey guys im AmpFire, your custom discord bot!! it's great to meet all of you guys :D");
        await generalChannel.send("i can moderate fiducial if prompted by '/fiducial' in the fiducial channel through tagging the person with the next fiducial number. i'll also skip to the next fiducial number if there is no response in 48 hours");
    } 
    else {
        console.log('General channel not found!');
    }

    hasSentWelcomeMessage = true;
});

client.on('messageCreate', fiducial);

var obtainedBday = false;
if (!obtainedBday) {
    obtainBirthday(client);
    obtainedBday = true;
}

client.login(process.env.BOT_TOKEN);