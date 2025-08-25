import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"



async function deleteGuide (req, res) {

    try {

        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.guide.deleteMany({
            where: {
                guideSlug: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete guide(s).`)
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

async function createOrUpdateGuide (req, res) {

    try {

        const { guide } = req.body
        if (!guide)
            throw new ApiError(`Bad request`)

        const updated = await prisma.guide.upsert({
            create: {
                ...guide
            },
            update: {
                ...guide
            },
            where: {
                guideSlug: guide.guideSlug
            }
        })

        if (!updated)
            throw new ApiError(`Couldn't update or create this guide.`)


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
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "DELETE": {
                await deleteGuide(req, res)
                break
            }
            case "POST": {
                await createOrUpdateGuide(req, res)
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