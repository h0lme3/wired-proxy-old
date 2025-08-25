import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"
import crypto from "crypto"

dayjs.extend(utc)

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

		const { orderId, action } = req.body
        const order = await prisma.order.findFirst({
            where: {
                orderId,
                customerId,
                status: "ACTIVE"
            },
            select: {
                product: true,
                orderId: true,
            }
        })

        if (!order?.product?.productServer)
            throw new ApiError(`Bad Request`)

        const { serviceId } = await prisma.server.findFirst({
            where: {
                assignedOrderId: order.orderId
            },
            select: {
                serviceId: true
            }
        })

        if (!["start", "stop", "reboot"].includes(action))
            throw new ApiError(`Bad Request`)

        const base64 = buf => Buffer.from(buf).toString("base64")

        const cookie = "WHMCSy551iLvnhYt7=br95svvhnsnr7bfe5rig3svvop"
        const key = "RNeGmIXYQVXRIjvUBu6JKQdSuBIWLWd5"
        const email = `server_sales@porterproxies.com`

        const endpoint = `https://billing.rackdog.com/modules/addons/ProductsReseller/api/index.php/services/${serviceId}/${action}`
        const token = base64(crypto.createHmac("sha256", `${email}:${dayjs().utc().format("YY-MM-DD HH")}`).update(key).digest("hex"))

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                cookie,
                token,
                username: email,
            },
        })

        const data = await response.json()
        if (data.result === "error") {
            throw new ApiError(data.error)
        }

        res.status(200).send({ ok: true })
	
	} catch (error) {

		if (error instanceof ApiError) {
			return res.status(400).send({ ok: false, message: error.message })
		} else {
			console.error(error)
			return res.status(500).send({ ok: false, message: "Couldn't process your request at this time."})
		}

	}
}
