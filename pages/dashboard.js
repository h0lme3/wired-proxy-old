import { Info } from "../components/info"
import { NavBar } from "../components/navbar"
import { ServerInfo } from "../components/orders/serverinfo"
import Styles from "../styles/user/Dashboard.module.scss"

import { Component } from 'react'
import { Orders } from "../components/orders"
import { Checkout } from "../components/checkout"
import { prisma } from "../helpers/database"
import { getSession } from "next-auth/react"

import Head from "next/head"
import { CURRENT_SITE } from "../helpers/sites"
import SetCredsPopup from "../components/orders/setcredspopup/setcredspopup"

export default class Dashboard extends Component {

    constructor (props) {
        super(props)
        this.state = {
            checkOutData: false,
            serverData: false,
            credData: false

        }
    }

    setCheckOutData = (checkOutData) => {
        this.setState({ checkOutData })
    }

    setServerData = (serverData) => {
        this.setState({ serverData })
    }

    setCredData = (credData) => {
        this.setState({ credData })
    }

    render () {
        const { checkOutData, serverData, credData } = this.state
        const checkoutModal = !serverData && checkOutData ? <Checkout setCheckOutData={this.setCheckOutData} checkOutData={checkOutData} /> : null
        const serverModal = serverData && !checkOutData ? <ServerInfo setServerData={this.setServerData} serverData={serverData} /> : null
        const credModal = credData ? <SetCredsPopup setCredData={this.setCredData} credData={credData} /> : null

        return (
            <>

                <Head>
                    <title>Wired - Dashboard</title>
                </Head>

                <NavBar resiLinks={this.props.resiLinks} />

                <div className={Styles.container}>
                    <div className={Styles.Main}>
                        <Info orders={this.props.orders} />
                        <Orders orders={this.props.orders} setCheckOutData={this.setCheckOutData} setServerData={this.setServerData} setCredData={this.setCredData} />
                    </div>
                </div>

                {checkoutModal}
                {serverModal}
                {credModal}

            </>
        )
    }
}


export async function getServerSideProps ({ req }) {

    const session = await getSession({ req })
    if (!session || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const orders = await prisma.order.findMany({
        orderBy: {
            orderTime: "desc"
        },
        include: {
            residentialPlan: true,
            product: {
                select: {
                    productName: true,
                    productTitle: true,
                    productPricing: true,
                    productExtendable: true,
                    productRecurring: true,
                    productPool: true,
                    productResi: true,
                    productVip: true,
                    productEliteDiscount: true,
                    productServer: true,
                    productAccount: true,
                    productPreorder: true
                }
            },
            /*
            coupon: {
                select: {
                    oneTime: true
                }
            },*/
            proxies: true,
            accounts: true,
            customProxies: true
        },
        where: {
            nextChain: null,
            customerId: session?.user?.customerId,
            product: {
                productSite: CURRENT_SITE
            }
        }
    })

    const serialized = []

    for (let args of orders) {

        const {
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
            ecomOrderId,
            location,
            product,
            proxies,
            accounts,
            secondUser,
            customProxies
        } = args

        let toPush = {
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
            ecomOrderId,
            location,
            product,
            secondUser
        }

        if (product?.productResi && args.residentialPlanId) {
            const {
                residentialPlan: {
                    activeBandwidth,
                    residentialPlanId,
                    usage,
                    username,
                    password,
                }
            } = args

            toPush = {
                ...toPush,
                activeBandwidth,
                residentialPlanId,
                usage,
                username,
                password,
            }
        }

        if (proxies && !secondUser && status === "ACTIVE") {
            toPush.proxies = proxies.map(e => {
                return {
                    ipAddress: e.ipAddress,
                    port: e.port,
                    username: e.username,
                    password: e.password,
                    sortId: e.sortId,
                }
            })
        }

        if (customProxies && secondUser && status === "ACTIVE") {
            toPush.proxies = customProxies.map(e => {
                return {
                    ipAddress: e.ipAddress,
                    port: e.port,
                    username: e.username,
                    password: e.password,
                    sortId: e.sortId,
                }
            })
        }

        if (accounts && status === "ACTIVE") {
            toPush.accounts = accounts.map(e => {
                return {
                    accountId: e.accountId,
                    master: e.master,
                    mpassword: e.mpassword,
                    username: e.username,
                    upassword: e.upassword,
                    email: e.email,
                    epassword: e.epassword,
                    recoveryEmail: e.recoveryEmail,
                    ipAddress: e.ipAddress,
                    firstName: e.firstName,
                    lastName: e.lastName,
                    phone: e.phone,
                    replacement: e.replacement
                }
            })
        }


        serialized.push(toPush)
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
            orders: [
                ...serialized.sort((a, b) => a?.status === "ACTIVE" && b?.status !== "ACTIVE" ? -1 : 1)
            ],
            resiLinks: resiProducts?.map(e => ({ label: e.productTitle, id: e.productName, vip: e.productVip })) ?? [],
        }
    }
}