import { MessageEmbed, WebhookClient } from "discord.js"

import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"
import { emailTemplate, formatWiredNewsletter, sendEmail, sendWiredEmail } from "../../../helpers/emails"

async function emailWiredCustomers (post) {

    try {

        let customers
        if (post.everyone) {
            customers = await prisma.customer.findMany({
                where: {
                    newsletter: 1,
                    site: "wired"
                },
                select: {
                    email: true,
                    firstName: true,
                    lastName: true
                }
            })
        } else {
            customers = await prisma.customer.findMany({
                where: {
                    newsletter: 1,
                    site: "wired",
                    orders: {
                        some: {
                            status: "ACTIVE"
                        }
                    }
                },
                select: {
                    email: true,
                    firstName: true,
                    lastName: true
                }
            })
        }

        const formattedPostContent = (post.postContent.replace(/\n/g, '<br />') + `
            <br /> 
            <br />
            <strong>Join our Discord or Newsletter to stay up to date with the latest products, stock and news!</strong>
            <br /><br /><strong>Discord Invite:</strong> <a style="text-decoration: underline; color: #0068A5;" href="https://discord.gg/WDmy7EmRZu">https://discord.gg/WDmy7EmRZu</a>
            <br /><strong>Newsletter Opt In/Out:</strong> <a style="text-decoration: underline; color: #0068A5;" href="https://wiredproxies.com/newsletter">https://wiredproxies.com/newsletter</a>
        `)

        for (let customer of customers) {

            const content = formatWiredNewsletter(formattedPostContent, { customer: customer.firstName + ' ' + customer.lastName })
            const newsletter = await emailTemplate("blank", {
                content,
            }, true)

            // const result = await sendWiredEmail(customer.email, post.postTitle, newsletter)

        }

    } catch (error) {
        console.error(error)
    }

}

async function sendPost (req, res) {


    try {

        const { post } = req.body
        if (!post || !post.postTitle || !post.postContent)
            throw new ApiError(`Please fill in all of the required fields`)

        if (post.postTitle.length < 5 || post.postContent.length < 5)
            throw new ApiError(`Post title, content or image URL is too short`)

        if (!post.discord && !post.email && !post.everyone)
            throw new ApiError(`Please choose where to send this post`)


        if (post.discord) {

            const embed = new MessageEmbed()
                .setTitle(post.postTitle)
                .setDescription(post.postContent)
                .setColor(0Xff5600)
                .setFooter({ text: `Wired Proxies`, iconURL: `https://media.discordapp.net/attachments/590035993273434146/1098921859761836032/Group_1.png` })

            if (post.postUrlLabel)
                embed.setImage(post.postUrlLabel)

            try {
                const webhook = new WebhookClient({ url: `https://discord.com/api/webhooks/1096084712885338152/xbOez1rR2kPyAACXbp_CxcxfWt7A0qWUIDTi84mzhcX8ATMBU98Gs5vZBdA9V4CCV-cR` })
                //const webhook = new WebhookClient({ url: `https://discord.com/api/webhooks/798324845745930260/QFHf6PcDxhtS2d-zNzYQLmjavMSLI4GiPgPBF1peuKP912_3WgjExnYlIjp48Gr1AuGj` })
                const result = await webhook.send({ embeds: [embed] })

            } catch (error) {
                console.error(error)
            }
        }

        if (post.email || post.everyone) {
            emailWiredCustomers(post)
        }

        res.status(200).send({ ok: true })

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }
    }

}


export default async function handler (req, res) {

    try {

        const session = await getSession({ req })
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "POST": {
                await sendPost(req, res)
                break
            }
            default: {
                res.setHeader('Allow', 'POST')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}