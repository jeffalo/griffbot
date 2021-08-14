let sessions = module.exports = {
  codes: [],
  add: function (data) {
    sessions.codes.push(data)
    setTimeout(()=>{
      sessions.removeByCode(data.code)
    }, 4 * 60 * 1000)
  },
  removeByCode: function (code) {
    sessions.codes = sessions.codes.filter(i => i.code !== code)
  },
  removeByDiscord: function (discord) {
    sessions.codes = sessions.codes.filter(i => i.discord !== discord)
  }
}