import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

async function updateProductStatus (req, res) {
    
    try {
        
        const { id, toggle } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const updated = await prisma.product.updateMany({
            where: {
                productName: {
                    in: id
                }
            },
            data: {
                productActive: toggle
            }
        })

        if (!updated) {
            throw new ApiError(`Couldn't update product(s).`)
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

async function deleteProduct (req, res) {
    
    try {
        
        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.product.deleteMany({
            where: {
                productName: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete product(s).`)
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

async function createOrUpdateProduct (req, res) {
    
    try {
        
        const { product } = req.body
        if (!product)
            throw new ApiError(`Bad request`)

        const updated = await prisma.product.upsert({
            create: {
                ...product
            },
            update: {
                ...product
            },
            where: {
                productName: product.productName
            }
        })

        if (!updated)
            throw new ApiError(`Couldn't update or create this product.`)
            
            
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
            case "PATCH": {
                await updateProductStatus(req, res)
                break
            }
            case "DELETE": {
                await deleteProduct(req, res)
                break
            }
            case "POST": {
                await createOrUpdateProduct(req, res)
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