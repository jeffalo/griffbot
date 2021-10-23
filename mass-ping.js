let data = module.exports = {
  pingers: [],
  addPinger: function(pinger) {
    this.pingers.push(pinger);
    // remove pinger from array after 5 minutes
    setTimeout(() => {
      this.removePinger(pinger);
    }, 300000);
  },
  removePinger: function(data) {
    this.pingers.splice(this.pingers.indexOf(data), 1);
  }
}

setInterval(() => {
  console.log(data.pingers);
}, 1000);