import { getSession } from "next-auth/react"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"
import { CURRENT_SITE } from "../../helpers/sites"
import { isUserVIP } from "../../helpers/vip"

export default async function handler (req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const session = await getSession({ req })
        const guest = !(session?.user?.customerId ?? false)
        const userVip = !guest && (session?.user?.meta === "elite" || await isUserVIP(session?.user?.customerId))

        const { discountCode, productName, quantity } = req.body

        const coupon = await prisma.promotion.findUnique({
            where: {
                discountCode
            }
        })

        if (!coupon || !coupon.active || coupon.use >= coupon.maxUses || coupon.site !== CURRENT_SITE)
            throw new ApiError(`This coupon is not valid`)

        const couponProducts = coupon.appliesTo?.split(',')
        if (!couponProducts?.includes(productName))
            throw new ApiError(`This coupon can't be applied to this product`)

        if (coupon.minimumQuantity && quantity < coupon.minimumQuantity)
            throw new ApiError(`Can't apply this coupon with the chosen quantity.`)

        if (coupon.maximumQuantity && quantity > coupon.maximumQuantity)
            throw new ApiError(`Can't apply this coupon with the chosen quantity. Maximum quantity is: ${coupon.maximumQuantity}`)

        if (coupon.vip && !userVip)
            throw new ApiError(`This coupon can only be used by Porter VIP members.`)

        res.status(200).send({ ok: true, discount: coupon.discount })

    } catch (error) {

        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }

    }
}
