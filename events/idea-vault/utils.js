const { MessageEmbed } = require('discord.js');

const ideaVault = require('../../models/idea-vault');

const RESERVED_IDEA_POST_ID = '0';
const IDEA_VOTE_EMOJI = '💡';
const IDEA_VOTE_EMOJI_IMAGE = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/light-bulb_1f4a1.png';
const RATE_LIMIT_SLOWDOWN_DELAY = 1000;
const AIRTABLE_RETRY_DELAY = 1000 * 5;
const AIRTABLE_SYNC_CATEGORIES_INTERVAL = 1000 * 60 * 30;

async function getTierForBulbCount(guild, count) {
	const tiers = await ideaVault.getTiers(guild);
	return tiers.sort((a, b) => b.threshold - a.threshold).find((tier) => count >= tier.threshold);
}

async function filterReaction(reaction) {
	if (reaction.emoji.name !== IDEA_VOTE_EMOJI) return false;

	await reaction.message.fetch(true);
	await reaction.fetch();

	if (!ideaVault.isEnabled(reaction.message.guild.id)) return false;
	// If the category, or the specific channel is not allowed
	if (!ideaVault.isAllowed(reaction.message.channel.parent?.id) &&
		!ideaVault.isAllowed(reaction.message.channel.id)) {
		return false;
	}

	// If people are reacting to posts
	// EDIT: May not be needed because of the allowed code above?
	// if (await ideaVault.getIdeaByPost(reaction.message.id)) return false;

	return true;
}

function generatePostEmbedFooterText(id, count, msg, tagged_channel) {
	if (!tagged_channel) return `${count} | Idea #${id} | Uncategorized`;

	// Unfortunately we cannot do tags in embeds, so we have to look up the channel name.
	const channelName = msg.guild
		.channels.cache.get(tagged_channel)
		.name;
	return `${count} | Idea #${id} | Category: ${channelName}`;
}

async function generatePostEmbed(id, msg, count, comments = [], tagged_channel) {
	const embed = new MessageEmbed({
		author: {
			name: `${msg.author.username} in #${msg.channel.name}`,
			icon_url: msg.author.avatarURL(),
		},
		description: msg.content,
		footer: {
			icon_url: IDEA_VOTE_EMOJI_IMAGE,
			text: generatePostEmbedFooterText(id, count, msg, tagged_channel),
		},
		timestamp: msg.createdAt,
	});

	embed.addField('Original message', '[Here](' + msg.url + ')');

	if (msg.attachments.size) {
		const att = msg.attachments.first();
		const imgtypes = ['jpg', 'jpeg', 'png', 'gif'];
		if (imgtypes.includes(att.name.split('.').slice(-1)[0].toLowerCase())) {
			embed.setImage(att.url);
		} else {
			embed.addField('Attachments', att.url);
		}
	} else if (msg.embeds.length) {
		const msgEmbed = msg.embeds[0];
		switch (msgEmbed.type) {
			case 'gifv':
				embed.setImage(msgEmbed.url);
				break;
			case 'video':
				embed.setTitle(msgEmbed.title);
				embed.setURL(msgEmbed.url);
				if (msgEmbed.thumbnail) embed.setThumbnail(msgEmbed.thumbnail.url);
				break;

			case 'link':
			case 'article':
				embed.setTitle(msgEmbed.title);
				embed.setURL(msgEmbed.url);
				if (msgEmbed.thumbnail) embed.setThumbnail(msgEmbed.thumbnail.url);
				break;

			case 'rich':
				if (msgEmbed.title) embed.setTitle(msgEmbed.title);
				if (msgEmbed.description) embed.addField('Embed', msgEmbed.description);

				embed.fields.push(...msgEmbed.fields);

				if (msgEmbed.thumbnail) embed.setThumbnail(msgEmbed.thumbnail.url);
				if (msgEmbed.image) embed.setImage(msgEmbed.image.url);
				break;
		}
	}
	for (const comment of comments) {
		const author = await msg.guild.members.fetch(comment.author);
		embed.addField('💬 Comment from ' + author.displayName, comment.value);
	}

	embed.setColor(msg.guild.me.displayColor || 16741829);
	return embed;
};

module.exports = {
	RESERVED_IDEA_POST_ID,
	IDEA_VOTE_EMOJI,
	IDEA_VOTE_EMOJI_IMAGE,
	RATE_LIMIT_SLOWDOWN_DELAY,
	AIRTABLE_RETRY_DELAY,
	AIRTABLE_SYNC_CATEGORIES_INTERVAL,
	getTierForBulbCount,
	filterReaction,
	generatePostEmbed,
	generatePostEmbedFooterText,
};
