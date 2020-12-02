const { Command } = require('discord.js-commando');
const ideaVault = require('../../utils/models/idea-vault.js');

module.exports = class IdeaVaultTierCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'ideavault-tier',
			group: 'ideavault',
			memberName: 'ideavault-tier',
			aliases: ['iv-tier'],
			description: 'Idea Vault tiers, different reaction counts to different channels!',
			examples: ['ideavault-tier add #channel 10', 'ideavault-tier list', 'ideavault-tier remove #channel'],
			format: '<action> [action arguments]',
			guildOnly: true,
			args: [{
				key: 'action',
				prompt: 'list/set/remove?',
				type: 'string',
				default: '',
				validate: (val) => {
					return ['list', 'set', 'remove'].includes(val);
				},
			}, {
				key: 'channel',
				prompt: 'channel?',
				type: 'channel',
				default: '',
			}, {
				key: 'threshold',
				prompt: 'threshold?',
				type: 'integer',
				default: '0',
				min: 1,
			}],
		});
	}

	hasPermission(msg) {
		if (this.client.isOwner(msg.author)) return true;
		if (msg.member.hasPermission('MANAGE_MESSAGES')) return true;
		return 'You need permission to manage messages in order to manage the idea vault.';
	}

	async run(msg, {action, channel, threshold}) {
		switch (action) {
			case '': // Do nothing. We want the code below to execute.
			case 'list':
				const tiers = await ideaVault.getTiers(msg.guild.id).then(tiers => {
					tiers.sort((a, b) => a.treshold - b.treshold);
				});
				let response = 'The current tiers for the idea vault:\n';
				for (let i = 0; i<tiers.length; i++) {
					response += `   <#${tiers[i].channel}> - ${tiers[i].treshold} 💡`;
				};
				await msg.say(response);
				break;
			case 'set':
				await ideaVault.setTier(msg.guild.id, channel.id, threshold);
				await msg.say('Set the threshold of <#' + channel.id + '> to `' + threshold + '`');
				break;
			case 'remove':
				await ideaVault.removeTier(msg.guild.id, channel);
				await msg.say(`Removed tier <#${channel.id}>!`);
		}
	}
};
