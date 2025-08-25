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
            throw new ApiError(`Forbidden`)

        const { secondEmail } = req.body


        if (secondEmail && (secondEmail?.length < 2 || !secondEmail?.includes('@') || !secondEmail?.includes(".") || secondEmail?.length > 255))
            throw new ApiError("Invalid email address")

        if (secondEmail) {

            const exists = await prisma.customer.findMany({
                where: {
                    OR: [
                        {
                            email: secondEmail?.toLowerCase()
                        },
                        {
                            secondEmail: secondEmail?.toLowerCase()
                        }
                    ]
                }
            })

            if (exists.length)
                throw new ApiError("This email cannot be used as an alternate email.")
        }

        await prisma.customer.update({
            where: {
                customerId: customerId
            },
            data: {
                secondEmail: !secondEmail ? null : secondEmail.toLowerCase()
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
