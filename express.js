const express = require('express')
const app = express()
const port = 1337
const { users } = require('./db.js')

app.get('/', (req, res) => {
  res.send('its working!!!!!')
})

// app.get('/users', async (req, res) => {
//   const usersInDB = await users.find({})
//   res.json(usersInDB)
// })

// app.listen(port, () => {
//   console.log(`griffbot webserver listening at http://localhost:${port}`)
// })

module.exports = {
  app,
}