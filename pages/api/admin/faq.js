import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"



async function deleteFaq (req, res) {

    try {

        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.fAQ.deleteMany({
            where: {
                faqId: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete faq(s).`)
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

async function createOrUpdateFaq (req, res) {

    try {

        const { guide } = req.body
        if (!guide)
            throw new ApiError(`Bad request`)

        const id = guide.faqId
        delete guide.faqId
        delete guide.id

        if (typeof id !== "undefined" && Number(id)) {
            const updated = await prisma.fAQ.update({
                data: {
                    ...guide,
                    faqOrder: Number(guide.faqOrder)
                },
                where: {
                    faqId: Number(id),
                },
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this faq.`)

        } else {
            const updated = await prisma.fAQ.create({
                data: {
                    ...guide,
                    faqOrder: Number(guide.faqOrder)
                },
            })

            if (!updated)
                throw new ApiError(`Couldn't update or create this faq.`)

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
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch (req.method) {
            case "DELETE": {
                await deleteFaq(req, res)
                break
            }
            case "POST": {
                await createOrUpdateFaq(req, res)
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