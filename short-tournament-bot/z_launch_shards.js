const { ShardingManager } = require('discord.js');
require('dotenv').config();
require('@colors/colors');

const manager = new ShardingManager('./main.js', {
  token: process.env.Bot_TOKEN,
  totalShards: "auto",
});

manager.on('shardCreate', shard => {
  console.log(`La shard ${shard.id} a été créée.`);
});

manager.spawn().catch(err => {
  console.error(`Erreur lors du lancement des shards: ${err}`);
});
