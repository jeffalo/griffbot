// https://youtu.be/ITogH7lJTyE?t=43

module.exports = async function (promise) {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    console.error(error)
    return [null, error]
  }
}