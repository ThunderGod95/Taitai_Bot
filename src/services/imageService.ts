import type { User } from "@/types";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

export const generateRankCard = async (userData: any) => {
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    const bgGradient = ctx.createLinearGradient(0, 0, 800, 250);
    bgGradient.addColorStop(0, "#181825");
    bgGradient.addColorStop(1, "#1e1e2e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatarX = 130;
    const avatarY = 125;
    const avatarRadius = 80;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    if (userData.avatar_url) {
        try {
            const avatar = await loadImage(userData.avatar_url);
            ctx.drawImage(
                avatar,
                avatarX - avatarRadius,
                avatarY - avatarRadius,
                avatarRadius * 2,
                avatarRadius * 2,
            );
        } catch (e) {
            ctx.fillStyle = "#313244";
            ctx.fillRect(
                avatarX - avatarRadius,
                avatarY - avatarRadius,
                avatarRadius * 2,
                avatarRadius * 2,
            );
        }
    } else {
        ctx.fillStyle = "#313244";
        ctx.fillRect(
            avatarX - avatarRadius,
            avatarY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2,
        );
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#89b4fa";
    ctx.stroke();

    // Username
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(userData.username, 250, 100);

    // Rank Text
    ctx.fillStyle = "#a6adc8";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Rank #${userData.rank}`, 250, 140);

    // Level Text
    const levelText = `Level ${userData.level}`;
    ctx.fillStyle = "#89b4fa";
    ctx.font = "bold 48px sans-serif";
    const levelWidth = ctx.measureText(levelText).width;
    ctx.fillText(levelText, 750 - levelWidth, 105);

    // Layout variables for the progress section
    const barX = 250;
    const barY = 180;
    const barWidth = 500;
    const barHeight = 24;
    const barRadius = 12;

    // XP Text
    const xpText = `${userData.currentLevelProgress} / ${userData.xpNeededForLevel} XP`;
    ctx.fillStyle = "#a6adc8";
    ctx.font = "bold 16px sans-serif";
    const xpTextWidth = ctx.measureText(xpText).width;
    ctx.fillText(xpText, barX + barWidth - xpTextWidth, barY - 10);

    // Progress Bar
    ctx.fillStyle = "#313244";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barRadius);
    ctx.fill();

    const progressPercentage = Math.min(
        Math.max(userData.currentLevelProgress / userData.xpNeededForLevel, 0),
        1,
    );
    const fillWidth = progressPercentage * barWidth;

    if (fillWidth > 0) {
        const fillGradient = ctx.createLinearGradient(
            barX,
            0,
            barX + barWidth,
            0,
        );
        fillGradient.addColorStop(0, "#89b4fa"); // Blue
        fillGradient.addColorStop(1, "#cba6f7"); // Mauve

        ctx.fillStyle = fillGradient;
        ctx.beginPath();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, barRadius);
        ctx.clip();

        ctx.fillRect(barX, barY, fillWidth, barHeight);
        ctx.restore();
    }

    return canvas.toBuffer("image/png");
};

export const generateLeaderboardImage = async (
    data: any[],
    timeframe: string,
) => {
    const rowHeight = 95;
    const paddingTop = 30;
    const paddingBottom = 20;
    const canvasHeight = paddingTop + data.length * rowHeight + paddingBottom;

    const canvas = createCanvas(800, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background
    const bgGradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
    );
    bgGradient.addColorStop(0, "#181825");
    bgGradient.addColorStop(1, "#1e1e2e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatars = await Promise.all(
        data.map(async (user) => {
            if (!user.avatar_url) return null;
            try {
                return await loadImage(user.avatar_url);
            } catch {
                return null;
            }
        }),
    );

    for (let i = 0; i < data.length; i++) {
        const user = data[i];
        const yOffset = paddingTop + i * rowHeight;

        const avatar = avatars[i];
        const avatarSize = 64;
        const avatarY = yOffset + 12;
        const avatarCenterX = 40 + avatarSize / 2;
        const avatarCenterY = avatarY + avatarSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            avatarCenterX,
            avatarCenterY,
            avatarSize / 2,
            0,
            Math.PI * 2,
            true,
        );
        ctx.clip();

        if (avatar) {
            ctx.drawImage(avatar, 40, avatarY, avatarSize, avatarSize);
        }
        ctx.restore();

        const textY = yOffset + 50;
        const textStartX = 120;

        ctx.fillStyle = i < 3 ? "#f9e2af" : "#a6adc8";
        ctx.font = "bold 32px sans-serif";
        const rankText = `#${i + 1}`;
        ctx.fillText(rankText, textStartX, textY);
        const rankWidth = ctx.measureText(rankText).width;

        ctx.fillStyle = "#cdd6f4";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText(
            `${user?.username || "unknown"}`,
            textStartX + rankWidth + 12,
            textY,
        );

        ctx.fillStyle = "#cdd6f4";
        ctx.font = "bold 30px sans-serif";
        const rightSideText =
            timeframe === "overall"
                ? `LVL: ${user?.level}`
                : `+${user?.total_xp!} XP`;

        const textWidth = ctx.measureText(rightSideText).width;
        ctx.fillText(`${rightSideText}`, 760 - textWidth, textY);

        const barX = textStartX;
        const barY = yOffset + 70;
        const barWidth = 760 - textStartX;
        const barHeight = 6;

        ctx.fillStyle = "#313244";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 3);
        ctx.fill();

        const progress = Math.min(Math.max(user.xp / user.xpNeeded, 0), 1);
        const fillWidth = progress * barWidth;

        if (fillWidth > 0) {
            ctx.fillStyle = "#89b4fa";
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight, 3);
            ctx.fill();
        }
    }

    return canvas.toBuffer("image/png");
};
