import { Collection } from 'discord.js';
import fs from 'fs';

const birthdays = new Collection();
 
if (fs.existsSync('birthdays.json')) {
    try {
        const data = fs.readFileSync('birthdays.json');
        const parsedData = JSON.parse(data);
        for (const [key, value] of Object.entries(parsedData)) {
            birthdays.set(key, value);
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
        // Handle the error, e.g., reinitialize the file
    }
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


async function checkForBirthdays(client) {
    const today = new Date().toISOString().slice(5, 10); // Get MM-DD format of today's date
    const generalChannel = client.channels.cache.find(channel => channel.name === 'general');
    if (!generalChannel) {
        console.error('General channel not found or bot has no access.');
        return;
    }

    if (birthdays.size != 0) {
        birthdays.forEach((birthday, userid) => {
            if (birthday === today && generalChannel) {
                generalChannel.send(`@everyone it's <@${userid}>'s birthday today!! 🎉🎉🎉`);
            }
        });
    }
    else {
        console.log('The birthdays collection is empty.');
    }
    
}
