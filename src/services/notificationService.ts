import { config } from "@/api/server";
import type { GuildMember, Role, TextChannel } from "discord.js";
import { formatLevelUpMessage } from "@/utils/messageFormatter";

export const dispatchLevelUpMessage = async (
    member: GuildMember,
    newLevel: number,
    xp: number,
    earnedRole: Role | null,
) => {
    if (!config.level_up_channel_id || !config.level_up_message) return;

    const channel = member.guild.channels.cache.get(config.level_up_channel_id);
    if (!channel || !channel.isTextBased()) return;

    const formattedMessage = formatLevelUpMessage(
        config.level_up_message,
        member.user,
        newLevel,
        xp,
        earnedRole,
    );

    if (formattedMessage.trim().length > 0) {
        await (channel as TextChannel).send(formattedMessage);
    }
};
