const crypto = require('crypto')
const { MessageActionRow, MessageButton } = require('discord.js');
const fetch = require('node-fetch');

let sessions = require('./sessions.js')
const { users } = require("./db.js")

let verification = module.exports = {
  start: function (discordID, scratchName) {
    return new Promise(async (resolve, reject) => {
      // 1. make sure the scratch account exists (use useragent Jeffalo/griffbot)
      let scratchAccount = await fetch(`https://api.scratch.mit.edu/users/${scratchName}/`, {
        headers: {
          'User-Agent': 'Jeffalo/griffbot'
        }
      }).then(res => res.json());
      if (!scratchAccount.username) return resolve({ content: `Could not find ${scratchName} on Scratch.`, ephemeral: true })

      // 2. the user exists on scratch. :) we should make sure they arent already verified as them though.
      let existingUser = await users.findOne({ discord: discordID })
      if(existingUser && existingUser.scratch.includes(scratchName)) {
        return resolve({ content: `You're already verified as ${scratchName}.`, ephemeral: true })
      }

      // 3. we should now create a token for the user, and save it to the sessions array
      let code = generateCode();
      sessions.add({ discord: discordID, scratch: scratchName, code: code })

      // 4. send the code to the user

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel('Go to the project')
            .setStyle('LINK')
            .setURL(`https://scratch.mit.edu/projects/${process.env.PROJECT}#comments`),
          new MessageButton()
            .setCustomId('continue')
            .setLabel('Continue')
            .setStyle('SUCCESS'),
        )
      return resolve({ content: `Your code is \`${code}\`, comment it on the project and when you're done, come back here and press **Continue**`, components: [row], ephemeral: true })
    })
  },
  check: function (member) {
    return new Promise(async (resolve, reject) => {
      let discordID = member.user.id
      // 1. check if the user is in the sessions array to begin with
      let checkSession = sessions.codes.find(i => i.discord === discordID)
      if (!checkSession) return resolve({ content: "Your verification sesion expired, please start again with `/verify`.", ephemeral: true })

      const scratchName = checkSession.scratch
      const code = checkSession.code

      // 2. remove it to prevent duplicate verification attempts
      sessions.removeByDiscord(discordID)

      // 3. check if they commented the code on the project
      let comments = await fetch(`https://api.scratch.mit.edu/users/${process.env.PROJECT_OWNER}/projects/${process.env.PROJECT}/comments/`, {
        headers: {
          'User-Agent': 'Jeffalo/griffbot'
        }
      }).then(res => res.json());
      let comment = comments.find(i => i.author.username === scratchName && i.content.trim() === code)
      if (!comment) return resolve({ content: `Your code was not found in the project comments.`, ephemeral: true })
      
      // 4. horray! they verified sucessfully!! now we should store them in the db and give them the verified role

      // give role on discord
      let guild = member.guild
      let verifiedRole = guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
      member.roles.add(verifiedRole)

      let existingUser = await users.findOne({ discord: discordID })
      if(existingUser) {
        // the user exists (already verified as another account, we should update their scratch array
        // but first lets check if they are already verified as them
        if(existingUser.scratch.includes(scratchName)) {
          return resolve({ content: `You're already verified as ${scratchName}.`, ephemeral: true })
        }
        // ok now we are sure its okay to update their scratch array.. lets do it!
        let user = existingUser
        user.scratch.push(scratchName)
        user.updated = Date.now()
        await users.update({ discord: discordID }, { $set: user })
        // that was epic. lets tell the user they're verified
        return resolve({ content: `You're now verified as ${scratchName}.`, ephemeral: true })
      } else {
        // we should create a new user
        user = await users.insert({ discord: discordID, scratch: [scratchName], updated: Date.now() })
        // that was epic. lets tell the user they're verified
        return resolve({ content: `You're now verified as ${scratchName}.`, ephemeral: true })
      }
    })
  }
}

function generateCode() {
  return crypto.randomBytes(20).toString('hex').replace(/(.{5})/g,"$1griffbot")
}