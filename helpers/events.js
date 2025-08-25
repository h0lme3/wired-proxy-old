import { prisma } from "./database"
import { createHash } from "crypto"
import { eventTypes } from "./sendEvent"

export async function createEvent (type, customerId, meta) {

    try {
        
        const data = [...meta]

        if (!eventTypes.includes(type) || data?.length > 5)
            throw new Error(`Unknown Event`)
        
        const metaExtra = data.pop()
        const meta5 = createHash("sha1").update(Buffer.from([type, customerId, data].join("|"))).digest("base64")
        
        const fields = {}
        for (let i = 0; i < data.length; i++) {
            const field = `meta${i + 1}`
            fields[field] = `${data[i]}`
        }

        const exists = await prisma.event.count({
            where: {
                meta5
            }
        })

        if (exists) 
            return false

        const event = await prisma.event.create({
            data: {
                type,
                label: type,
                customerId,
                ...fields,
                meta5,
                metaExtra,
                datetime: new Date()
            }
        })

        return event

    } catch (error) {
        console.error(error)
    }

    return false

}

