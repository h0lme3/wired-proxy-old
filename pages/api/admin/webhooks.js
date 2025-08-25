import { MessageAttachment, MessageEmbed, WebhookClient } from "discord.js"

import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { formatEmailTemplate } from "../../../helpers/emails"
import { ApiError } from "../../../helpers/errors"

async function deleteWebhook (req, res) {

    try {

        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.webhook.deleteMany({
            where: {
                webhookId: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete webhook(s).`)
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

async function createOrUpdateWebhook (req, res) {

    try {

        const { webhook } = req.body
        if (!webhook)
            throw new ApiError(`Bad request`)

        if (webhook?.webhookId) {
            const updated = await prisma.webhook.update({
                data: {
                    ...webhook
                },
                where: {
                    webhookId: webhook?.webhookId ?? undefined
                }
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this webhook.`)


        } else {
            const updated = await prisma.webhook.create({
                data: {
                    ...webhook
                },
            })


            if (!updated)
                throw new ApiError(`Couldn't update or create this webhook.`)

        }

        res.status(200).send({ ok: true })

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "One or more fields are missing in the form." })
        }
    }

}

async function sendPostToWebhooks (req, res, PR) {


    try {

        const { post } = req.body
        if (!post || !post.postTitle || !post.postContent || !post.postUrlLabel)
            throw new ApiError(`Please fill in all of the required fields`)

        if (post.postTitle.length < 10 || post.postContent.length < 15 || post.postUrlLabel < 10)
            throw new ApiError(`Post title, content or image URL is too short`)


        const activeWebhooks = await prisma.webhook.findMany(PR ? {
            where: {
                status: {
                    in: ['Active', 'Manual']
                },
                manager: PR
            }
        } : {
            where: {
                status: {
                    in: ['Active', 'Manual']
                },
            }
        })

        const webhooksToSend = post.regions ? activeWebhooks.filter(e => {
            const regions = post.regions.split(",").map(e => e.trim().toLowerCase())
            return regions.some(region => e.regions.split(",").map(e => e.trim().toLowerCase()).includes(region))
        }) : activeWebhooks

        let successCount = 0
        for (let group of webhooksToSend) {
            await new Promise(r => setTimeout(r, 20))


            try {

                const coupon = await prisma.promotion.findUnique({
                    where: {
                        discountCode: group.coupon
                    },
                    select: {
                        discount: true
                    }
                })

                if (!coupon) {
                    await webhookFailureNotification({
                        groupId: group.name + '(' + group.webhookId + ')',
                        groupWebhook: group.webhook,
                        errorMessage: "Failed to send due to coupon not being found"
                    })
                }


                const content = formatEmailTemplate(post.postContent, { coupon: group.coupon, coupon_discount: coupon.discount, ref: group.webhookId }, true)
                const embed = new MessageEmbed()
                    .setTitle(post.postTitle)
                    .setDescription(content)
                    .setColor(0x8927F2)
                    .setImage(post.postUrlLabel)
                    .setFooter({ text: `Porter Proxies`, iconURL: process.env.NEXT_PUBLIC_DOMAIN + 'website/images/Porter_Transparent-07.png' })

                const webhook = new WebhookClient({ url: group.webhook })

                const attachment = new MessageAttachment(Buffer.from(content, 'utf-8'), 'content.txt');


                const result = group.status === "Manual" ?
                    await webhook.send({ content: `New Porter Restock! Content attached. Group: ${group.name} (${group.webhookId})\n\nTitle\`\`\`${post.postTitle}\`\`\`\n\nImage\`\`\`${post.postUrlLabel}\`\`\``, files: [attachment] }) :
                    await webhook.send({ embeds: [embed] })

                if (result) {
                    successCount++
                } else {

                    await webhookFailureNotification({
                        groupId: group.name + '(' + group.webhookId + ')',
                        groupWebhook: group.webhook,
                        errorMessage: "Failed to send due to an unspecified error"
                    })

                }

            } catch (error) {
                await webhookFailureNotification({
                    groupId: group.name + ' (' + group.webhookId + ')',
                    groupWebhook: group.webhook,
                    errorMessage: error?.message
                })

            }
        }

        res.status(200).send({ ok: true, posted: successCount, total: webhooksToSend.length })

    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }
    }

}

async function webhookFailureNotification (data) {
    try {

        const { failureWebhook } = await prisma.config.findUnique({
            where: {
                configId: 1
            },
            select: {
                failureWebhook: true
            }
        })

        const embed = new MessageEmbed()
            .setTitle(`Group Webhook Failure Notification`)
            .setColor(0xFF2976)
            .addField("Group", `${data.groupId}`)
            .addField("Webhook", `${data.groupWebhook}`)
            .addField("Error", data?.errorMessage ?? "Unknown")
            .setFooter({ text: `Porter Proxies`, iconURL: process.env.NEXT_PUBLIC_DOMAIN + 'website/images/Porter_Transparent-07.png' })
            .setTimestamp()

        const webhook = new WebhookClient({ url: failureWebhook })
        const result = await webhook.send({ embeds: [embed] })

        return true

    } catch (error) {
        console.error(error)
    }

    return false
}

export default async function handler (req, res) {

    try {

        const session = await getSession({ req })
        if (!session?.user?.admin && session?.user?.adminType !== "PR")
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "DELETE": {
                await deleteWebhook(req, res)
                break
            }
            case "POST": {
                await createOrUpdateWebhook(req, res)
                break
            }
            case "PUT": {
                await sendPostToWebhooks(req, res, session?.user?.adminType === "PR" ? session?.user?.customerId : false)
                break
            }
            default: {
                res.setHeader('Allow', 'POST, DELETE, PUT')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}