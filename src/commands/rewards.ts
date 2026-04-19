import { getRoleRewardsQuery } from "@/db";
import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "@/utils/commandContext";

export const data = new SlashCommandBuilder()
    .setName("rewards")
    .setDescription("View all level-based role rewards in this server.");

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const rewards = getRoleRewardsQuery.all();
    if (!rewards || rewards.length === 0) {
        return ctx.editReply(
            "There are no role rewards configured for this server yet.",
        );
    }

    const rewardLines = rewards
        .map((reward) => `**${reward.level}** ➔ <@&${reward.role_id}> `)
        .join("\n");
    const embed = new EmbedBuilder()
        .setDescription(`# Rewards\n${rewardLines}`)
        .setColor([22, 26, 28]);

    await ctx.editReply({ embeds: [embed] });
};
