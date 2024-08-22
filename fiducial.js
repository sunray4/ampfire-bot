import { paGenerator, fiducialPhraseGenerator } from './word-generator.js';

export const fiducial = async (message)=> {
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
            const user = message.guild.members.cache.find(member => member.nickname && member.nickname.startsWith(i.toString() +  " ") && member.nickname.indexOf(i.toString()) == 0);        
            if (user) {
                console.log("Found user. Waiting for message");

                //prompts the user to participate in fiducial
                await kindergartenChannel.send(`${user} ${fiducialPhraseGenerator()}`);

                const filter = (msg) => msg.content.includes(i.toString()) && msg.channel.id === fiducialChannel.id;
                //second prompt after 36 hour wait
                const timeoutId = setTimeout(() => {
                    kindergartenChannel.send(`${user} 36 hours is a long time to keep us waiting...`);
                }, 3600000 * 36);

                const timeoutDuration = 3600000 * 48;
                const endTime = Date.now() + timeoutDuration;
                
                try {
                    //waits for message
                    var foundMessage = false;
                    while (!foundMessage) {
                        const collected = await fiducialChannel.awaitMessages({
                            filter,
                            max: 1,
                            time: endTime - Date.now(),
                            errors: ['time'],
                        });
                        const receivedMessage = collected.first();
                        if (receivedMessage.author.id === user.id) {
                            console.log(`Message received: ${collected.first().content}`);                 
                            // Clear the timeout when the message is received
                            clearTimeout(timeoutId);
                            foundMessage = true;
                        }
                        else if (!receivedMessage.content.toLowerCase().includes("where")) {
                            console.log(`Message received from unexpected user ${receivedMessage.author.id}: ${collected.first().content}`);  
                            await fiducialChannel.send(`${receivedMessage.author} :(`);
                        }
                    }
                    
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
            await fiducialChannel.send("Well done for completing fiducial!! everyone is present congratulations :D");
        }
        else if (absent == 1) {
            await fiducialChannel.send(`Well done for completing fiducial!! only ${absent} person is absent in this round `);
        }
        else {
            await fiducialChannel.send(`Well done for completing fiducial!! ${absent} people are absent in this round`);
        }

    }
};