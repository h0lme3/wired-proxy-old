import { prisma } from "./database"

export async function isUserPreviousVIP (customerId) {
    try {

        const vipActiveOrders = await prisma.order.findMany({
            where: {
                customerId,
                type: "PORTER_VIP",
            },
            select: {
                orderId: true
            }
        })

        if (vipActiveOrders?.length > 0)
            return true


    } catch (error) {
        console.error(error)
    }

    return false
}



export async function isUserVIP (customerId) {
    try {

        const vipActiveOrders = await prisma.order.findMany({
            where: {
                customerId,
                status: "ACTIVE",
                type: "PORTER_VIP",
            },
            select: {
                orderId: true
            }
        })

        if (vipActiveOrders?.length > 0)
            return true


    } catch (error) {
        console.error(error)
    }

    return false
}
