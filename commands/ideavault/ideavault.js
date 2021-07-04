const { Command } = require('discord.js-commando');
const ideaVault = require('../../models/idea-vault.js');

module.exports = class IdeaVaultCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'ideavault',
			group: 'ideavault',
			memberName: 'ideavault',
			aliases: ['iv', 'vault'],
			description: 'Enable or disable the idea vault.',
			examples: ['ideavault enable'],
			format: '<action>',
			guildOnly: true,
			args: [
				{
					key: 'action',
					prompt: 'Please specify one of: enable, disable. Or leave empty to see current value.',
					type: 'string',
					default: '',
					validate: (val, msg, currArg, prevArgs) => {
						return ['enable', 'disable', ''].includes(val);
					},
				},
			],
		});
	}

	hasPermission(msg) {
		if (this.client.isOwner(msg.author)) return true;
		if (msg.member.hasPermission('MANAGE_MESSAGES')) return true;
		return 'You need permission to manage messages in order to manage the idea vault.';
	}

	async run(msg, args) {
		switch (args.action) {
			case 'enable':
				ideaVault.enable(msg.guild.id);
				return msg.say('The idea vault is now enabled.');
			case 'disable':
				ideaVault.disable(msg.guild.id);
				return msg.say('The idea vault is now disabled.');
			case '':
				return msg.say('The idea vault is ' + (await ideaVault.isEnabled(msg.guild.id) ? 'enabled.' : 'disabled.'));
		};
	}
};
