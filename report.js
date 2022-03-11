const config = require('./config.js')

const { MessageActionRow, MessageButton } = require('discord.js');

const rowWhenOpen = new MessageActionRow()
.addComponents(
  new MessageButton()
    .setCustomId('mark-resolved')
    .setLabel('Mark as resolved')
    .setStyle('SUCCESS'),
)

const rowWhenClosed = new MessageActionRow()
.addComponents(
  new MessageButton()
    .setCustomId('mark-open')
    .setLabel('Mark as open')
    .setStyle('DANGER'),
)

module.exports = {
  takeInteraction: async function (interaction) {
    let message = interaction.options.getString('message');
    let title = interaction.options.getString('title');

    let logChannel = interaction.guild.channels.cache.get(process.env.REPORT_LOG_CHANNEL_ID)

    let messages = await interaction.channel.messages.fetch({ limit: 1 })
    let context = messages.first().url

    let logMessage = {
      embeds: [{
        "title": `New report: ${title}`,
        // "description": `**Report**\n${message}\n\n**Context**\n${context}\n\nFrom: <@${interaction.user.id}>\nIn: <#${interaction.channel.id}>\n\n**Status**\nOpen`,
        "fields": [
          {
            "name": "Report",
            "value": message
          },
          {
            "name": "Context",
            "value": context
          },
          {
            "name": "From",
            "value": `<@${interaction.user.id}>`,
          },
          {
            "name": "To",
            "value": `<#${interaction.channel.id}>`,
          },
          {
            "name": "Status",
            "value": "Open"
          }
        ],
        "color": '#00a9c0',
        "thumbnail": {
          "url": interaction.user.displayAvatarURL()
        }
      }],
      components: [rowWhenOpen]
    }

    const sentLogMessage = await logChannel.send(logMessage)

    return interaction.reply({ content: `Thanks, a moderator will take a look soon.`, ephemeral: true });
  },
  takeResolveInteraction: async function (interaction) {
    let message = interaction.message

    let embed = message.embeds[0]

    // replace everything after "**Status**\n"
    // embed.description = embed.description.replace(/(?<=\*\*Status\*\*\n).+/, `Closed by <@${interaction.user.id}>`)
    embed.fields.find(field => field.name === "Status").value = `Closed by <@${interaction.user.id}>`
    embed.color = "#808080"

    message.edit({ embeds: [embed], components: [rowWhenClosed] })
    interaction.deferUpdate()
  },
  takeReopenInteraction: async function (interaction) {
    let message = interaction.message

    let embed = message.embeds[0]

    // embed.description = embed.description.replace(/(?<=\*\*Status\*\*\n).+/, `Reopened by <@${interaction.user.id}>`)
    embed.fields.find(field => field.name === "Status").value = `Reopened by <@${interaction.user.id}>`
    embed.color = "#00a9c0"

    message.edit({ embeds: [embed], components: [rowWhenOpen] })
    interaction.deferUpdate()
  }
}