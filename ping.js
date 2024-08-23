import https from 'https';

const url = 'https://ampfire-bot.onrender.com'; 

function ping() {
    https.get(url, (res) => {
        console.log(`Pinged ${url}, status code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Ping error: ${e.message}`);
    });
}

// Ping every 5 minutes 
setInterval(ping, 300000);