const monk = require('monk')

const url = process.env.MONGO_URL || 'localhost/griffbot'

const db = monk(url)
const users = db.get('users')
const config = db.get('config')
const agendaJobs = db.get('agendaJobs')

module.exports = {
  users,
  config,
  agendaJobs,
  url
}