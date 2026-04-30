import {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} from "discord.js";
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
        size: 2048,
    });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder({
                content: `###  ${targetUser.displayName} | ${targetUser.tag}`,
            }),
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder({
                    description: `${targetUser.tag}'s avatar`,
                    media: {
                        url: avatarUrl,
                    },
                }),
            ),
        );

    await ctx.editReply({
        flags: ["IsComponentsV2"] as const,
        components: [container],
    });
};
