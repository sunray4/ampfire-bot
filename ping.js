import https from 'https';

const url = 'https://ampfire-bot.onrender.com'; 

function ping() {
    https.get(url, (res) => {
        console.log(`Pinged ${url}, status code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Ping error: ${e.message}`);
    });
}

// Ping every 1 minute 
setInterval(ping, 60000);
