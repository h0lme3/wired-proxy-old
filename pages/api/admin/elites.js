import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"


async function deleteElite (req, res) {

    try {

        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.elite.deleteMany({
            where: {
                eliteId: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete elite(s).`)
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

async function createOrUpdateElite (req, res) {

    try {

        const { elite } = req.body
        if (!elite)
            throw new ApiError(`Bad request`)

        if (elite?.eliteId) {
            const updated = await prisma.elite.update({
                data: {
                    ...elite
                },
                where: {
                    eliteId: elite?.eliteId ?? undefined
                }
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this elite.`)


        } else {
            const updated = await prisma.elite.create({
                data: {
                    ...elite
                },
            })


            if (!updated)
                throw new ApiError(`Couldn't update or create this elite.`)

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

export default async function handler (req, res) {

    try {

        const session = await getSession({ req })
        if (!session?.user?.admin && session?.user?.adminType !== "PR")
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "DELETE": {
                await deleteElite(req, res)
                break
            }
            case "POST": {
                await createOrUpdateElite(req, res)
                break
            }
            default: {
                res.setHeader('Allow', 'POST, DELETE')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}