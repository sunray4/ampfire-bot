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


let handledEvent = false;
export async function obtainBirthday (client) {

    if (handledEvent) return;
    const guild = client.guilds.cache.find(guild => guild.name === 'shad mta 2024'); //change to server name
    if (!guild) {
        console.error('Guild not found');
        return;
    }
    const members = await guild.members.fetch();

    members.forEach(async member => {
        if (!member.user.bot && !birthdays.has(member.id)) {
            try {
                await new Promise(r => setTimeout(r, 1000)); //1 second delay
                await member.send("When is your birthday? Please reply in mm-dd format (e.g. 05-09) so that we can celebrate your birthday with you!");

                const filter = m => m.author.id === member.id;
                const dmChannel = await member.createDM();
                const collector = dmChannel.createMessageCollector({filter});

                collector.on('collect', async msg => {   
                    const bday = msg.content.trim();

                    if (/^\d{2}-\d{2}$/.test(bday)) {
                        birthdays.set(member.id, bday);
                        await fs.writeFileSync('birthdays.json', JSON.stringify(Object.fromEntries(birthdays)), 'utf-8');
                        await fs.readFile('birthdays.json', 'utf8', (err, data) => {
                            if (err) {
                                console.error('Error reading the file:', err);
                                return;
                            }
                            
                            try {
                                // Parse the JSON data
                                const jsonData = JSON.parse(data);
                            
                                // Log the JSON data
                                console.log('JSON Data:', jsonData);
                            } catch (parseError) {
                                console.error('Error parsing JSON:', parseError);
                            }
                            });
                        await member.send("Thank you!! Your response has been recorded");
                        collector.stop();
                    }
                    else {
                        await member.send("Please provide your birthday in mm-dd format");
                    }
                });
            }
            catch (error) {
                console.error(`Failed to send DM to ${member.user.tag}:`, error);
            }
        }
    });
    handledEvent = true;
    
}

