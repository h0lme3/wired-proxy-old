import Stripe from "stripe"

import { generateSalt } from "../../helpers/auth"
import { prisma } from "../../helpers/database"
import { ApiError } from "../../helpers/errors"
import { buffer } from "micro"
import { emailTemplate, sendEmail } from "../../helpers/emails"
import { MessageEmbed, WebhookClient } from "discord.js"
import { CURRENT_SITE } from "../../helpers/sites"

const stripe = Stripe(process.env.STRIPE_SECRET)

export const config = {
    api: {
        bodyParser: false,
    },
}

export async function createCustomer ({ name, email, stripeId, region }) {

    try {

        const existing = await prisma.customer.findUnique({
            where: {
                email_site: {
                    email,
                    site: CURRENT_SITE
                }
            }
        })

        if (existing)
            return existing

        const [firstName, lastName] = name?.split(' ') ?? ['', '']
        const user = await prisma.customer.create({
            data: {
                email,
                firstName,
                lastName,
                stripeId,
                region,
                profileImage: "default",
                activationCode: generateSalt(16),
                admin: false,
                site: CURRENT_SITE
            }
        })


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


        const completeSignupTemplate = await emailTemplate("order_complete_sign_up", {
            customer: user.firstName + ' ' + user.lastName,
            basic_signup_link: process.env.NEXT_PUBLIC_DOMAIN + `password/complete?activationCode=${user.activationCode}&email=${encodeURIComponent(user.email)}`,
        })

        await sendEmail(user.email, "Wired Complete Sign-Up", completeSignupTemplate)
        return user

    } catch (error) {
        throw error
    }

}

export async function getNextRenewalId (fullOrderId) {

    try {

        let [orderId] = fullOrderId.split('-')
        const searchOrderId = `${orderId}-0%`
        const [order] = await prisma.$queryRaw`SELECT order_id FROM \`order\` WHERE order_id LIKE ${searchOrderId} ORDER BY order_time DESC, order_id DESC LIMIT 1;`
        if (!order)
            throw new Error(`Couldn't find any orders with ID ${orderId} (${fullOrderId})`)

        let [, , renewalCount] = order.order_id.split('-')
        renewalCount = renewalCount ? Number(renewalCount.replace("R", "")) + 1 : 1

        const nextOrderId = `${orderId}-0-R${renewalCount}`
        return { nextOrderId, lastOrderId: order.order_id }

    } catch (error) {
        throw error
    }
}

export async function getNextOrderId () {

    try {

        const [order] = await prisma.$queryRaw`SELECT order_id FROM \`order\` WHERE order_id LIKE "P%-0" ORDER BY CHAR_LENGTH(order_id) DESC, order_id DESC, order_time DESC LIMIT 1;`
        if (!order)
            throw new Error(`Couldn't get last order ID from the database`)

        const [previousId] = order.order_id ? order.order_id.replace('P', '')?.split('-') : [1000]
        if (isNaN(previousId))
            throw new Error(`Retrieved last order ID ${previousId} which is not a number so it can't be autoincremented`)

        const nextOrderId = `P${Number(previousId) + 1}-0`
        return nextOrderId

    } catch (error) {
        throw error
    }
}

export async function sendCancelNotification ({ title, orderId, fee, email, customerId, productName }) {

    try {

        const outageWebhook = 'https://discordapp.com/api/webhooks/834598998459023390/ihyYRFz-of3R8St5erKkXskk7LYQzxMk00gxJ12BIm_no1fKuFtbcRq8LQDO2UroKd1F'

        const embed = new MessageEmbed()
            .setTitle(title)
            .setColor(0xffffff)
            .addField("Order #", `${orderId}`)
            .addField("Amount", `${fee}`)
            .addField("Customer", `${email} (ID: ${customerId})`)
            .addField("Product", `${productName}`)
            .setFooter({ text: `Porter Proxies`, iconURL: process.env.NEXT_PUBLIC_DOMAIN + 'website/images/Porter_Transparent-07.png' })
            .setTimestamp()

        const webhook = new WebhookClient({ url: outageWebhook })
        const result = await webhook.send({ embeds: [embed] })

        return true

    } catch (error) {
        console.error(error)
    }

    return false
}


export async function sendSuccessNotification ({ fee, email, customerId, orderId, productName, coupon, note }) {
    try {

        const { successWebhook } = await prisma.config.findUnique({
            where: {
                configId: 1
            },
            select: {
                successWebhook: true
            }
        })

        const embed = new MessageEmbed()
            .setTitle(`Payment Succeeded ✅ `)
            .setColor(0xffffff)
            .addField("Order #", `${orderId}`)
            .addField("Amount", `${fee}`)
            .addField("Customer", `${email} (ID: ${customerId})`)
            .addField("Product", `${productName}`)
            .addField("Coupon", `${coupon}`)
            .setFooter({ text: `Porter Proxies`, iconURL: process.env.NEXT_PUBLIC_DOMAIN + 'website/images/Porter_Transparent-07.png' })
            .setTimestamp()
        if (note && !isNaN(note)) {
            const webhook = await prisma.webhook.findUnique({
                where: {
                    webhookId: Number(note)
                }
            })

            if (webhook)
                embed.addField('Webhook', `${webhook.name}`)

        }

        const webhook = new WebhookClient({ url: successWebhook })
        const result = await webhook.send({ embeds: [embed] })

        return true

    } catch (error) {
        console.error(error)
    }

    return false
}

async function getTrialDays () {
    try {

        const { porterVipTrialDays: trialDays } = await prisma.config.findUnique({
            where: {
                configId: 1
            },
            select: {
                porterVipTrialDays: true,
            }
        })

        return trialDays

    } catch (error) {
        throw error
    }
}

async function setupSubscription (data) {

    try {

        const subscription = await stripe.subscriptions.retrieve(data.subscription)
        const { orderId, source, porterVipTrial } = subscription.metadata
        if ((!orderId && !porterVipTrial) || source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Subscription doesn't have appropriate metadata`)

        if (porterVipTrial)
            return fulfillSubscription({}, subscription.latest_invoice)

        await prisma.order.updateMany({
            where: {
                orderId: orderId,
            },
            data: {
                ecomOrderId: subscription.id
            }
        })

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }

}

async function cancelSubscription (data) {

    try {

        const { orderId, source } = data.metadata

        if (source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Subscription doesn't have appropriate metadata`)
        
        if (orderId) {

            const order = await prisma.order.findFirst({
                where: {
                    orderId: {
                        startsWith: orderId
                    }
                },
                orderBy: {
                    expiry: "desc"
                },
                include: {
                    customer: {
                        select: {
                            email: true
                        }
                    }
                }
            })

            if (order?.expiry && +order?.expiry < (+new Date - (4 * 60 * 60 * 1000)) && order.status === "ACTIVE") {
                await prisma.order.update({
                    where: {
                        orderId: order.orderId,
                    },
                    data: {
                        status: "AWAITING_EXPIRY"
                    }
                })
            }

            /*
            console.log(`Subscription cancelled: ${orderId} - TOTAL: ${parseFloat(order.total)}`)

            if (parseFloat(order.total) >= 250) {

                console.log(`Subscription cancelled: ${orderId} - TOTAL: ${parseFloat(order.total)} - sent notification`)

                if (order?.expiry && +order?.expiry < (+new Date - (5 * 60 * 60 * 1000)) && order.status === "ACTIVE") {
                    sendCancelNotification({
                        title: "Subscription Cancelled By User",
                        customerId: order.customerId,
                        email: order.customer.email,
                        fee: order.total,
                        orderId: order.order,
                        productName: order.productName
                    })
                } else {
                    sendCancelNotification({
                        title: "Subscription Cancelled Due To Failed Payment",
                        customerId: order.customerId,
                        email: order.customer.email,
                        fee: order.total,
                        orderId: order.order,
                        productName: order.productName
                    })
                }
            }
            */

        }

        await prisma.order.updateMany({
            where: {
                ecomOrderId: data.id
            },
            data: {
                ecomOrderId: null
            }
        })

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }

}

async function fulfillSubscription (data, invoiceId = false) {

    try {

        const invoice = await stripe.invoices.retrieve(invoiceId || data.invoice, { expand: ['subscription', 'customer', 'charge', "payment_intent"] })
        const customerLocation = (
            invoice?.charge?.billing_details?.address?.country ||
            invoice?.customer?.address?.country ||
            ""
        )

        const { subscription } = invoice
        if (!subscription)
            throw new ApiError(`Skipped event due to subscription being null`)

        const { orderId, source } = subscription.metadata
        if (source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Skipped event due to source mismatch.`)

        const idempotent = await prisma.order.count({
            where: {
                paymentId: invoiceId || invoice.charge.id
            }
        })

        if (idempotent)
            throw new ApiError(`Skipped request due to idempotency check`)

        let user

        const customerId = subscription.metadata?.customerId ?? false
        if (!customerId) {
            user = await createCustomer({
                name: invoice.account_name,
                email: invoice.customer_email,
                stripeId: invoice.customer.id,
                region: customerLocation
            })
        } else {
            user = await prisma.customer.findUnique({
                where: {
                    customerId: Number(customerId)
                }
            })
        }

        if (!user)
            throw new ApiError(`Couldn't find the user ${customerId}`)

        if (!user.stripeId) {
            await prisma.customer.update({
                data: {
                    stripeId: invoice?.customer?.id
                },
                where: {
                    customerId: user.customerId
                }
            })
        }

        const productName = subscription.metadata.productName
        const product = productName && await prisma.product.findUnique({
            where: {
                productName
            },
            include: {
                productOrders: false,
                productPages: false
            }
        })

        /* @TODO TEMP FIX
        if (!product || (!orderId && (!product.productActive || product.productStock < subscription.metadata.quantity))) 
            throw new ApiError(`Product ${productName} doesn't exist or is no longer in stock`)
        */

        if (subscription.metadata.coupon && !orderId) {
            await prisma.promotion.update({
                where: {
                    discountCode: subscription.metadata.coupon
                },
                data: {
                    use: {
                        increment: 1
                    }
                }
            })
        }

        let dispatchTime = undefined
        if (subscription.metadata.productPage && !orderId) {
            const productPage = await prisma.productPage.findUnique({
                where: {
                    productPageId: subscription.metadata.productPage
                },
                select: {
                    productPageDispatch: true
                }
            })

            if (!productPage || !productPage.productPageDispatch)
                throw new ApiError(`Couldn't find productPageDispatch for a product page order`)

            dispatchTime = new Date(+productPage.productPageDispatch - (4 * 60 * 60 * 1000))
        }

        if (!dispatchTime && subscription?.metadata?.dispatchTime)
            dispatchTime = new Date(new Date(subscription?.metadata?.dispatchTime) - (4 * 60 * 60 * 1000))

        const ref = subscription.metadata.ref ?? null

        if (orderId) {

            const orderTime = new Date(+new Date() - (4 * 60 * 60 * 1000))

            const { nextOrderId, lastOrderId } = await getNextRenewalId(orderId)
            const newOrder = await prisma.order.create({
                data: {
                    customerId: user.customerId,
                    orderId: nextOrderId,
                    couponName: subscription.metadata.coupon,
                    orderTime: orderTime,
                    length: subscription.metadata.period + "D",
                    quantity: product?.productResi ? (subscription.metadata.quantity + ' GB') : `${subscription.metadata.quantity}`,
                    status: "AWAITING_PROCESSING",
                    paymentStatus: "PAID",
                    location: customerLocation,
                    productName: product?.productName ?? productName,
                    total: `${(invoice.amount_paid / 100)}`,
                    paymentId: invoiceId || invoice.charge.id,
                    type: product?.productPool ?? "",
                    ecomOrderId: subscription.id,
                    lastChain: lastOrderId,
                    note: (ref && ref.toString()) || null
                }
            })

            await prisma.order.update({
                where: {
                    orderId: lastOrderId
                },
                data: {
                    nextChain: nextOrderId
                }
            })

            await stripe.subscriptions.update(subscription.id, {
                metadata: {
                    ...subscription.metadata,
                    orderId: newOrder.orderId,
                    guest: undefined,
                    customerId: newOrder.customerId
                }
            })

            await sendSuccessNotification({
                fee: newOrder.total,
                customerId: newOrder.customerId,
                email: user?.email ?? " - ",
                orderId: newOrder.orderId,
                productName: newOrder.productName,
                coupon: newOrder.couponName || " - ",
                note: newOrder.note || " - "
            })

        } else {

            const trialPeriod = subscription.metadata.porterVipTrial && await getTrialDays()

            const orderTime = new Date(+new Date() - (4 * 60 * 60 * 1000))
            const nextOrderId = await getNextOrderId()

            const newOrder = await prisma.order.create({
                data: {
                    customerId: user.customerId,
                    orderId: nextOrderId,
                    couponName: subscription.metadata.coupon ? subscription.metadata.coupon?.toUpperCase() : subscription.metadata.coupon,
                    orderTime: orderTime,
                    length: (trialPeriod || subscription.metadata.period) + "D",
                    quantity: product?.productResi ? (subscription.metadata.quantity + ' GB') : `${subscription.metadata.quantity}`,
                    status: invoice?.payment_intent?.review ? "REVIEW" : product?.productPreorder ? "PREORDER" : "AWAITING_PROCESSING",
                    paymentStatus: "PAID",
                    location: customerLocation,
                    productName: product?.productName ?? productName,
                    total: `${(invoice.amount_paid / 100)}`,
                    paymentId: invoiceId || invoice.charge.id,
                    type: product?.productPool ?? "",
                    ecomOrderId: subscription.id,
                    dispatchTime,
                    note: (ref && ref.toString()) || null
                }
            })

            const { cartHoldActive } = await prisma.config.findUnique({
                where: {
                    configId: 1
                },
                select: {
                    cartHoldActive: true
                }
            })

            if (!cartHoldActive) {
                await prisma.product.update({
                    where: {
                        productName: product?.productName ?? productName,
                    },
                    data: {
                        productStock: {
                            decrement: Number(subscription.metadata.quantity)
                        }
                    }
                })
            }

            await stripe.subscriptions.update(subscription.id, {
                metadata: {
                    ...subscription.metadata,
                    orderId: newOrder.orderId,
                    guest: undefined,
                    customerId: newOrder.customerId,
                    porterVipTrial: undefined,
                }
            })

            await sendSuccessNotification({
                fee: newOrder.total,
                customerId: newOrder.customerId,
                email: user?.email ?? " - ",
                orderId: newOrder.orderId,
                productName: newOrder.productName,
                coupon: newOrder.couponName || " - ",
                note: newOrder.note || " - "

            })

        }

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }

    return
}

async function fulfillOrder (data) {

    try {

        const intent = await stripe.paymentIntents.retrieve(data.payment_intent, { expand: ['customer', 'latest_charge', 'review'] })
        if (!intent)
            throw new ApiError(`Skipped event due to intent being null`)

        const { orderId, source } = intent?.metadata

        if (!source || source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Skipped event due to source mismatch.`)


        const charge = intent?.latest_charge
        const customerLocation = (
            charge?.billing_details?.address?.country ||
            intent?.customer?.address?.country ||
            ""
        )

        const idempotent = await prisma.order.count({
            where: {
                paymentId: charge.id
            }
        })

        if (idempotent)
            throw new ApiError(`Skipped request due to idempotency check`)


        let user

        const customerId = intent?.metadata?.customerId ?? false
        if (!customerId) {
            user = await createCustomer({
                name: data.customer_details.name,
                email: data.customer_details.email,
                stripeId: data.customer.id,
                region: customerLocation
            })
        } else {
            user = await prisma.customer.findUnique({
                where: {
                    customerId: Number(customerId)
                }
            })
        }

        if (!user)
            throw new ApiError(`Couldn't find the user ${customerId}`)

        if (!user.stripeId) {
            await prisma.customer.update({
                data: {
                    stripeId: data?.customer?.id
                },
                where: {
                    customerId: user.customerId
                }
            })
        }

        const productName = intent?.metadata?.productName ?? false
        const product = productName && await prisma.product.findUnique({
            where: {
                productName
            },
            include: {
                productOrders: false,
                productPages: false
            }
        })

        /* TODO temp fix
        if (!product || (!orderId && (!product.productActive || product.productStock < intent.metadata.quantity))) 
            throw new ApiError(`Product ${productName} doesn't exist or is no longer in stock`)
        */
        if (intent.metadata.coupon) {
            await prisma.promotion.update({
                where: {
                    discountCode: intent.metadata.coupon
                },
                data: {
                    use: {
                        increment: 1
                    }
                }
            })
        }

        let dispatchTime = undefined
        if (intent?.metadata?.productPage) {
            const productPage = await prisma.productPage.findUnique({
                where: {
                    productPageId: intent.metadata.productPage
                },
                select: {
                    productPageDispatch: true
                }
            })

            if (!productPage || !productPage.productPageDispatch)
                throw new ApiError(`Couldn't find productPageDispatch for a product page order`)

            dispatchTime = new Date(+productPage.productPageDispatch - (4 * 60 * 60 * 1000))
        }

        if (!dispatchTime && intent?.metadata?.dispatchTime)
            dispatchTime = new Date(new Date(intent?.metadata?.dispatchTime) - (4 * 60 * 60 * 1000))

        const ref = intent.metadata.ref ?? null

        if (orderId) {

            const orderTime = new Date(+new Date() - (4 * 60 * 60 * 1000))

            const { nextOrderId, lastOrderId } = await getNextRenewalId(orderId)
            const newOrder = await prisma.order.create({
                data: {
                    customerId: user.customerId,
                    orderId: nextOrderId,
                    couponName: intent.metadata.coupon ? intent.metadata.coupon?.toUpperCase() : intent.metadata.coupon,
                    orderTime: orderTime,
                    length: intent.metadata.period + "D",
                    quantity: product?.productResi ? (intent.metadata.quantity + ' GB') : `${intent.metadata.quantity}`,
                    status: product?.productResi && intent.review ? "REVIEW" : "AWAITING_PROCESSING",
                    paymentStatus: "PAID",
                    location: customerLocation,
                    productName: product?.productName ?? productName,
                    total: `${(intent.amount / 100)}`,
                    paymentId: charge.id,
                    type: product?.productPool ?? "",
                    lastChain: lastOrderId,
                    note: (ref && ref.toString()) || null
                }
            })

            await prisma.order.update({
                where: {
                    orderId: lastOrderId
                },
                data: {
                    nextChain: nextOrderId
                }
            })

            await sendSuccessNotification({
                fee: newOrder.total,
                customerId: newOrder.customerId,
                email: user?.email ?? " - ",
                orderId: newOrder.orderId,
                productName: newOrder.productName,
                coupon: newOrder.couponName || " - ",
                note: newOrder.note || " - "

            })

        } else {

            const orderTime = new Date(+new Date() - (4 * 60 * 60 * 1000))

            const nextOrderId = await getNextOrderId()
            const newOrder = await prisma.order.create({
                data: {
                    customerId: user.customerId,
                    orderId: nextOrderId,
                    couponName: intent.metadata.coupon,
                    orderTime: orderTime,
                    length: intent.metadata.period + "D",
                    quantity: product?.productResi ? (intent.metadata.quantity + ' GB') : `${intent.metadata.quantity}`,
                    status: intent.review ? "REVIEW" : product?.productPreorder ? "PREORDER" : "AWAITING_PROCESSING",
                    paymentStatus: "PAID",
                    location: customerLocation,
                    productName: product?.productName ?? productName,
                    total: `${(intent.amount / 100)}`,
                    paymentId: charge.id,
                    type: product?.productPool ?? "",
                    dispatchTime,
                    note: (ref && ref.toString()) || null
                }
            })

            const { cartHoldActive } = await prisma.config.findUnique({
                where: {
                    configId: 1
                },
                select: {
                    cartHoldActive: true
                }
            })

            if (!cartHoldActive) {
                await prisma.product.update({
                    where: {
                        productName: product?.productName ?? productName,
                    },
                    data: {
                        productStock: {
                            decrement: Number(intent.metadata.quantity)
                        }
                    }
                })
            }

            await sendSuccessNotification({
                fee: newOrder.total,
                customerId: newOrder.customerId,
                email: user?.email ?? " - ",
                orderId: newOrder.orderId,
                productName: newOrder.productName,
                coupon: newOrder.couponName || " - ",
                note: newOrder.note || " - "

            })

        }

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }

    return
}

async function releaseStock (session) {

    try {

        const { orderId, source, productName, quantity } = session?.metadata

        if (!source || source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Skipped releasing stock due to source mismatch.`)

        if (orderId)
            throw new ApiError(`Skipped releasing stock for an already existing order`)

        if (!productName || !quantity)
            throw new ApiError(`Invalid product name or quantity: ${productName} - ${quantity}`)

        const { cartHoldActive } = await prisma.config.findUnique({
            where: {
                configId: 1
            },
            select: {
                cartHoldActive: true
            }
        })

        if (!cartHoldActive)
            throw new ApiError(`Skipped because cart hold status is inactive`)

        await prisma.product.update({
            where: {
                productName,
            },
            data: {
                productStock: {
                    increment: Number(quantity)
                }
            }
        })


    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }
}

async function voidInvoice (invoice) {

    try {

        if (!invoice.subscription)
            throw new ApiError(`This invoice is not attached to a subscription`)

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        if (!subscription)
            throw new ApiError(`Couldn't retrieve subscription related to this invoice`)

        const { source } = subscription.metadata
        if (!source || source !== 'NEXT_WIRED_DASHBOARD')
            throw new ApiError(`Skipped voiding invoice since it is not generated by Dashboard`)

        await stripe.invoices.voidInvoice(invoice.id)

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }
}

async function handleReview (review) {

    try {

        if (!review.payment_intent)
            throw new ApiError(`This review does not have an intent attached`)

        const intent = await stripe.paymentIntents.retrieve(review.payment_intent)
        if (!intent || !intent.latest_charge)
            throw new ApiError(`Couldn't retrieve intent or charge related to this review`)

        const order = await prisma.order.findFirst({
            where: {
                paymentId: intent.latest_charge
            }
        })

        if (!order)
            throw new ApiError(`Skipped review result since order is not found by charge ID`)

        if (order.status !== "REVIEW")
            throw new ApiError(`Skipped review result since order is no longer in review status`)

        await prisma.order.update({
            where: {
                orderId: order.orderId
            },
            data: {
                status: review.reason === "approved" ? "AWAITING_PROCESSING" : "EXPIRED"
            }
        })

    } catch (error) {
        if (!(error instanceof ApiError))
            console.error(error)

        throw error
    }
}

export default async function handler (req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method Not Allowed')
        return
    }

    try {

        const buf = await buffer(req)
        const sig = req.headers["stripe-signature"]
        const sec = process.env.STRIPE_WEBHOOK_SECRET

        const event = stripe.webhooks.constructEvent(buf, sig, sec)
        switch (event.type) {

            case 'checkout.session.completed': {

                if (event.data.object.mode === 'subscription') {
                    await setupSubscription(event.data.object)
                } else {
                    await fulfillOrder(event.data.object)
                }

                break
            }

            case 'checkout.session.expired': {

                await releaseStock(event.data.object)
                break
            }


            case 'payment_intent.succeeded': {

                if (event.data.object.invoice) {
                    await fulfillSubscription(event.data.object)
                } else {
                    return res.status(200).send({ skipped: true })
                }

                break
            }

            case 'customer.subscription.deleted': {
                await cancelSubscription(event.data.object)
                break
            }

            case 'invoice.marked_uncollectible': {
                await voidInvoice(event.data.object)
                break
            }

            case 'review.closed': {
                await handleReview(event.data.object)
                break
            }

        }

        res.status(200).send({ ok: true })

    } catch (error) {

        if (error instanceof ApiError) {
            return res.status(200).send({ ok: false, message: error.message })
        } else {
            console.error(error)
            return res.status(400).send({ error: error.message })
        }

    }
}
