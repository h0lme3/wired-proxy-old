import { getSession } from "next-auth/react"
import Stripe from "stripe"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

const stripe = Stripe(process.env.STRIPE_SECRET)

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const { orderId, ecomOrderId } = req.body
        if (!orderId || !ecomOrderId)
            throw new ApiError("This order is not a subscription")

        const session = await getSession({ req })
        if (!(session?.user?.customerId)) 
            throw new ApiError("Unauthorized")

        const { user: { customerId } } = session    
        const order = await prisma.order.findFirst({
            where: {
                orderId,
                ecomOrderId,
                customerId
            }
        })

        if (!order)
            throw new ApiError(`Couldn't find this order`)

        await stripe.subscriptions.del(ecomOrderId)

        res.status(200).send({ ok: true })
        
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