import { Collection } from 'discord.js';
import fs from 'fs';

const birthdays = new Collection();
 
if (fs.existsSync('birthdays.json')) {
    const data = fs.readFileSync('birthdays.json');
    Object.assign(birthdays, JSON.parse(data));
}

function getMillisecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to midnight of the next day
    return midnight.getTime() - now.getTime();
}

export function scheduleDailyCheck(client) {
    // Run the initial check immediately after the bot starts
    checkForBirthdays(client);

    // Calculate the milliseconds until midnight
    const millisecondsUntilMidnight = getMillisecondsUntilMidnight();

    // Schedule the check for midnight
    setTimeout(() => {
        checkForBirthdays(client);
        
        // Set up the interval to check every 24 hours after the first check
        setInterval(() => {
            checkForBirthdays(client);
        }, 86400000); // 24 hours in milliseconds
    }, millisecondsUntilMidnight);
}

export async function obtainBirthday(client) {
    client.on('messageCreate', async message => {
        if (message.guild) {
            const guild = message.guild;
            const members = await guild.members.fetch();

            members.array.forEach(async member => {
                if (!member.user.bot && !birthdays.has(member)) {
                    try {
                        await member.send("When is your birthday? Please reply in mm-dd format (e.g. 05-09) so that we can celebrate your birthday with you!");

                        const filter = m => m.author.id === member.id;
                        const collector = member.dmChannel.createMessageCollector({filter});

                        collector.on('collect', msg => {   
                            const bday = msg.content.trim();

                            if (/^\d{2}-\d{2}$/.test(bday)) {
                                birthdays.set(member, bday);
                                fs.writeFileSync('birthdays.json', JSON.stringify(Object.fromEntries(birthdays)), 'utf-8')
                                member.send("Thank you!! Your response has been recorded")
                                collector.stop();
                            }
                            else {
                                member.send("Please provide your birthday in mm-dd format")
                            }
                        });
                    }
                    catch (error) {
                        console.error(`Failed to send DM to ${member.user.tag}:`, error);
                    }
                }
            });
        }
    });
}

async function checkForBirthdays(client) {
    client.on('ready', async() => {
        const today = new Date().toISOString().slice(5, 10); // Get MM-DD format of today's date
        const generalChannel = client.channels.cache.find(channel => channel.name === 'general');

        birthdays.forEach((birthday, user) => {
            if (birthday === today && generalChannel) {
                generalChannel.send(`Happy Birthday ${user}!! 🎉🎉🎉`);
            }
        });
    });
}
