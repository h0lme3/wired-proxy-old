import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

async function deleteProductPage (req, res) {
    
    try {
        
        const { id } = req.body
        if (!id)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.productPage.delete({
            where: {
                productPageId: id
            }
        })

        if (!deleted)
            throw new ApiError(`Couldn't delete this product page.`)
            
            
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

async function createOrUpdateDaily (req, res) {
    
    try {
        
        const { productPage } = req.body
        if (!productPage)
            throw new ApiError(`Bad request`)

        const updated = await prisma.productPage.upsert({
            create: {
                ...productPage
            },
            update: {
                ...productPage
            },
            where: {
                productPageId: productPage.productPageId
            }
        })

        if (!updated)
            throw new ApiError(`Couldn't create or update this product page.`)
            
            
        res.status(200).send({ ok: true })

    } catch (error) {
        if (error instanceof ApiError) {
			return res.status(400).send({ ok: false, message: error.message })
		} else {
			console.error(error)
			return res.status(500).send({ ok: false, message: "One or more fields are missing in the form."})
		}
    }

}

export default async function handler(req, res) {

    try {

        const session = await getSession({ req })
        if (!session?.user?.admin)
            return res.status(403).end('Forbidden')

        switch(req.method) {
            case "POST": {
                await createOrUpdateDaily(req, res)
                break
            }
            case "DELETE": {
                await deleteProductPage(req, res)
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