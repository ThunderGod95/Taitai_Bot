import type { Role, User } from "discord.js";

export const formatLevelUpMessage = (
    template: string,
    user: User,
    level: number,
    xp: number,
    earnedRole?: Role | null,
): string => {
    let formatted = template
        .replace(/\{user\.mention\}/g, `<@${user.id}>`)
        .replace(/\{user\.name\}/g, user.username)
        .replace(/\{user\.level\}/g, level.toString())
        .replace(/\{user\.xp\}/g, xp.toString());

    formatted = formatted.replace(/\{earned:(.*?)\}/g, (match, innerText) => {
        if (!earnedRole) return "";

        return innerText
            .replace(/\{name\}/g, earnedRole.name)
            .replace(/\{mention\}/g, `<@&${earnedRole.id}>`);
    });

    return formatted;

    return "";
};
