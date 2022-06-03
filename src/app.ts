import { Context, Markup, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import { projectData } from './projectData';
import { Testing } from './Testing';
const bot: Telegraf<Context<Update>> = new Telegraf("APP_KEY");
const testing: any = new Testing();

bot.start((ctx) => {
    const keyboardStart = Markup.keyboard([
        Markup.button.callback('/start', 'start')
    ]);
    if(ctx.message.from.username!=="Wellng2") return ctx.reply('User not allowed!')
    ctx.reply('Hello ' + ctx.from.first_name + '!', keyboardStart);

    const menu = Markup.inlineKeyboard(
        Object.keys(projectData)
            .map((key)=>Markup.button.callback(
                key.toUpperCase(),
                'setProject:'.concat(key)
            ))
    );
    ctx.reply(
        'Pilih project',
        menu
    );
});
bot.help((ctx) => {
    ctx.reply('Send /quit to stop the bot');
});
bot.command('quit', (ctx) => {
    // Explicit usage
    ctx.telegram.leaveChat(ctx.message.chat.id);
    // Context shortcut
    ctx.leaveChat();
});

bot.on('callback_query', async (ctx) => {
    if ((ctx.callbackQuery as any).data) {
        const cmd = ((ctx.callbackQuery as any).data as string).split(":");
        if(!testing[cmd[0]]) return ctx.reply('Command not found!');
        testing[cmd[0]](cmd[1], ctx)
    }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));