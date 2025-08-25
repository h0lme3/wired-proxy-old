import { MessageEmbed, WebhookClient } from "discord.js"

import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { formatEmailTemplate } from "../../../helpers/emails"
import { ApiError } from "../../../helpers/errors"

async function updateWebhookStatus (req, res) {

    try {

        const { id, toggle } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const updated = await prisma.ppGroup.updateMany({
            where: {
                groupId: {
                    in: id
                }
            },
            data: {
                groupStatus: ["DISABLED", "ACTIVE"][+toggle]
            }
        })

        if (!updated) {
            throw new ApiError(`Couldn't update webhook(s)`)
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

async function deleteWebhook (req, res) {

    try {

        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.ppGroup.deleteMany({
            where: {
                groupId: {
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

        const session = await getSession({ req })

        if (webhook.groupId) {

            const updated = await prisma.ppGroup.update({
                data: {
                    ...webhook
                },
                where: {
                    groupId: webhook.groupId
                }
            })

            if (!updated) {
                throw new ApiError(`Couldn't create or update this webhook.`)
            }

            return res.status(200).send({ ok: true })
        }

        const created = await prisma.ppGroup.create({
            data: {
                ...webhook,
                groupDatetime: new Date(),
                groupSourceId: session.user.customerId
            }
        })

        if (!created) {
            throw new ApiError(`Couldn't create or update this webhook.`)
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

async function sendPostToWebhooks (req, res) {


    try {

        const { post } = req.body
        if (!post || !post.postTitle || !post.postContent || !post.postUrlLabel)
            throw new ApiError(`Please fill in all of the required fields`)

        if (post.postTitle.length < 10 || post.postContent.length < 15 || post.postUrlLabel < 10)
            throw new ApiError(`Post title, content or image URL is too short`)

        const activeGroups = await prisma.ppGroup.findMany({
            where: {
                groupStatus: "ACTIVE"
            }
        })


        let successCount = 0
        for (let group of activeGroups) {
            await new Promise(r => setTimeout(r, 20))

            const content = formatEmailTemplate(post.postContent, { coupon: group.groupCoupon, coupon_discount: group.groupCouponDiscount }, true)
            const embed = new MessageEmbed()
                .setTitle(post.postTitle)
                .setDescription(content)
                .setColor(0x8927F2)
                .setImage(post.postUrlLabel)
                .setFooter({ text: `Porter Proxies`, iconURL: process.env.NEXT_PUBLIC_DOMAIN + 'website/images/Porter_Transparent-07.png' })

            try {

                const webhook = new WebhookClient({ url: group.groupWebhook })
                const result = await webhook.send({ embeds: [embed] })
                if (result) {
                    successCount++
                } else {

                    await webhookFailureNotification({
                        groupId: group.groupName + '(' + group.groupId + ')',
                        groupWebhook: group.groupWebhook,
                        errorMessage: "Failed to send due to an unspecified error"
                    })

                }

            } catch (error) {
                await webhookFailureNotification({
                    groupId: group.groupName + ' (' + group.groupId + ')',
                    groupWebhook: group.groupWebhook,
                    errorMessage: error?.message
                })

            }
        }

        res.status(200).send({ ok: true, posted: successCount, total: activeGroups.length })

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
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "PATCH": {
                await updateWebhookStatus(req, res)
                break
            }
            case "PUT": {
                await sendPostToWebhooks(req, res)
                break
            }
            case "POST": {
                await createOrUpdateWebhook(req, res)
                break
            }
            case "DELETE": {
                await deleteWebhook(req, res)
                break
            }
            default: {
                res.setHeader('Allow', 'POST, PUT, DELETE, PATCH')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}