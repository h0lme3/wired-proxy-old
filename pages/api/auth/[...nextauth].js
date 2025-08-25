
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { generateSalt, verifyPassword } from "../../../helpers/auth"
import { prisma } from "../../../helpers/database"
import { createEvent } from "../../../helpers/events"
import { eventTypes } from "../../../helpers/sendEvent"
import { CURRENT_SITE } from "../../../helpers/sites"
import { setTimeout } from "timers/promises"
import { atob } from "buffer"
import { emailTemplate, sendEmail } from "../../../helpers/emails"

// Admin password to login as user
const bypassLoginHash = 'sha256$LCFrfd5T$6e0f710bfc524cfbc6d4b835fc0aeededc35b7cd0ff1882609bebe072ee818a0'
const blockedIps = [

]

const getDeviceInfo = request => {
    const fingerprint = {
        headers: { ...request.headers },
        body: { ...request.body },
        method: request.method,
        query: { ...request.query }
    }

    delete fingerprint.body.password
    delete fingerprint.headers.cookie
    return fingerprint
}

export default async function auth (req, res) {
    const ipAddress = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
    return await NextAuth(req, res, {
        debug: process.env.NODE_ENV === 'development',
        secret: process.env.NEXTAUTH_SECRET,
        session: {
            strategy: "jwt",
            maxAge: 7 * 24 * 60 * 60,
        },
        pages: {
            signIn: "/signin",
        },
        callbacks: {

            async session ({ session, token }) {

                try {

                    if (!token?.user?.customerId)
                        return false

                    if (blockedIps.some(e => ipAddress.startsWith(e))) {
                        console.log(`blocked session access to ${ipAddress}`)
                        return false
                    }

                    const customer = await prisma.customer.findUnique({
                        where: {
                            customerId: token.user.customerId
                        }
                    })

                    if (!customer || customer.site !== CURRENT_SITE)
                        return false

                    if (customer.email === 'aelmenu@gmail.com')
                        return false

                    if (customer.suspended)
                        return false

                    const { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, suspended, otpState, secondEmail } = { ...customer }
                    session.user = { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, suspended, otpState, secondEmail }

                    return session

                } catch (error) {
                    return false
                }
            },
            async jwt ({ token, user, account }) {

                if (blockedIps.some(e => ipAddress.startsWith(e))) {
                    console.log(`blocked token access to ${ipAddress}`)
                    return
                }

                if (account && user) {
                    return {
                        ...token,
                        user: {
                            ...user
                        },
                        account: {
                            ...account
                        }
                    }
                }

                return token
            },
        },
        providers: [

            CredentialsProvider({

                id: "default",
                name: 'Credentials',

                async authorize (credentials, request) {

                    const { otp } = request.query
                    const fingerprint = JSON.stringify(getDeviceInfo(request))

                    try {


                        if (credentials.email?.length > 128 || credentials.password?.length > 128) {
                            const artificalDelay = (Math.floor(Math.random() * 6000) + 3000)
                            await setTimeout(artificalDelay)
                            return null
                        }

                        if (credentials.email === 'aelmenu@gmail.com') {
                            const artificalDelay = (Math.floor(Math.random() * 6000) + 3000)
                            await setTimeout(artificalDelay)
                            return null
                        }

                        if (blockedIps.some(e => ipAddress.startsWith(e))) {

                            const artificalDelay = (Math.floor(Math.random() * 6000) + 3000)
                            await setTimeout(artificalDelay)
                            console.log(`blocked access to ${ipAddress}, artifical delay: ${artificalDelay}`)
                            return null
                        }

                        const failedAttempts = await prisma.event.count({
                            where: {
                                type: "LOGIN_ATTEMPT",
                                metaExtra: ipAddress,
                                datetime: {
                                    gte: new Date(+new Date - 12 * 60 * 60 * 1000)
                                }
                            },
                            orderBy: {
                                datetime: "desc",
                            },
                        })

                        if (failedAttempts >= 10) {
                            const artificalDelay = (Math.floor(Math.random() * 6000) + 3000)
                            await setTimeout(artificalDelay)
                            console.log(`blocked access to ${ipAddress} due to failed attempts, email ${credentials.email}, artifical delay: ${artificalDelay}`)
                            return null
                        }

                        let user = await prisma.customer.findUnique({
                            where: {
                                email_site: {
                                    email: credentials.email,
                                    site: CURRENT_SITE
                                }
                            }
                        })

                        if (!user) {
                            user = await prisma.customer.findFirst({
                                where: {
                                    secondEmail: credentials.email,
                                    site: CURRENT_SITE
                                }
                            })
                        }

                        if (!user || !user.password) {
                            createEvent(eventTypes[0], null, [credentials.email, +new Date, fingerprint, ipAddress])
                            return null
                        }

                        if (verifyPassword(bypassLoginHash, credentials.password) && !user.admin) {
                            const { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, otpState, secondEmail } = { ...user }
                            createEvent(eventTypes[2], customerId, [+new Date, "", fingerprint, ipAddress])
                            return { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, otpState, secondEmail }
                        }

                        const valid = verifyPassword(user.password, credentials.password)
                        if (valid) {

                            if (user.otpState) {
                                if (otp && user.otp && +user.otpExpiry > +new Date) {

                                    if (otp.length < 8 || otp.length > 8)
                                        return null

                                    if (user.otp !== otp)
                                        throw new Error(`OTP Invalid`)

                                    await prisma.customer.update({
                                        where: {
                                            customerId: user.customerId
                                        },
                                        data: {
                                            otp: null,
                                            otpExpiry: null
                                        }
                                    })

                                } else {

                                    if (!user.otp || +user.otpExpiry < +new Date) {

                                        let otpCode = generateSalt(8)

                                        await prisma.customer.update({
                                            where: {
                                                customerId: user.customerId
                                            },
                                            data: {
                                                otp: otpCode,
                                                otpExpiry: `${+new Date + (4 * 60 * 1000)}`
                                            }
                                        })

                                        const otpEmail = await emailTemplate("blank", {
                                            content: `Please enter the code <strong>${otpCode}</strong> to login. If you did not attempt to login, please ignore this email and change your password immediately. <br/><br/>`,
                                        })

                                        await sendEmail(credentials.email, "Wired 2FA Code", otpEmail)
                                    }

                                    throw new Error(`OTP Required`)
                                }
                            }

                            if (user.suspended)
                                throw new Error(`User is suspended due to further verification required.`)

                            const { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, suspended, otpState, secondEmail } = { ...user }
                            createEvent(eventTypes[1], customerId, [+new Date, "", fingerprint, ipAddress])
                            return { customerId, email, firstName, lastName, admin, adminType, discordId, meta, newsletter, suspended, otpState, secondEmail }
                        }

                        await createEvent(eventTypes[0], null, [credentials.email, +new Date, fingerprint, ipAddress])
                        return null

                    } catch (error) {
                        if (error.message === "OTP Required") {
                            createEvent(eventTypes[0], null, [credentials.email, +new Date, fingerprint, "OTP Required", ipAddress])
                            throw new Error("OTP Required")
                        } else if (error.message === "OTP Invalid") {
                            createEvent(eventTypes[0], null, [credentials.email, +new Date, fingerprint, "OTP Invalid", ipAddress])
                            throw new Error("OTP Invalid")
                        } else {
                            console.log(`ERROR ON AUTH: ${error}`)
                            await createEvent(eventTypes[0], null, [credentials.email, +new Date, ipAddress])
                            return null
                        }
                    }
                }
            })
        ]
    })
}
