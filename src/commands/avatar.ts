import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandContext } from "@/utils/commandContext";

export const data = new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("View your or another user's avatar.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user whose avatar you want to view")
            .setRequired(false),
    );

export const aliasData = new SlashCommandBuilder()
    .setName("av")
    .setDescription("View your or another user's avatar.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user whose avatar you want to view")
            .setRequired(false),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const targetUser = ctx.getTargetUser();

    const avatarUrl = targetUser.displayAvatarURL({
        size: 1024,
    });

    const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}'s Avatar`)
        .setImage(avatarUrl)
        .setColor([22, 26, 28]);

    await ctx.editReply({ embeds: [embed] });
};
