const monk = require('monk')

const url = process.env.MONGO_URL || 'localhost/griffbot'

const db = monk(url)
const users = db.get('users')

module.exports = {
  users,
  url
}