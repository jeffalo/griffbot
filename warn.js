const { warns } = require("./db.js")
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  takeInteraction: async function (interaction) {
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
    let user = interaction.options.getUser('user');
    let message = interaction.options.getString('message');

    warn = await warns.insert({ user: user.id, moderator: interaction.member.id, message: message, date: Date.now() });

    let totalInfractions = await warns.count({ user: user.id });

    let confirmationMessageActions = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('delete-warn')
          .setLabel('Delete')
          .setStyle('DANGER'),
      )

    let confirmationMessage = {
      embeds: [{
        title: `Warned ${user.username}`,
        description: message,
        fields: [
          {
            name: "Moderator",
            value: `<@${warn.moderator}>`,
          },
          {
            name: "User",
            value: `<@${warn.user}>`,
          },
          {
            name: "Warn ID",
            value: warn._id.toString(),
          },
          {
            name: "Web UI",
            value:`[See at griffbot.jeffalo.net](${process.env.ADMIN_URL}/dashboard/infractions/${warn._id})`,
          },
          {
            name: "Total Infractions",
            value: totalInfractions.toString(),
          },
        ],
        color: '#f03a7c',
        "thumbnail": {
          "url": user.displayAvatarURL()
        }
      }],
      components: [confirmationMessageActions]
    }

    // now dm the user
    let dmMessage = {
      embeds: [{
        title: `You were warned in the ${interaction.guild.name} server!`,
        description: message,
        color: '#f03a7c',
        thumbnail: {
          url: interaction.guild.iconURL()
        }
      }]
    }

    try {
      await user.send(dmMessage)
    } catch (error) {
      confirmationMessage.embeds[0].fields.push({
        name: "DM Error",
        value: error.message,
      })
    }

    interaction.reply(confirmationMessage);
  },
  takeDeleteInteraction: async function (interaction) {
    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });

    // let warnID = interaction.message.embeds[0].fields[2].value;

    let warnID = interaction.message.embeds[0].fields.find(field => field.name === "Warn ID").value;

    if (!warnID.match(/^[0-9a-fA-F]{24}$/)) {
      return interaction.reply({ content: 'Invalid ID.', ephemeral: true });
    }

    let warn = await warns.findOne({ _id: warnID });

    if (!warn) return interaction.reply({ content: 'That warn does not exist!', ephemeral: true });

    await warns.remove({ _id: warnID });

    interaction.reply({ content: 'Warn deleted!', ephemeral: true });
  },
  takeInfractionsInteraction: async function (interaction) {
    await interaction.deferReply();

    if (!interaction.member.roles.cache.get(process.env.MODERATOR_ROLE_ID)) return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });

    let user = interaction.options.getUser('user');

    let infractions = await warns.find({ user: user.id })

    infractions = infractions.reverse();


    // create a list of infractions, and say how many were within this week
    /* let infractionListMessage = {
      embeds: [{
        title: `Infractions for ${user.username}`,
        description: `This user has ${infractions.length} infractions. ${infractions.filter(infraction => infraction.date > Date.now() - 604800000).length} were within the last week.`,
        fields: [
          {
            name: "Infractions",
            value: infractions.map((infraction, i) => `**${infractions.length - i}**. ${infraction.message}\n\n<@${infraction.moderator}> - <t:${Math.floor(infraction.date / 1000)}:R> - [${infraction._id}](${process.env.ADMIN_URL}/dashboard/infractions/${infraction._id})`).join('\n\n'),
          },
        ],
        color: '#f03a7c',
        "thumbnail": {
          "url": user.displayAvatarURL()
        }
      }],
    } */

    let infractionListMessage = {
      embeds: [{
        title: `Infractions for ${user.username}`,
        description: `This user has ${infractions.length} infractions. ${infractions.filter(infraction => infraction.date > Date.now() - 604800000).length} were within the last week.`,
        fields: infractions.map((infraction, i) => {
          return {
            name: `Warn #${infractions.length - i}`,
            value: `${infraction.message}\n\n<@${infraction.moderator}> - <t:${Math.floor(infraction.date / 1000)}:R> - [${infraction._id}](${process.env.ADMIN_URL}/dashboard/infractions/${infraction._id})`,
          }
        }),
        color: '#f03a7c',
        "thumbnail": {
          "url": user.displayAvatarURL()
        }
      }],
    }

    try {
      await interaction.editReply(infractionListMessage);
    } catch (error) {
      interaction.editReply({ content: `There was an error sending infraction list. ${error.message}. Try viewing the infractions at ${process.env.ADMIN_URL}/dashboard/search-infractions?user=490581889980301312`, });
    }
  }
}