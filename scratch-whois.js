const { users } = require('./db.js')

module.exports = async function (scratchUsername) {
  return new Promise(async (resolve, reject) => {
    let linkedUsers = await users.find({ scratch: scratchUsername })
    if (linkedUsers.length == 0) return resolve({content: "I could not find any Discord accounts linked to that Scratch user. This command is case sensitive."})
    let discords = linkedUsers.map(i => `<@${i.discord}>`).join('\n')
    resolve({
      embeds: [{
        "title": `Discord accounts linked for ${scratchUsername}`,
        "description": `**List of discord accounts:**\n${discords}`,
        "color": '#00a9c0',
        "thumbnail": {
          "url": `https://my-ocular.jeffalo.net/api/user/${scratchUsername}/picture`
        }
      }]
    })
  })
}