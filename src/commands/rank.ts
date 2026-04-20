import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { fetchUserRankData } from "@/services/dataService";
import { generateRankCard } from "@/services/imageService";
import { CommandContext } from "@/utils/commandContext";
import { BOT_UNKNOWNS } from "@/services/xpService";

export const data = new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your or another user's current rank and XP.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to check (defaults to you)")
            .setRequired(false),
    );

export const aliasData = new SlashCommandBuilder()
    .setName("level")
    .setDescription("Check your or another user's current rank and XP.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to check (defaults to you)")
            .setRequired(false),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const targetUser = ctx.getTargetUser();

    if (BOT_UNKNOWNS.includes(targetUser.id)) {
        return ctx.editReply("We dare not measure the heavens.");
    }

    const rankData = fetchUserRankData(targetUser.id);

    if (!rankData) {
        return ctx.editReply("This user hasn't earned any XP yet.");
    }

    if (!rankData.avatar_url) {
        rankData.avatar_url = targetUser.displayAvatarURL({
            extension: "png",
            size: 256,
        });
    }

    const imageBuffer = await generateRankCard(rankData);
    const attachment = new AttachmentBuilder(imageBuffer, {
        name: "rank-card.png",
    });

    await ctx.editReply({ files: [attachment] });
};
