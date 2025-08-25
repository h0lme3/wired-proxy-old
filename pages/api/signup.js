import { getSession } from "next-auth/react"
import { generatePasswordHash, generateSalt } from "../../helpers/auth"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"
import { CURRENT_SITE } from "../../helpers/sites"

export default async function handler (req, res) {

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		res.status(405).end('Method Not Allowed')
		return
	}

	try {

		const { email, password, firstName, lastName, region } = req.body

		const session = await getSession({ req })
		if (session)
			throw new ApiError("Already logged in.")

		// validation
		if (!email || !password || password.length < 8 || !firstName || !lastName || !region)
			throw new ApiError("Bad Request")

		const exists = await prisma.customer.findUnique({
			where: {
				email_site: {
					email: email.toLowerCase(),
					site: CURRENT_SITE
				}
			},
			select: {
				customerId: true,
				password: true,
				activationCode: true,
			}
		})

		if (exists && exists.password)
			throw new ApiError("This email address is already registered")

		if (exists && !exists.password)
			throw new ApiError("Guest account already created with this email, please complete sign-up with the code emailed to you.")

		const passwordHash = generatePasswordHash(password)
		if (!passwordHash)
			throw new ApiError("Internal Server Error")

		const user = await prisma.customer.create({
			data: {
				email: email.toLowerCase(),
				firstName,
				lastName,
				region,
				admin: false,
				password: passwordHash,
				activationCode: generateSalt(16),
				profileImage: "default",
				regDate: new Date,
				site: CURRENT_SITE
			}
		})

		if (!user)
			throw new Error("Internal Server Error")

		const potentialCustomer = await prisma.potentialCustomer.findUnique({
			where: {
				email: user.email
			}
		})

		if (potentialCustomer) {
			await prisma.customer.update({
				where: {
					customerId: user.customerId
				},
				data: {
					note: potentialCustomer.note,
					favourite: potentialCustomer.favourite,
					reportMainEmail: potentialCustomer.reportMainEmail
				}
			})
		}

		res.status(200).send({ ok: true })

	} catch (error) {

		if (error instanceof ApiError) {
			return res.status(400).send({ ok: false, message: error.message })
		} else {
			console.error(error)
			return res.status(500).send({ ok: false, message: "Internal Server Error" })
		}

	}
}
