import { getSession } from "next-auth/react"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"
import { createEvent } from "../../helpers/events"

const allowedEvents = [
    "GENERATE_PROXIES",
    "VIEW_LIST",
    "VIEW_ACCOUNTS",
    "CLICK_REGISTERED"
]

export default async function handler (req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const { type, meta } = req.body
        if (!allowedEvents.includes(type) || !meta)
            throw new ApiError(`Bad Request`)

        switch (type) {
            case "GENERATE_PROXIES":
            case "VIEW_ACCOUNTS":
            case "VIEW_LIST": {

                if (!(meta instanceof Array) || meta.length > 4 || meta.join('|').length > 1700)
                    throw new ApiError(`Bad Request`)

                const ipAddress = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
                const session = await getSession({ req })
                if (!session?.user?.customerId)
                    throw new ApiError(`Bad Request`)

                const orderId = meta[0]
                if (!orderId)
                    throw new ApiError(`Bad Request`)

                const order = await prisma.order.count({
                    where: {
                        orderId,
                        customerId: session.user.customerId,
                        status: "ACTIVE",
                    }
                })

                if (!order)
                    throw new ApiError(`Bad Request`)

                await createEvent(type, session.user.customerId, [...meta, ipAddress])
                break
            }
            case "CLICK_REGISTERED": {

                const webhookId = Number(meta)
                if (isNaN(webhookId) || !webhookId)
                    throw new ApiError(`Bad Request`)

                await prisma.webhook.update({
                    data: {
                        clicks: {
                            increment: 1
                        }
                    },
                    where: {
                        webhookId: webhookId
                    }
                })

                break
            }
        }

        res.status(200).send({ ok: true })

    } catch (error) {

        if (error instanceof ApiError) {
            return res.status(200).send({ ok: true })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }

    }
}
