import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

	try {

        const session = await getSession({ req })
        const customerId = session?.user?.customerId ?? false
        if (!customerId)
            throw ApiError(`Forbidden`)

		const { orderId } = req.body
        const order = await prisma.order.findFirst({
            where: {
                orderId,
                customerId,
                status: "ACTIVE"
            },
            select: {
                product: true,
                orderId: true,
                type: true,
            }
        })

        if (!order?.product?.productServer)
            throw new ApiError(`Bad Request`)

        const { ipAddress, username, password } = await prisma.server.findFirst({
            where: {
                assignedOrderId: order.orderId
            },
            select: {
                ipAddress: true,
                username: true,
                password: true,
                
            }
        })

        res.status(200).send({ ok: true, data: { ipAddress, username, password, type: order.type, orderId: order.orderId }})
	
	} catch (error) {

		if (error instanceof ApiError) {
			return res.status(400).send({ ok: false, message: error.message })
		} else {
			console.error(error)
			return res.status(500).send({ ok: false, message: "Couldn't process your request at this time."})
		}

	}
}
