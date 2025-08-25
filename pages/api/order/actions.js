import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"
import crypto from "crypto"

dayjs.extend(utc)

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

        const { orderId, username, password } = req.body
        const order = await prisma.order.findFirst({
            where: {
                orderId,
                customerId,
                status: "ACTIVE"
            },
            select: {
                product: true,
                orderId: true,
                secondUser: true
            }
        })

        if (order?.product?.productAccount || order?.product?.productResi || order?.product?.productServer)
            throw new ApiError(`Bad Request`)

        if (!username || username?.length < 8)
            throw new ApiError(`Username has to be at least 8 characters long.`)

        if (!password || password?.length < 8)
            throw new ApiError(`Password has to be at least 8 characters long.`)

        switch (!!order?.secondUser) {
            case false: {

                const response = await fetch('http://127.0.0.1:4142/create_2nd_user', {
                    method: "POST",
                    headers: {
                        apikey: "VK7v7RgU6rYPNBMwAd8zprdxaHE3jKPIx1epbhsxdyjXGHgaLHx2pkxz58qxzG9a"
                    },
                    body: JSON.stringify({
                        orderid: order.orderId,
                        username,
                        password
                    })
                })

                const data = await response.json()
                if (data?.message && res.status != 200)
                    return res.status(200).send({ ok: false, message: data.message })

                break
            }
            case true: {

                const response = await fetch('http://127.0.0.1:4142/delete_2nd_user', {
                    method: "POST",
                    headers: {
                        apikey: "VK7v7RgU6rYPNBMwAd8zprdxaHE3jKPIx1epbhsxdyjXGHgaLHx2pkxz58qxzG9a"
                    },
                    body: JSON.stringify({
                        orderid: order.orderId,
                    })
                })


                const data = await response.json()
                if (data?.message && res.status != 200)
                    return res.status(200).send({ ok: false, message: data.message })

                break
            }
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
