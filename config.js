// setup config

// the default config will come from .env, but it is overidden by config in the database.
// admins will be able to change the config in the dashboard.

// warning: values are always strings, so make sure to typecast them.

const { config } = require('./db.js')

module.exports = {
  settings: {},
  async init() {
    console.log('init config')
    // 1. set the default config from .env
    // 2. set the config from the database

    // 1.
    this.settings = {
      ACTIVE_THRESHOLD: process.env.ACTIVE_THRESHOLD,
      PING_THRESHOLD: process.env.PING_THRESHOLD,
      FUN_ENABLED: process.env.FUN_ENABLED,
    }

    // 2.
    let dbConfig = await config.findOne({})
    if (dbConfig) {
      // add the config from the database to this.settings
      Object.assign(this.settings, dbConfig.settings)
    }

    console.log('config initialized')
    console.log(this.settings)
  },
  async set(key, value) {
    // 1. set the config in the config object
    // 2. set the config in the database
  
    // 1.
    this.settings[key] = value

    // 2.
    await config.update({}, { $set: { settings: this.settings } }, { upsert: true })
  },
}