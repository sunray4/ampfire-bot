import fs from "fs";
import { fiducialPhraseGenerator, paGenerator } from "./word-generator.js";

async function awaitMessageInAllChannels(
  client,
  channel,
  kchannel,
  user,
  filter
) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync("./fiducial.json", "utf8");
    const fiducialData = JSON.parse(data);
    let curtime = parseInt(fiducialData.time) || 0;
    console.log(
      "awaitMessageInAllChannels: curtime = ",
      curtime,
      " time = ",
      fiducialData.time
    );

    const collector = async (message) => {
      if (
        message.guild &&
        message.channel.id === channel.id &&
        filter(message) &&
        message.author.id === user.id
      ) {
        resolve(message);
        console.log(`Message received: ${message.content}`);
        clearTimeout(timeoutId);
        client.off("messageCreate", collector); // Stop listening after the first match
      } else if (
        message.guild &&
        message.channel.id != channel.id &&
        filter(message) &&
        message.author.id === user.id
      ) {
        await message.channel.send(
          `${user} Please send your fiducial number in the fiducial channel`
        );
        console.log("Number sent in wrong channel");
      } else if (
        message.guild &&
        message.channel.id == channel.id &&
        !filter(message) &&
        message.author.id === user.id
      ) {
        await kchannel.send(
          `${user} Please send your fiducial number in the fiducial channel`
        );
        console.log("wrong number sent");
      } else if (
        message.guild &&
        message.channel.id === channel.id &&
        filter(message) &&
        message.author.id != user.id &&
        !message.content.toLowerCase().includes("where")
      ) {
        console.log(
          `Message received from unexpected user ${message.author.id}: ${message.content}`
        );
        await channel.send(
          `${message.author} A PA will call out the fiducial number if there is no response in 48 hours`
        );
      } else if (
        message.guild &&
        filter(message) &&
        message.channel.id === channel.id
      ) {
        console.log(
          `Message received from unexpected user ${message.author.id}: ${message.content}`
        );
      }
    };

    client.on("messageCreate", collector);

    // Set a timeout of 5 minutes
    // to update the time in fiducial.json
    // reject the promise if no message is received within the time limit (48 hours)
    // if passed 36 hours, send a message to the channel
    setTimeout(async () => {
      curtime += 5 * 60 * 1000;
      const fiducialData = { cur: fiducialData.cur, time: curtime };
      fs.writeFileSync(
        "./fiducial.json",
        JSON.stringify(fiducialData, null, 2)
      );
      console.log(
        `Updated fiducial.json: cur = ${fiducialData.cur}, time = ${curtime}`
      );

      if (curtime == 3600000 * 36) {
        await kchannel.send(
          `${user} 36 hours is a long time to keep us waiting...`
        );
      } else if (curtime == 3600000 * 48) {
        client.off("messageCreate", collector); // Stop listening when time is up
        reject(new Error("Timeout: No message received"));
      }
    }, 5 * 60 * 1000);
  });
}

export const fiducialStart = async (message, client) => {
  if (!message.guild) {
    console.error("Message is not from a guild.");
    return;
  }

  const fiducialChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "fiducial"
  ); //reads messages in fiducial channel
  const kindergartenChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "kindergarten"
  ); //prompts the next person in fiducial order in kindergarten channel

  if (!fiducialChannel || !kindergartenChannel) {
    console.error("Channels not found!");
    return;
  }

  //remind if the !fiducial is sent in the wrong channel
  if (
    message.content === "!fiducial" &&
    message.channel.id != fiducialChannel.id
  ) {
    console.log(`!fiducial found in ${message.channel.id}`);
    await message.channel.send(
      "Please initiate !fiducial in the fiducial channel"
    );
  }

  //fidudical moderation
  if (
    message.channel.id === fiducialChannel.id &&
    (message.content === "!fiducial" ||
      message.content.startsWith("!fiducial@"))
  ) {
    console.log("Started new instance of fiducial");

    // let absent = 0;
    let i = 1;
    if (message.content.startsWith("!fiducial@")) {
      const numberString = message.content.replace("!fiducial@", "").trim();
      if (
        numberString.length > 0 &&
        (/^\d{1}$/.test(numberString) || /^\d{2}$/.test(numberString))
      ) {
        i = parseInt(numberString, 10);
      }
      console.log(`Started new instance of fiducial from ${i}`);
    }

    await fiducialProcess(client, message, i, false);
    await fiducialChannel.send("Well done for completing fiducial!!");

    // else if (absent == 1) {
    //     await fiducialChannel.send(`Well done for completing fiducial!! only ${absent} person is absent in this round `);
    // }
    // else {
    //     await fiducialChannel.send(`Well done for completing fiducial!! ${absent} people are absent in this round`);
    // }
  }
};

const fiducialProcess = async (client, message, i, midway = false) => {
  if (!midway) {
    try {
      const fiducialData = { cur: i, time: 0 };
      fs.writeFileSync(
        "./fiducial.json",
        JSON.stringify(fiducialData, null, 2)
      );
      console.log(`Updated fiducial.json: cur = ${i}`);
    } catch (error) {
      console.error("Error updating fiducial.json:", error);
    }
  }
  const fiducialChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "fiducial"
  ); //reads messages in fiducial channel
  const kindergartenChannel = message.guild.channels.cache.find(
    (channel) => channel.name === "kindergarten"
  ); //prompts the next person in fiducial order in kindergarten channel

  if (!fiducialChannel || !kindergartenChannel) {
    console.error("Channels not found!");
    return;
  }
  while (i <= 52) {
    console.log("Finding user...");
    //find user with the next fiducial number
    const members = await message.guild.members.fetch(); // Fetch all members
    const user = members.find((member) =>
      i < 10
        ? member.nickname &&
          member.nickname.startsWith(i.toString() + " ") &&
          member.nickname.indexOf(i.toString()) == 0
        : member.nickname &&
          member.nickname.startsWith(i.toString()) &&
          member.nickname.indexOf(i.toString()) == 0
    );
    if (user) {
      console.log("Found user. Waiting for message");
      if (!midway) {
        //prompts the user to participate in fiducial
        await kindergartenChannel.send(
          `${user} ${fiducialPhraseGenerator()} Please send your fiducial number in the fiducial channel`
        );
      }
      const filter = (msg) => {
        if (
          msg.content.includes("<") &&
          msg.content.includes("@") &&
          msg.content.includes(">")
        ) {
          return (
            msg.content.substring(0, msg.content.indexOf("<") + 1) +
            msg.content.substring(
              msg.content.indexOf(">") + 1,
              msg.content.length
            )
          ).includes(i.toString());
        } else {
          return msg.content.includes(i.toString());
        }
      };

      try {
        await awaitMessageInAllChannels(
          client,
          fiducialChannel,
          kindergartenChannel,
          user,
          filter
        );
      } catch {
        //moves on to next user after 48 hours wait
        fiducialChannel.send(`\"${i}\" - ${paGenerator()}`);
        // absent++;
      }
    } else {
      //skips to next user if there is no user with the fiducial number
      console.log("User cannot be found");
      await fiducialChannel.send(`\"${i}\" - ${paGenerator()}`);
      absent++;
    }
    i++;
    // Update fiducial.json with new value
    try {
      const fiducialData = { cur: i, time: 0 };
      fs.writeFileSync(
        "./fiducial.json",
        JSON.stringify(fiducialData, null, 2)
      );
      console.log(`Updated fiducial.json: cur = ${i}`);
    } catch (error) {
      console.error("Error updating fiducial.json:", error);
    }
  }
};

export const checkFiducial = async (client) => {
  try {
    const data = fs.readFileSync("./fiducial.json", "utf8");
    const fiducialData = JSON.parse(data);
    const i = parseInt(fiducialData.cur);
    if (i <= 52 && i >= 1) {
      console.log("there is an ongoing fiducial at fiducial number ", i);
      // don't have a message from client, so obtain it in a different way
      // This will only work if the bot is in at least one guild
      const guilds = client.guilds.cache;
      if (guilds.size > 0) {
        const firstGuild = guilds.first();
        // Create a mock message object with minimal required properties
        const mockMessage = {
          guild: firstGuild,
          channel:
            firstGuild.channels.cache.find(
              (channel) => channel.name === "fiducial"
            ) || firstGuild.channels.cache.first(),
        };
        await fiducialProcess(client, mockMessage, i, true);
      }
    } else {
      console.log("there is no ongoing fiducial");
    }
  } catch (error) {
    console.error("Error checking fiducial:", error);
  }
};
