import { Context, Markup } from "telegraf";
import { projectData } from "./projectData";
import fs from 'fs';

interface TestingInterface {
    [index: string]: any
}
export class Testing implements TestingInterface {
    project: string = "";
    isRunScript=false;
    async spawnTest(command: string, ctx: Context) {
        if(this.isRunScript) return ctx.reply("Another test still running!");
        this.isRunScript = true;
        const logger = (message: string) => {
            ctx.reply(`${this.project}:${command}:${message.substring(0, 500)}`)
        }
        if (fs.existsSync('capture.flv'))
            fs.unlinkSync('capture.flv');
        if (fs.existsSync('capture.mp4'))
            fs.unlinkSync('capture.mp4');
        if (!this.project) return logger("Select project first with /start");
        logger("Spawning command:".concat(projectData[this.project][command]));
        const ffmpeg = require("ffmpeg-static");
        const { spawn: sp } = require("child_process");

        const videoProcess = sp(
            ffmpeg,
            ["-probesize", "10M", "-f", "gdigrab", "-framerate", "60", "-i", "desktop", "-f", "flv", "-"],
            { stdio: "pipe" }
        );

        const stream = videoProcess.stdout;
        const { createWriteStream } = require("fs");
        const file = createWriteStream("capture.flv");
        stream.pipe(file);
        const spawn = require('node-cmd').run;
        const child = spawn(projectData[this.project][command]);
        child.stdout.on('data', (d: any) => logger(d.toString()));
        child.stderr.on('data', (d: any) => logger(d.toString()));
        return new Promise((resolve) => {
            child.on('close', (code: number) => {
                videoProcess.on('close', () => {

                    const mp4 = sp(
                        ffmpeg,
                        ["-i", "capture.flv", "capture.mp4",]
                    );

                    mp4.on('close', () => {
                        ctx.reply("Uploading Video Result...");
                        ctx.replyWithVideo({ source: 'capture.mp4' });
                        this.isRunScript = false;
                        resolve(code);
                    })
                });
                videoProcess.kill();
                logger(`${this.project} ${command} exit code ${code}`);
            });
        });
    }
    setProject(newProject: string, ctx: Context) {
        this.project = newProject;
        const menu = Markup.inlineKeyboard(
            Object.keys(projectData[this.project])
                .map((key) => Markup.button.callback(
                    key.toUpperCase(),
                    'spawnTest:'.concat(key)
                ))
        );
        ctx.reply(
            'Test Command:',
            menu
        );
    }
}