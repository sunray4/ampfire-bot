import { Collection } from 'discord.js';
import fs from 'fs';
import schedule from 'node-schedule';

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

export function scheduleDailyCheck(client) {

    schedule.scheduleJob('0 7 * * *', async () => { // Every day at 4am gmt (vancouver midnight)
        console.log('Running daily birthday check...');
        checkForBirthdays(client);
    });
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
                generalChannel.send(`@everyone it's <@${userid}>'s birthday today!!🥳🥳`);
            }
        });
    }
    else {
        console.log('The birthdays collection is empty.');
    }
    
}
