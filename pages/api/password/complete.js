import { generatePasswordHash, generateSalt } from "../../../helpers/auth"
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

        const { email, password, repeatPassword, activationCode } = req.body
        if (!email || !email.includes('@'))
            throw new ApiError("Invalid email address")

        if (!password || password !== repeatPassword || password.length < 8)
            throw new ApiError("Invalid or unmatching passwords")


        const customer = await prisma.customer.findUnique({
            where: {
                email_site: {
                    email,
                    site: CURRENT_SITE
                }
            }
        })

        if (!customer || customer.site !== CURRENT_SITE)
            throw new ApiError("Invalid email address")

        if (customer.password)
            throw new ApiError("This is not a guest account, please log in or reset password instead.")

        if (customer.activationCode !== activationCode)
            throw new ApiError("This complete sign-up link is no longer valid")

        const passwordHash = generatePasswordHash(password)
        if (!passwordHash)
            throw new ApiError("Internal Server Error")


        await prisma.customer.update({
            where: {
                customerId: customer.customerId
            },
            data: {
                activationCode: generateSalt(16),
                password: passwordHash
            }
        })


        const changedTemplate = await emailTemplate("password_changed", {
            customer: customer.firstName + ' ' + customer.lastName,
        })

        const result = await sendEmail(customer.email, "Wired Password Changed", changedTemplate)
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