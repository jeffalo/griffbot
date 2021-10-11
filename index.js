require('dotenv').config()
const { Client, Intents, Permissions } = require('discord.js');
const webserver = require('./express.js')
const { users } = require('./db.js')
const verification = require('./verification.js');
const whois = require('./whois.js');
const scratchWhois = require('./scratch-whois.js');
const banana = require('./banana.js')

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
  partials: ["CHANNEL"]
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}! Setting up slash commands.`);
  // set up slash commands
  await client.application.commands.set([
    {
      name: 'test',
      description: 'A test command',
    },
    {
      name: 'verify',
      description: 'Link your Scratch username to your Discord account',
      options: [
        {
          name: 'username',
          type: 'STRING',
          description: 'Your Scratch username',
          required: true
        }
      ]
    },
    {
      name: 'whois',
      description: '(admin) See linked Scratch account for a user (Output is visible to everyone)',
      options: [
        {
          name: 'user',
          type: 'USER',
          description: 'user',
          required: true
        }
      ]
    },
    {
      name: 'scratchwhois',
      description: '(admin) See linked Discord accounts for a Scratch username (Output is visible to everyone)',
      options: [
        {
          name: 'user',
          type: 'STRING',
          description: 'Scratch username',
          required: true
        }
      ]
    },
    {
      name: 'bio',
      description: 'Set a bio that appears on your ID card',
      options: [
        {
          name: 'bio',
          type: 'STRING',
          description: 'New bio',
          required: true
        }
      ]
    },
    {
      name: 'id',
      description: 'Show your linked Scratch accounts',
    },
    {
      name: 'adminremove',
      description: '(admin) Remove a linked Scratch account for a Discord user',
      options: [
        {
          name: 'discord',
          type: 'USER',
          description: 'user',
          required: true
        },
        {
          name: 'scratch',
          type: 'STRING',
          description: 'Scratch username',
          required: true
        }
      ]
    },
    {
      name: 'adminadd',
      description: '(admin) Bypass verification steps and linked Scratch account for a Discord user',
      options: [
        {
          name: 'discord',
          type: 'USER',
          description: 'user',
          required: true
        },
        {
          name: 'scratch',
          type: 'STRING',
          description: 'Scratch username',
          required: true
        }
      ]
    },
    {
      name: "apply",
      description: 'Apply to become a moderator',
      options: [
        {
          name: 'timezone',
          type: 'STRING',
          description: 'Your timezone',
          required: true
        },
        {
          name: 'age',
          type: "INTEGER",
          description: 'Your age',
          required: true
        },
        {
          name: "application",
          type: "STRING",
          description: 'Your full application',
          required: true
        }
      ]
    },
    {
      name: "banana",
      description: 'Image effects',
      options: [
        {
          name: 'effect',
          type: 'STRING',
          description: 'Effect to apply',
          choices: [
            {
              name: "banana",
              value: "banana"
            },
            {
              name: "gaming",
              value: "gaming"
            },
          ],
          required: true
        },
        {
          name: 'user',
          type: 'USER',
          description: 'Avatar',
          required: false
        }
      ]
    }
  ], process.env.GUILD_ID)
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    commandHandler(interaction);
  } else if (interaction.isButton()) {
    buttonHandler(interaction);
  } else {
    await interaction.reply({ content: 'Unknown interaction :(' });
  }
});

client.on('messageCreate', async (message) => {
  // check if the message starts with "!banana"
  if (message.content.startsWith('!banana')) {
    // initiate the bananaifier

    let useMention = !!message.mentions.members.first()

    console.log(useMention)

    let user = useMention ? message.mentions.members.first().user : message.member.user

    message.channel.sendTyping()
    let bananad = await banana.bananaify(user.displayAvatarURL({ size: 4096, dynamic: true }))
    message.channel.send({
      files: [
        { attachment: bananad }
      ]
    })
  }
})

const commandHandler = async (interaction) => {
  if (interaction.commandName === 'verify') {

    // verify user
    let response = await verification.start(interaction.member.user.id, interaction.options.getString('username'))
    await interaction.reply(response);

  } else if (interaction.commandName == 'whois') {

    // find a users linked Scratch account
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
    let response = await whois(interaction.options.getUser('user'))
    await interaction.reply(response);

  } else if (interaction.commandName == 'id') {

    // a list of all linked Scratch accounts for a user
    let response = await whois(interaction.member.user)
    await interaction.reply(response);

  } else if (interaction.commandName == 'scratchwhois') {

    // find a users linked Discord account
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true })
    let response = await scratchWhois(interaction.options.getString('user'))
    await interaction.reply(response);

  } else if (interaction.commandName == 'adminremove') {

    // remove a linked Scratch account for a Discord user
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
    let discord = interaction.options.getUser('discord');
    let scratch = interaction.options.getString('scratch');
    let user = await users.findOne({ discord: discord.id })
    if (!user) return interaction.reply({ content: 'User not found in database', ephemeral: true });
    if (!user.scratch.includes(scratch)) return interaction.reply({ content: `Scratch username ${scratch} not linked to Discord account ${discord.tag}`, ephemeral: true });
    user.scratch = user.scratch.filter(i => i !== scratch)
    user.updated = Date.now()

    if (user.scratch.length == 0) {
      await users.remove({ discord: discord.id })
      await interaction.reply({ content: "Gone, reduced to atoms." })
    } else {
      // otherwise save the user
      await users.update({ discord: discord.id }, { $set: user })
      let response = await whois(discord)
      return await interaction.reply(response);
    }

  } else if (interaction.commandName == 'adminadd') {

    // bypass verification and add a linked Scratch account for a Discord user
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
    let discord = interaction.options.getUser('discord');
    let discordID = discord.id;
    let scratchName = interaction.options.getString('scratch');

    let existingUser = await users.findOne({ discord: discord.id })
    if (existingUser) {
      // the user exists (already verified as another account, we should update their scratch array
      // but first lets check if they are already verified as them
      if (existingUser.scratch.includes(scratchName)) {
        return interaction.reply({ content: `${discord.tag} is already verified as ${scratchName}.`, ephemeral: true })
      }
      // ok now we are sure its okay to update their scratch array.. lets do it!
      let user = existingUser
      user.scratch.push(scratchName)
      user.updated = Date.now()
      await users.update({ discord: discordID }, { $set: user })
      // that was epic. lets tell the user they're verified
      return interaction.reply({ content: `${discord.tag} is now verified as ${scratchName}.`, ephemeral: true })
    } else {
      // we should create a new user
      user = await users.insert({ discord: discordID, scratch: [scratchName], updated: Date.now() })
      // that was epic. lets tell the user they're verified
      return interaction.reply({ content: `${discord.tag} is now verified as ${scratchName}.`, ephemeral: true })
    }

  } else if (interaction.commandName == "bio") {
    // set bio
    let user = await users.findOne({ discord: interaction.member.user.id })
    if (!user) return interaction.reply({ content: `You aren't verified yet. Use /verify to get started.`, ephemeral: true });
    let bio = interaction.options.getString('bio');

    if (bio.length > 250) return interaction.reply({ content: "Bio is too long. Max length is 250 characters.", ephemeral: true });

    user.bio = bio;
    user.updated = Date.now()

    await users.update({ discord: interaction.member.user.id }, { $set: user });

    // log this
    let logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID)
    logChannel.send({ content: `${interaction.user.username} (${interaction.user.id}) changed their bio to\`\`\`${bio}\`\`\`` })

    return interaction.reply({ content: `Bio set to ${bio}. Use /id to see it.`, ephemeral: true });
  } else if (interaction.commandName == "apply") {
    let application = interaction.options.getString('application');
    let age = interaction.options.get('age').value;
    let tz = interaction.options.get('timezone').value;

    // get scratch usernames (or tell the user they need to be verified first)

    let user = await users.findOne({ discord: interaction.user.id })

    if (!user) {
      return interaction.reply({ content: `Thanks for applying, however your application could not be processed. Please ensure you are verified with griffbot (run /verify) before applying.`, ephemeral: true });
    }

    let logChannel = interaction.guild.channels.cache.get(process.env.APPLICATION_LOG_CHANNEL_ID)
    if(!logChannel) {
      return interaction.reply("Thanks for applying, however applications are currently closed. Please try again later.")
    }

    logChannel.send({ content: `${interaction.user.username} (${interaction.user.id}) applied.\n\nAge: ${age}\nTimezone: ${tz}\n\nApplication:\n> ${application}\n\nScratch accounts: \n${user.scratch.map(i => '- ' + i).join('\n')}\ngriffbot bio: ${user.bio || '[not set]'}` })
    return interaction.reply({ content: `Thanks for applying.`, ephemeral: true });
  } else if (interaction.commandName == "banana") {
    // banana is the image fx module
    banana.takeInteraction(interaction)
  } else {
    await interaction.reply('Unknown command');
  }
}

const buttonHandler = async (interaction) => {
  if (interaction.customId === 'continue') {
    let response = await verification.check(interaction.member)
    await interaction.reply(response);
  } else {
    await interaction.reply('Unknown button');
  }
}

client.login(process.env.DISCORD_TOKEN);