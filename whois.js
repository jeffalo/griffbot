const { users } = require('./db.js')

module.exports = async function (discordUser) {
  return new Promise(async (resolve, reject) => {
    let user = await users.findOne({ discord: discordUser.id })
    if (!user) return resolve({ content: "user not found", ephemeral: true })
    resolve({
      embeds: [{
        "title": `${discordUser.tag}'s Profile`,
        "description": `**Description**\n${user.bio || 'No bio set. :('}\n\n**Current list of accounts:**\n${user.scratch.map(i => '- ' + i).join('\n')}\n\nLast updated: <t:${Math.floor(user.updated / 1000)}:R>.`,
        "color": '#00a9c0',
        "thumbnail": {
          "url": discordUser.displayAvatarURL()
        }
      }]
    })
  })
}