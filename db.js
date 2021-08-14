const monk = require('monk')

const db = monk(process.env.MONGO_URL || 'localhost/griffbot')
const users = db.get('users')

module.exports = {
  users
}