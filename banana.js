// banana is the griffpatch server image effect thing
const config = require('./config.js')

const sharp = require('sharp')
const fetch = require('node-fetch')

async function getImageFromURL(url) {
  return new Promise(async (resolve, reject) => {
    let image = await fetch(url).then(r => r.buffer())
    resolve(image)
  })
}

module.exports = {
  takeInteraction: async function (interaction) {
    // we can now do whatever with the interaction

    // but quickly, check if fun is enabled
    const funEnabled = config.settings.FUN_ENABLED === "true";

    if (!funEnabled) {
      return interaction.reply("Fun is disabled :(");
    }

    // first get the image effect requested

    let effect = interaction.options.getString('effect')

    let user = interaction.options.getUser('user') || interaction.user
    let avatar = user.displayAvatarURL({ size: 4096, dynamic: true })

    let effected;

    switch (effect) {
      case 'gaming':
        effected = await this.gaming(avatar)
        break;
      case 'banana':
        effected = await this.bananaify(avatar)
        break;
      default:
        return interaction.reply('error')
    }

    interaction.reply({
      files: [
        { attachment: effected }
      ]
    })
  },
  bananaify: async function (url) {
    return new Promise(async (resolve, reject) => {
      let image = await getImageFromURL(url)

      let resizedAvatar = await sharp(image)
        .resize({ width: 3030, height: 2670 })
        .grayscale()
        .toBuffer()


      let sharped = await sharp('banana.jpg')
        .resize({ width: 3030, height: 2670 })
        .composite([{ input: resizedAvatar, blend: "overlay" }])
        .sharpen()
        .toBuffer()
      resolve(sharped)
    })
  },
  gaming: async function (url) {
    return new Promise(async (resolve, reject) => {
      let image = await getImageFromURL(url)

      let gaminged = await sharp(image)
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1]
        }).toBuffer()

      resolve(gaminged)
    })
  }
}