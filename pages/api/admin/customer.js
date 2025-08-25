import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

async function createOrUpdateCustomer (req, res) {

    try {

        const { customer } = req.body
        if (!customer)
            throw new ApiError(`Bad request`)

        if (customer.potential) {

            const updated = await prisma.potentialCustomer.upsert({
                create: {
                    email: customer.email,
                    favourite: customer.favourite,
                    note: customer.note,
                    reportMainEmail: customer.reportMainEmail
                },
                update: {
                    favourite: customer.favourite,
                    note: customer.note,
                    reportMainEmail: customer.reportMainEmail
                },
                where: {
                    email: customer.email
                }
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this customer.`)

        } else {

            const updated = await prisma.customer.update({
                data: {
                    note: customer.note,
                    favourite: Number(customer.favourite),
                    reportMainEmail: customer.reportMainEmail,

                },
                where: {
                    customerId: customer.customerId,
                }
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this customer.`)

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

async function deleteCustomer (req, res) {

    try {

        const { email } = req.body
        if (!email)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.potentialCustomer.delete({
            where: {
                email: email
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete customer.`)
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
export default async function handler (req, res) {

    try {

        const session = await getSession({ req })
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "POST": {
                await createOrUpdateCustomer(req, res)
                break
            }
            case "DELETE": {
                await deleteCustomer(req, res)
                break
            }
            default: {
                res.setHeader('Allow', 'POST, DELETE, PATCH')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}