import { generateSalt } from "../../../helpers/auth"
import { prisma } from "../../../helpers/database"
import { emailTemplate, sendEmail } from "../../../helpers/emails"
import { ApiError } from "../../../helpers/errors"
import { CURRENT_SITE } from "../../../helpers/sites"

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const { email } = req.body
        if (!email || !email.includes('@'))
            throw new ApiError("Invalid email address")

        const customer = await prisma.customer.findUnique({
            where: {
                email_site: {
                    email,
                    site: CURRENT_SITE
                }
            }
        })

        if (!customer)
            throw new ApiError("Invalid email address")

        if (!customer.password)
            throw new ApiError("This is a guest account, please complete sign-up first!")


        const activationCode = generateSalt(16)
        await prisma.customer.update({ 
            where: {
                customerId: customer.customerId
            },
            data: { 
                activationCode
            }
        })


        const resetTemplate = await emailTemplate("password_change_request", {
            customer: customer.firstName + ' ' + customer.lastName,
            change_password_link: process.env.NEXT_PUBLIC_DOMAIN + `password/reset?activationCode=${activationCode}&email=${customer.email}`,
        })

        const result = await sendEmail(customer.email, "Wired Password Reset", resetTemplate)

        res.status(200).send({ ok: true })
        
    } catch (error) {

        if (error instanceof ApiError) {
            return res.status(400).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(500).send({ ok: false, message: "Couldn't process your request at this time." })
        }

    }

    return true

}