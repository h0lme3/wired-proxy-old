import { Component } from 'react'
import Styles from "./isporder.module.scss"
import Image from "next/image"
import day from 'dayjs'
import { evaluatePricing, getPricing } from '../../helpers/pricing'
import { toastLoader } from '../../helpers/notifications'

import { withRouter } from 'next/router'
import { toast } from 'react-toastify'

import ReactSwitch from 'react-switch'
import { useSession } from 'next-auth/react'
import { eventTypes, sendEvent } from '../../helpers/sendEvent'

import { Parser } from 'json2csv'

function withSession (Component) {
    return function useSessionWrap (props) {
        const session = useSession()
        if (Component.prototype.render) {
            return <Component session={session} {...props} />
        }
    }
}

export default withRouter(withSession(class IspOrder extends Component {

    constructor (props) {
        super(props)
        this.state = {
            submitting: false,
            subscription: !!props?.order?.ecomOrderId || false,
            options: false
        }
    }

    viewServer = async () => {

        const { order, session, setServerData } = this.props
        if (session.status !== "authenticated")
            return

        if (order?.status != "ACTIVE")
            return toast.error(`Can't view server information for this order because it is not active.`)

        const { toastSuccess, toastError } = toastLoader(`Loading server information for order ${order.orderId}...`)
        this.setState({ submitting: true })

        try {

            const res = await fetch("/api/server/info", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: order.orderId
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                this.setState({ submitting: false })
                return
            }

            toastSuccess("Loaded server information!")
            setServerData(res.data)
            this.setState({ submitting: false })

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }

        return
    }

    toggleSubscription = async (enabled) => {

        if (!enabled && this.state.subscription) {
            return await this.cancelSub()
        }

        const { order, session } = this.props
        if (session.status !== "authenticated")
            return

        if (order?.status != "ACTIVE")
            return toast.error(`Can't enable auto renew for an order that is not active.`)


        const { toastSuccess, toastError } = toastLoader(`Setting up subscription for ${order.orderId}...`)
        this.setState({ submitting: true })

        const { productPricing, productName } = order?.product
        const pricing = evaluatePricing(productPricing)

        const payload = {
            checkout: {
                orderId: order.orderId,
                main: false,
                isp: true,
                renewal: true,
                email: session.data.user.email,
                coupon: undefined,
                subscription: true,
                quantity: order.quantity,
                period: pricing.defaultPeriod,
                productName,
            },
        }

        try {

            const res = await fetch("/api/checkout", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                this.setState({ submitting: false })
                return
            }


            toastSuccess("Redirecting to Stripe...")
            window.location.href = res.url

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }


    }

    downloadAccounts = (e) => {
        const { order: { orderId, accounts, status } } = this.props
        if (status !== "ACTIVE")
            return toast.error(`No accounts assigned to this plan yet.`)

        const replacements = {}
        const serialized = [...accounts]
        const list = []

        for (const account of serialized) {

            if (!account.replacement)
                continue

            const replacementAccount = {}
            for (const key in account) {
                if (!account.hasOwnProperty(key))
                    continue

                if (key == "replacement" || key == "accountId")
                    continue

                replacementAccount[`R1_${key}`] = account[key]

            }

            replacements[account.replacement] = replacementAccount

        }

        for (const account of serialized) {
            if (account.replacement)
                continue

            if (replacements[account.accountId])
                list.push({ ...account, ...replacements[account.accountId] })
            else
                list.push({ ...account })
        }


        for (const account of list)
            for (const key in account)
                if (!account[key] || key == "accountId")
                    delete account[key]

        const data = new Parser({ header: true }).parse(list)

        const a = document.createElement('a')
        a.download = 'accounts_list.csv'
        a.href = URL.createObjectURL(new Blob([data]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()

        toast.success(`Downloaded your accounts list!`)
        sendEvent(eventTypes[4], [orderId, Math.round((+new Date) / 60000)])
    }

    downloadList = (e) => {

        const proxyList = []
        const { order: { orderId, proxies, status, product: { productServer, productAccount } } } = this.props

        if (productServer)
            return this.viewServer()

        if (productAccount)
            return this.downloadAccounts()

        if (status !== "ACTIVE" || !(proxies instanceof Array))
            return toast.error(`No proxies assigned to this plan yet.`)


        for (let proxy of proxies) {
            proxyList.push(`${proxy.ipAddress}:${proxy.port}:${proxy.username}:${proxy.password}`)
        }

        if (!proxyList.length)
            return toast.error(`No proxies assigned to this plan.`)

        const a = document.createElement('a')
        a.download = 'proxylist.txt'
        a.href = URL.createObjectURL(new Blob([proxyList.join('\r\n')]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()

        toast.success(`Downloaded your proxy list!`)
        sendEvent(eventTypes[4], [orderId, Math.round((+new Date) / 60000)])
    }

    downloadInsomniacList = (e) => {

        const { order: { orderId, proxies, status, product: { productServer, productAccount } } } = this.props

        if (productServer)
            return this.viewServer()

        if (productAccount)
            return this.downloadAccounts()

        if (status !== "ACTIVE" || !(proxies instanceof Array))
            return toast.error(`No proxies assigned to this plan yet.`)

        if (status !== "ACTIVE")
            return toast.error(`No accounts assigned to this plan yet.`)

        const list = [...proxies]
        list.sort((a, b) => a.sortId - b.sortId)

        const proxiesList = []
        for (let i = 0; i < list.length; i++) {
            proxiesList.push({ schema: "Proxy", name: `Proxy ${i}`, ...list[i] })
        }

        //Name,Host,Port,Username,Password,Scheme

        const fields = [{
            label: "Name",
            value: "name",
        }, {
            label: "Host",
            value: 'ipAddress'
        }, {
            label: "Port",
            value: "port",
        }, {
            label: "Username",
            value: "username",
        }, {
            label: "Password",
            value: "password"
        }, {
            label: "Schema",
            value: "schema"
        }]

        const data = new Parser({ header: true, fields, quote: "" }).parse(proxiesList)

        const a = document.createElement('a')
        a.download = 'proxylist.csv'
        a.href = URL.createObjectURL(new Blob([data]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()

        toast.success(`Downloaded your proxy list!`)
        sendEvent(eventTypes[4], [orderId, Math.round((+new Date) / 60000)])
    }

    toggleOptionPopup = async (e) => {
        this.setState(prev => ({
            ...prev,
            options: !prev.options
        }))
    }

    cancelSub = async (e) => {

        try {

            const { order: { orderId, ecomOrderId } } = this.props
            if (!orderId || !ecomOrderId)
                return

            this.setState({ submitting: true })

            const { toastSuccess, toastError } = toastLoader(`Cancelling subscription for ${orderId}...`)

            const res = await fetch("/api/subscription/cancel", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId, ecomOrderId })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                this.setState({ submitting: false })
                return
            }

            toastSuccess(`Subscription cancelled for ${orderId}`)
            this.setState({ submitting: false, subscription: false })

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }

    }

    topUp = (e) => {

        const { setCheckOutData, order } = this.props

        if (!order?.product)
            return toast.error(`Can't extend a retired product order.`)

        if (!order?.product?.productExtendable)
            return toast.error(`Can't extend orders with this type.`)

        if (order?.status != "ACTIVE")
            return toast.error(`Can't top up an order that is not active.`)

        if (order?.ecomOrderId)
            return toast.error(`You already have auto renewal enabled for this order.`)

        const payload = {
            order: {
                orderId: order.orderId,
                ecomOrderId: order.ecomOrderId,
                quantity: order.quantity,
                length: order.length,
                expiry: order.expiry,
                total: order.total,
                coupon: order.coupon
            },
            main: false,
            renewal: true,
            isp: true,
            product: order.product
        }

        setCheckOutData(payload)
    }

    render () {


        const { submitting, subscription, options } = this.state
        const { order: { orderId, productName, quantity, total, orderTime, expiry, status, ecomOrderId, product, type } } = this.props
        const { productTitle, productRecurring, productExtendable, productServer, productAccount } = this.props?.order?.product ?? {}

        const activeTimeDays = day(expiry).diff(+new Date, "days")
        const activeTime = (activeTimeDays > -1 ? activeTimeDays + ' days left' : '-')
        const statusDisplay = !["ACTIVE", "EXPIRED"].includes(status) ? "PENDING" : status

        const customCredentialsButton = product && !productAccount && !productServer && type !== "PORTER_VIP" &&
            <div className={Styles.CustomCredsButton} onClick={() => {
                if (status !== "ACTIVE")
                    return toast.error(`Can't set custom credentials for an order that is not active.`)
                return this.props.setCredData(this.props.order)
            }} disabled={submitting}>
                <p> {"Set Credentials"} </p>
            </div> || null


        return (

            <div className={Styles.Row}>
                <div className={Styles.Data} style={{
                    marginBottom: options ? "40px" : "",
                    transition: "all 300ms linear"
                }}>
                    <div className={Styles.OrderNo}>
                        <Image src={"/order-logo.svg"} width={"23px"} height={"23px"} />
                        <p> {orderId} </p>
                    </div>
                    <div className={Styles.ProductName}> {productTitle || productName} </div>
                    <div className={Styles.Qty}> {quantity} </div>
                    <div className={Styles.Total}> {total} </div>
                    <div className={Styles.OrderDate}> {day(orderTime).format('YYYY-MM-DD')} </div>
                    <div className={Styles.ActiveTime}> {activeTime}  </div>
                    <div className={Styles.Status} style={{ position: "relative" }}>

                        <div className={statusDisplay === 'ACTIVE' ? Styles.ChipGreen : status === "EXPIRED" ? Styles.ChipRed : Styles.ChipOrange}>
                            <p> {statusDisplay} </p>
                        </div>

                        <div className={Styles.ViewButton} disabled={submitting} onClick={this.toggleOptionPopup}>
                            <p> Download </p>
                        </div>

                        <div style={{
                            position: "absolute",
                            display: "flex",
                            top: options ? "38px" : "10px",
                            gap: "4px",
                            visibility: options ? "visible" : "hidden",
                            opacity: options ? "1" : "0",
                            transition: "all 300ms linear"
                        }}>
                            <div className={Styles.DownloadButton} disabled={submitting} onClick={this.downloadList}>
                                <p> Default </p>
                            </div>
                            <div className={Styles.DownloadInsomniacButton} disabled={submitting} onClick={this.downloadInsomniacList}>
                                <p> Insomniac Download </p>
                            </div>
                        </div>

                        <div className={Styles.ExtendPlanButton} onClick={this.topUp} disabled={submitting}>
                            <p> {"Extend Plan"} </p>
                        </div>

                        {customCredentialsButton}

                    </div>

                    <div className={Styles.AutoRenew}>
                        <ReactSwitch
                            disabled={submitting || !productRecurring || !productExtendable}
                            checked={subscription}
                            onChange={this.toggleSubscription}
                            onColor="#5CFF94"
                            offColor="#313644"
                            onHandleColor="#5cff94"
                            offHandleColor="#939AAA"
                            activeBoxShadow='0 0 2px 3px #5cff94'
                            handleDiameter={22}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                            height={15}
                            width={35}
                        />
                    </div>
                </div>

            </div>
        )
    }
}))
