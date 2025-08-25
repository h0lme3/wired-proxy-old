
import { NavBar } from "../../components/navbar"

import Styles from "../../styles/user/Residential.module.scss"

import { ResiInfo } from "../../components/resiinfo"
import { ResiPlans } from "../../components/resiplans"
import { Generator } from "../../components/generator"
import { getSession } from "next-auth/react"

import Head from "next/head"
import { prisma } from "../../helpers/database"
import { isUserVIP } from "../../helpers/vip"
import { useEffect, useState } from "react"
import { CURRENT_SITE } from "../../helpers/sites"


export default function Residential ({ resiPlans, resiLinks, title }) {

    const [selectedPlan, setSelectedPlan] = useState(resiPlans?.[0])

    useEffect(() => {
        setSelectedPlan(resiPlans?.[0])
    }, [resiPlans])

    const changePlan = (e) => {
        const selectedPlanId = e?.target?.value
        const nextSelected = resiPlans?.find(e => e.orderId === selectedPlanId)
        if (!nextSelected)
            return

        setSelectedPlan(nextSelected)
    }


    return (
        <>
            <Head>
                <title>Wired - {title} Residential</title>
            </Head>

            <NavBar resiLinks={resiLinks} />

            <div className={Styles.container}>
                <div className={Styles.Main}>
                    <ResiInfo selectedPlan={selectedPlan} />
                    <ResiPlans resiPlans={resiPlans} selectedPlan={selectedPlan} changePlan={changePlan} title={title} />
                </div>
                <div className={Styles.Side}>
                    <Generator selectedPlan={selectedPlan} title={title} />
                </div>
            </div>

        </>
    )

}


export async function getServerSideProps ({ req, query }) {

    const { id: [id] } = query
    if (!id) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const session = await getSession({ req })
    if (!session || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const product = await prisma.product.findUnique({
        where: {
            productName: id
        },
        select: {
            productTitle: true,
            productResi: true,
            productVip: true,
        }
    })

    if (!product) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const userVip = session?.user?.meta === "elite" || await isUserVIP(session?.user?.customerId)
    if (!userVip && product.productVip) {
        return {
            redirect: {
                destination: `/residential?message=Subscribe to Porter VIP to gain access to whitelist providers and exclusive discount codes.`,
                permanent: false
            }
        }
    }

    const orders = await prisma.order.findMany({
        where: {
            customerId: session.user.customerId,
            productName: id,
            residentialPlanId: {
                not: null
            },
            status: "ACTIVE"
        },
        orderBy: {
            orderTime: "desc"
        },
        include: {
            residentialPlan: true,
            product: {
                select: {
                    productTitle: true
                }
            }
        }
    })

    const serialized = orders.map(({
        product,
        expiry,
        orderTime,
        length,
        status,
        total,
        type,
        quantity,
        productName,
        productImage,
        orderId,
        location,
        residentialPlan: {
            activeBandwidth,
            residentialPlanId,
            usage,
            username,
            password,
        }
    }) => {

        return {
            product,
            expiry: +expiry,
            orderTime: +orderTime,
            length,
            status,
            total,
            type,
            quantity,
            productName,
            productImage,
            orderId,
            location,
            activeBandwidth,
            residentialPlanId,
            usage,
            username,
            password,
        }
    })

    if (!serialized?.length) {
        return {
            redirect: {
                destination: `/residential?message=You don't have any active orders for the product ${product.productTitle} yet.`,
                permanent: false
            }
        }
    }

    const resiProducts = await prisma.product.findMany({
        where: {
            productResi: 1,
            productHomepage: 1,
            productSite: CURRENT_SITE
        },
        select: {
            productName: true,
            productTitle: true,
            productVip: true
        }
    })

    return {
        props: {
            resiPlans: [
                ...serialized
            ],
            title: product.productTitle,
            resiLinks: resiProducts?.map(e => ({ label: e.productTitle, id: e.productName, vip: e.productVip })) ?? [],

        }
    }
}