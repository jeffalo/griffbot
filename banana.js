// bananafier

const sharp = require('sharp')
const fetch = require('node-fetch')

module.exports = async function (url) {
  console.log(url)
  return new Promise(async (resolve, reject) => {
    let image = await fetch(url).then(r => r.buffer())

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
}