//update birthday.json with new birthdays from log every time this app this deployed
//have to change server name in obtainbirthday.js to be used in different server

import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { scheduleDailyCheck } from "./checkbirthday.js";
import { checkFiducial, fiducialStart } from "./fiducial.js";
import { obtainBirthday } from "./obtainbirthday.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, //enabled in privileged intents
    GatewayIntentBits.GuildMembers, //enabled in privileged intents
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL"], //to receive dms
});

//variables
const sentWelcomeMessages = new Set(); // Track if the welcome message has been sent

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scheduleDailyCheck(client);
  checkFiducial(client);
  //stop obtaining brithdays with each redeployment to stop spam
  // await obtainBirthday(client);
});

client.on("guildCreate", async (guild) => {
  // Check if the welcome message has already been sent
  if (sentWelcomeMessages.has(guild.id)) return;

  const generalChannel = guild.channels.cache.find(
    (channel) => channel.name === "general"
  );
  if (generalChannel) {
    try {
      // Send welcome messages with delays to avoid rate limits
      await generalChannel.send(
        "Hey guys, I'm AmpFire, your custom Discord bot!! It's great to meet all of you guys :D"
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
      await generalChannel.send(
        "I can moderate fiducial if prompted by '!fiducial' in the fiducial channel through tagging the person with the next fiducial number. I'll also skip to the next fiducial number if there is no response in 48 hours."
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
      await generalChannel.send(
        "I can also collect and celebrate the birthdays of members in this server. Please check your DMs to share your birthday date with me!!"
      );
      sentWelcomeMessages.add(guild.id);
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  } else {
    console.log("General channel not found!");
  }

  await obtainBirthday(client);
});

client.on("messageCreate", (message) => fiducialStart(message, client));
// client.on("messageCreate", (message) => );

client.login(process.env.BOT_TOKEN);
