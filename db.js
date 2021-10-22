const monk = require('monk')

const url = process.env.MONGO_URL || 'localhost/griffbot'

const db = monk(url)
const users = db.get('users')
const agendaJobs = db.get('agendaJobs')

module.exports = {
  users,
  agendaJobs,
  url
}