import { getSession } from "next-auth/react"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"

export default async function handler (req, res) {

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

        const { field, value } = req.body

        if (!["phoneWebhook", "ptWebhook", "insomniacWebhook", "automatiqWebhook"].includes(field))
            throw ApiError(`Forbidden`)

        if (value.length > 1000)
            throw ApiError(`Value entered is too long...`)


        await prisma.customer.update({
            where: {
                customerId: customerId
            },
            data: {
                [field]: field == "automatiqWebhook" ? +value : value
            }
        })

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
