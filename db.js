const monk = require('monk')

const url = process.env.MONGO_URL || '127.0.0.1/griffbot'

const db = monk(url)
const users = db.get('users')
const warns = db.get('warns')
const config = db.get('config')
const agendaJobs = db.get('agendaJobs')

module.exports = {
  users,
  warns,
  config,
  agendaJobs,
  url
}