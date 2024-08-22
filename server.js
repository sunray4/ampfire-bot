import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

//10000 is the default port of render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});