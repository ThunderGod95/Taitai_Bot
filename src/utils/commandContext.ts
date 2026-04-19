import { ChatInputCommandInteraction, TextChannel, type Message, type User } from "discord.js";

export class CommandContext {
    public readonly raw: ChatInputCommandInteraction | Message;
    public readonly isInteraction: boolean;
    public readonly user: User;
    private replyMessage: Message | null = null;

    constructor(payload: ChatInputCommandInteraction | Message) {
        this.raw = payload;
        this.isInteraction = payload instanceof ChatInputCommandInteraction;
        this.user = this.isInteraction
            ? (payload as ChatInputCommandInteraction).user
            : (payload as Message).author;
    }

    async deferReply() {
        if (this.isInteraction) {
            await (this.raw as ChatInputCommandInteraction).deferReply();
        } else {
            await ((this.raw as Message).channel as TextChannel).sendTyping();
        }
    }

    async editReply(content: any) {
        if (this.isInteraction) {
            return await (this.raw as ChatInputCommandInteraction).editReply(content);
        } else {
            if (this.replyMessage) {
                return await this.replyMessage.edit(content);
            } else {
                this.replyMessage = await (this.raw as Message).reply(content);
                return this.replyMessage;
            }
        }
    }

    getTargetUser(): User {
            if (this.isInteraction) {
                return (this.raw as ChatInputCommandInteraction).options.getUser("user") || this.user;
            } else {
                const msg = this.raw as Message;
                // Check for explicit @mentions
                const mention = msg.mentions.users.first();
                if (mention) return mention;

                // Check for raw IDs passed as the first argument
                const args = msg.content.split(/ +/).slice(1);
                if (args[0]) {
                    const rawId = args[0].replace(/[<@!>]/g, '');
                    const cachedUser = msg.client.users.cache.get(rawId);
                    if (cachedUser) return cachedUser;
                }

                return this.user;
            }
        }
}
