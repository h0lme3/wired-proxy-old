import { getSession } from "next-auth/react"
import { prisma } from "../../../helpers/database"
import { ApiError } from "../../../helpers/errors"

async function updateCartHoldToggle (req, res) {
    
    try {
        
        const { toggle } = req.body
        const updated = await prisma.config.update({
            where: {
                configId: 1
            },
            data: {
                cartHoldActive: toggle
            }
        })

        if (!updated) 
            throw new ApiError(`Couldn't update Porter VIP Trial toggle.`)
        
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
                await updateCartHoldToggle(req, res)
                break
            }

            default: {
                res.setHeader('Allow', 'PATCH')
                res.status(405).end('Method Not Allowed')
            }
        }

    } catch (error) {
        console.error(error)
        res.status(500).end('Internal Server Error')
    }
}