import { readFile } from "fs/promises"
import nodemailer from "nodemailer"

const constants = {
    discord_link: "https://discord.com/",
    dashboard_link: process.env.NEXT_PUBLIC_DOMAIN,
    company_name: "Wired",
    link: process.env.NEXT_PUBLIC_DOMAIN,
    logo_link: process.env.NEXT_PUBLIC_DOMAIN + '/logo.png'
}


const wired = {
    discord_link: "https://discord.com/",
    dashboard_link: `https://wiredproxies.com`,
    company_name: "Wired",
    link: `https://wiredproxies.com`,
    logo_link: `https://wiredproxies.com/logo.png`
}


export function formatWiredNewsletter (email, args, double = false) {
    return email.replace(!double ? /{(.*?)}/g : /\{\{(.+?)\}\}/g, (_, literal) => {
        return literal in wired
            ? wired[literal]
            : literal in (args || {})
                ? args[literal]
                : _
    })
}


export async function emailTemplate (file, args, wired = false) {

    try {

        const header = await readFile(`./helpers/email_templates/header.txt`, { encoding: "utf-8" })
        const email = await readFile(`./helpers/email_templates/${file}.txt`, { encoding: "utf-8" })
        return (wired ? formatWiredNewsletter : formatEmailTemplate)(header + email, args)

    } catch (e) {
        console.error(e)
    }

    return false

}

export async function sendWiredEmail (to, title, content) {
    return false
}


export function formatEmailTemplate (email, args, double = false) {
    return email.replace(!double ? /{(.*?)}/g : /\{\{(.+?)\}\}/g, (_, literal) => {
        return literal in constants
            ? constants[literal]
            : literal in (args || {})
                ? args[literal]
                : _
    })
}
export async function sendEmail (to, title, content) {
    return sendWiredEmail(to, title, content)

    /*
    try {

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_LOGIN,
                pass: process.env.EMAIL_PASSWORD,
            },
        })

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: title,
            html: content,
        })

        return info

    } catch (e) {
        console.error(e)
    }

    return false
    */
}

