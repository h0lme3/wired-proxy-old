import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

async function updateCouponStatus (req, res) {
    
    try {
        
        const { id, toggle } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const updated = await prisma.promotion.updateMany({
            where: {
                discountCode: {
                    in: id
                }
            },
            data: {
                active: toggle
            }
        })

        if (!updated) {
            throw new ApiError(`Couldn't update coupon(s).`)
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

async function deleteCoupon (req, res) {
    
    try {
        
        const { id } = req.body
        if (!id || !id.length)
            throw new ApiError(`Bad request`)

        const deleted = await prisma.promotion.deleteMany({
            where: {
                discountCode: {
                    in: id
                }
            }
        })

        if (!deleted) {
            throw new ApiError(`Couldn't delete coupon(s).`)
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

async function createOrUpdateCoupon (req, res) {
    
    try {
        
        const { coupon } = req.body
        if (!coupon)
            throw new ApiError(`Bad request`)

        const updated = await prisma.promotion.upsert({
            create: {
                ...coupon
            },
            update: {
                ...coupon
            },
            where: {
                discountCode: coupon.discountCode
            }
        })

        if (!updated)
            throw new ApiError(`Couldn't create or update this coupon.`)
            
            
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
                await updateCouponStatus(req, res)
                break
            }
            case "POST": {
                await createOrUpdateCoupon(req, res)
                break
            }
            case "DELETE": {
                await deleteCoupon(req, res)
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