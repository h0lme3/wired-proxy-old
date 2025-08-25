import { getSession } from "next-auth/react"
import Stripe from "stripe"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

const stripe = Stripe(process.env.STRIPE_SECRET)

export default async function handler (req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const session = await getSession({ req })
        if (!(session?.user?.customerId))
            throw new ApiError("Unauthorized")

        const { user: { customerId } } = session
        const user = await prisma.customer.findUnique({
            where: {
                customerId: customerId
            }
        })

        if (!user)
            throw new ApiError("Unauthorized")

        if (!user.stripeId)
            throw new ApiError(`You don't have any subscriptions to manage yet`)

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeId
        })

        if (!portalSession?.url)
            throw new ApiError(`Can't open a billing portal at the moment`)


        res.status(200).send({ ok: true, redirect: portalSession.url })

    } catch (error) {

        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }

    }

    return true

}