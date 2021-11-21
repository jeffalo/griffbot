const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = 1337
const { users, agendaJobs } = require('./db.js')
const eta = require("eta")
const cookieParser = require('cookie-parser')
const massPing = require('./mass-ping.js')
const config = require('./config.js')

app.engine("eta", eta.renderFile)

app.set("view engine", "eta")

app.set("views", "./views")

app.use(cookieParser())
app.use(express.json()); // used to parse JSON bodies

app.use(express.static('static'))

const moderators = process.env.MODERATOR_IDS.split(',')

let client;

app.use(async (req, res, next) => { // get user
  const token = req.cookies.discord_token

  res.locals.loggedIn = false

  if (token) {
    // get user from discord
    const user = await fetch(`https://discordapp.com/api/users/@me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(res => res.json())

    if (user.id && moderators.includes(user.id)) {
      res.locals.user = user
      res.locals.loggedIn = true
    }
  }
  next();
});

app.get('/', (req, res) => {
  // if the user is logged in, redirect to the dashboard, otherwise redirect to the login page

  if (res.locals.loggedIn) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login')
  }
})

app.get("/login", function (req, res) {
  // if user is logged in, redirect to home
  let text = req.query.error || "for administration eyes only"
  if (res.locals.loggedIn) {
    res.redirect("/")
  } else {
    res.render("login", {
      text,
    })
  }
})

app.post('/login', (req, res) => {
  // authorization code grant with discord

  res.redirect(`https://discord.com/api/oauth2/authorize?response_type=code&client_id=${process.env.DISCORD_ID}&scope=identify&state=${Math.random()}&redirect_uri=${process.env.ADMIN_URL}/handle&prompt=consent`)
})

app.get('/handle', async (req, res) => {
  const code = req.query.code
  const state = req.query.state // TODO: check state

  let response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'client_id': process.env.DISCORD_ID,
      'client_secret': process.env.DISCORD_SECRET,
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': `${process.env.ADMIN_URL}/handle`
    })
  })

  let json = await response.json()

  // if there is an error (no token), redirect to login page
  if (json.error) {
    return res.redirect(`/login?error=${json.error}`)
  }

  // get user info
  const userInfo = await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      'Authorization': `Bearer ${json.access_token}`
    }
  }).then(res => res.json())

  console.log(userInfo)

  // if user is not an admin, redirect to login page

  if (!moderators.includes(userInfo.id)) {
    return res.redirect(`/login?error=${userInfo.username} (${userInfo.id}) does not have access to the griffbot admin panel`)
  } else {
    // if user is an admin, set cookie and redirect to admin page

    res.cookie('discord_token', json.access_token, { expires: new Date(Date.now() + 9999999999) })

    res.redirect(`/dashboard`)
  }
})

// from now on, only logged in users can access the routes

app.use((req, res, next) => {
  if (!res.locals.loggedIn) {
    res.redirect('/login?error=you dont have permission to do that')
  } else {
    next()
  }
})

app.get('/dashboard', async (req, res) => {
  // send the dashboard page

  const userCount = await users.count()
  const job = await agendaJobs.findOne()

  const pingers = massPing.pingers

  function time_ago(time) {

    switch (typeof time) {
      case 'number':
        break;
      case 'string':
        time = +new Date(time);
        break;
      case 'object':
        if (time.constructor === Date) time = time.getTime();
        break;
      default:
        time = +new Date();
    }
    var time_formats = [
      [60, 'seconds', 1], // 60
      [120, '1 minute ago', '1 minute from now'], // 60*2
      [3600, 'minutes', 60], // 60*60, 60
      [7200, '1 hour ago', '1 hour from now'], // 60*60*2
      [86400, 'hours', 3600], // 60*60*24, 60*60
      [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
      [604800, 'days', 86400], // 60*60*24*7, 60*60*24
      [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
      [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
      [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
      [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
      [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
      [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
      [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
      [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (+new Date() - time) / 1000,
      token = 'ago',
      list_choice = 1;

    if (seconds == 0) {
      return 'Just now'
    }
    if (seconds < 0) {
      seconds = Math.abs(seconds);
      token = 'from now';
      list_choice = 2;
    }
    var i = 0,
      format;
    while (format = time_formats[i++])
      if (seconds < format[0]) {
        if (typeof format[2] == 'string')
          return format[list_choice];
        else
          return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
      }
    return time;
  }


  const jobData = {
    next: time_ago(job.nextRunAt),
    last: time_ago(job.lastRunAt),
    interval: job.repeatInterval,
    locked: !!job.lockedAt,
  }

  // a map of config keys to human-readable names

  const configMap = {
    "ACTIVE_THRESHOLD": "Active Threshold (top x users from mee6 leaderboard)",
    "PING_THRESHOLD": "Ping Threshold (amount of mentions to be considered a mass-ping)"
  }

  res.render('dashboard', {
    user: res.locals.user,
    userCount,
    jobData,
    pingers,
    config: config.settings,
    configMap
  })
})

app.post('/send', async (req, res) => {
  const content = req.body.message
  const channelID = req.body.channel

  if (client) {
    // just making sure the client is ready

    let channel = await client.channels.cache.get(channelID)
    if (!channel) return res.json({ error: "channel not found" })

    channel.send(content)

    res.json({
      success: true
    })
  }
})

app.post('/pinger/add', async (req, res) => {
  massPing.addPinger(req.body.pinger)
  res.json({
    success: true
  })
})

app.post('/pinger/remove', async (req, res) => {
  massPing.removePinger(req.body.pinger)
  res.json({
    success: true
  })
})

app.post('/config/edit', async(req, res) => {
  const key = req.body.setting
  const value = req.body.value

  config.set(key, value)

  res.json({
    success: true
  })
})

app.get('/dashboard/search-scratch', async (req, res) => {
  // find all users with the given scratch username

  let linkedUsers = await users.find({ scratch: req.query.username })

  res.render('search', {
    results: linkedUsers,
  })
})

app.get('/dashboard/search-discord', async (req, res) => {
  // find the user with the given discord id

  let foundUsers = await users.find({ discord: req.query.user })

  res.render('search', {
    results: foundUsers,
  })
})

app.post('/delete-user', async (req, res) => {
  const userID = req.body.id

  try {
    await users.remove({ _id: userID })
    res.json({
      success: true
    })
  } catch (error) {
    console.log(error)
    res.json({
      success: false
    })
  }

})

app.get('/logout', async (req, res) => {
  // invalidate the token on discord
  let response = await fetch(`https://discordapp.com/api/v6/oauth2/token/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'token': req.cookies.discord_token,
      'client_id': process.env.DISCORD_ID,
      'client_secret': process.env.DISCORD_SECRET
    })
  }).then(res => res.json())

  // remove the cookie

  res.clearCookie('discord_token')

  // redirect to login page

  res.redirect('/login')
})

function start(discordClient) {
  client = discordClient
  app.listen(port, () => {
    console.log(`griffbot webserver listening at http://localhost:${port}`)
  })
}

module.exports = {
  app,
  start
}