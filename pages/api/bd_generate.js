import { getSession } from "next-auth/react"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"

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

		const { country, quantity, orderId, proxyType } = req.body
        const order = await prisma.order.findFirst({
            where: {
                orderId,
                customerId,
                status: "ACTIVE"
            },
            select: {
                residentialPlanId: true,
                type: true,
            }
        })

        if (!order?.residentialPlanId || order?.type !== "CR_BD" || quantity > 10000 || quantity < 1 || country?.length > 7 || !["sticky", "rotating"].includes(proxyType))
            throw new ApiError(`Bad Request`)

        const endpoint = proxyType === "sticky" ?
            `http://localhost:4142/brightdata/generate?residential_plan_id=${order.residentialPlanId}&amount=${quantity}&country=${country}` :
            `http://localhost:4142/brightdata/generate?residential_plan_id=${order.residentialPlanId}&amount=${quantity}&country=${country}&rotating=1`
 
        const generated = await fetch(endpoint).then(res => res.json())
        if (!generated?.response?.length) 
            throw new ApiError(`Failed to generate proxies for BrightData`)

        res.status(200).send({ ok: true, proxyList: generated.response })
	
	} catch (error) {

		if (error instanceof ApiError) {
			return res.status(400).send({ ok: false, message: error.message })
		} else {
			console.error(error)
			return res.status(500).send({ ok: false, message: "Couldn't process your request at this time."})
		}

	}
}
