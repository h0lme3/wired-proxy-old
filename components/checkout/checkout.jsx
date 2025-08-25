import { Component } from 'react'
import Styles from "./checkout.module.scss"
import Image from "next/image"
import Checkbox from "react-custom-checkbox"
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { toastLoader } from '../../helpers/notifications'
import { evaluatePricing, getPricing, } from '../../helpers/pricing'
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

const sliderStyles = {
    railStyle: {
        backgroundColor: '#393F4F',
        height: '3px',
        borderRadius: '26px'
    },
    trackStyle: {
        backgroundColor: '#ff5600',
        height: '3px',
        borderRadius: '26px'
    },
    handleStyle: {
        borderColor: '#FFFFFF',
        background: '#FFFFFF',
        height: '11px',
        width: '11px',
        opacity: '1'
    }
}


function withSession (Component) {
    return function useSessionWrap (props) {
        const session = useSession()
        if (Component.prototype.render) {
            return <Component session={session} {...props} />
        }
    }
}

export default withSession(class Checkout extends Component {

    constructor (props) {
        super(props)
        this.state = {
            quantity: (props?.checkOutData?.data?.quantity || props?.checkOutData?.order?.quantity?.replace(" GB", "")) ?? 0,
            period: props?.checkOutData?.data?.selectedPeriod ?? 0,
            coupon: "",
            discount: 0,
            userElite: props?.session?.data?.user?.meta === "elite",
            eliteDiscount: props?.session?.data?.user?.meta === "elite" ? props?.checkOutData?.product?.productEliteDiscount : 0,
            email: props?.session?.data?.user?.email ?? "",
            submitting: false,
            acceptedTos: false,
            subscription: (
                (props?.checkOutData?.isp || props?.checkOutData?.vip || props?.checkOutData?.server) &&
                props?.checkOutData?.product?.productRecurring &&
                !(props?.checkOutData?.product?.productPreorder && !props?.checkOutData?.order) &&
                !props?.checkOutData?.order?.ecomOrderId &&
                props?.checkOutData?.data?.period != 1) &&
                !(props?.checkOutData?.server && props?.checkOutData.productPage)
                ? true : false,
        }
    }

    componentDidMount = () => {
        document.body.classList.add("noscroll")
    }

    componentWillUnmount = () => {
        document.body.classList.remove("noscroll")
    }

    checkboxChange = (which) => (e) => {
        this.setState({ [which]: e })
    }

    quantityValueChange = (e) => {

        if (isNaN(e.target.value) || !!(e.target.value % 1))
            return this.setState(prev => ({ ...prev, quantity: 0 }))

        const { checkOutData: checkout } = this.props
        const { productPricing, } = checkout.product
        const pricing = evaluatePricing(productPricing)

        const maxQuantity = Math.max(...pricing.ranges.map(e => e.max))
        if (e.target.value > maxQuantity)
            return

        this.setState({ quantity: e.target.value })

    }

    quantityChange = (quantity, e) => {
        this.setState({ quantity })
    }

    periodChange = (period, e) => {
        this.setState({ period })
    }

    couponChange = (e) => {
        this.setState({ coupon: e.target.value })
    }

    emailChange = (e) => {
        this.setState({ email: e.target.value })
    }

    applyCoupon = async (e) => {

        this.setState({ submitting: true })

        const { toastSuccess, toastError } = toastLoader("Applying coupon code...")

        const { coupon: discountCode, quantity, period: periodState, subscription } = this.state
        const { checkOutData: { product: { productName, productPricing }, renewal, order } } = this.props


        try {

            const pricing = evaluatePricing(productPricing)
            const periods = Object.keys(pricing.periods)
            const period = (renewal && subscription && order?.total != 0) ? order?.length?.replace('D', '') : periods[periodState]

            const inheritOrderData = (renewal && subscription && period === order?.length?.replace('D', '') && order?.total != 0 && !order?.coupon?.oneTime)
            if (inheritOrderData)
                throw new Error(`Coupons are not applicable to this order`)

            if (!discountCode)
                throw new Error(`Please type a discount code first`)

            const res = await fetch("/api/discount", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ discountCode, productName, quantity })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                this.setState({ submitting: false })
                return
            }

            this.setState({ discount: res.discount, submitting: false })
            toastSuccess(`Applied coupon ${discountCode} to your order!`)

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }

    }

    closeModal = (e) => {
        e?.preventDefault()

        const { setCheckOutData } = this.props
        setCheckOutData(false)
    }

    checkOut = (type) => async (e) => {

        this.setState({ submitting: true })

        const { toastSuccess, toastError } = toastLoader("Creating checkout session...")

        const { quantity: quantityState, period: periodState, discount: discountState, coupon: couponState, email, subscription, acceptedTos } = this.state
        const { checkOutData: checkout } = this.props


        const { productName, productPricing, productPool, productPreorder } = checkout.product

        const pricing = evaluatePricing(productPricing)
        const periods = Object.keys(pricing.periods)
        const period = (checkout.renewal && subscription && checkout?.order?.total != 0) ? checkout?.order?.length?.replace('D', '') : periods[periodState]
        const quantity = quantityState

        const inheritOrderData = (checkout.renewal && subscription && period === checkout?.order?.length?.replace('D', '') && checkout?.order?.total != 0 && !checkout?.order?.coupon?.oneTime)

        const ref = localStorage.getItem('ref')

        const coupon = inheritOrderData ? undefined : discountState ? couponState : undefined
        const payload = {
            checkout: {
                orderId: checkout.order?.orderId,
                main: checkout.main,
                isp: checkout.isp,
                resi: checkout.resi,
                renewal: checkout.renewal,
                vip: checkout.vip,
                referral: subscription && checkout.referral,
                trial: subscription && checkout.trial,
                productPage: checkout?.productPage ?? undefined,
                subscription: checkout?.data?.dispatchTime ? false : subscription,
                dispatchTime: (checkout.isp && period == 1 && checkout?.data?.dispatchTime) ? checkout?.data?.dispatchTime : undefined,
                productName,
                email,
                coupon,
                quantity,
                period,
                ref
            },
        }

        try {

            if (isNaN(quantity) || !quantity)
                throw new Error(`Invalid quantity, please use the slider to choose a proper quantity value.`)

            if (!acceptedTos)
                throw new Error(`You need to agree to the Terms & Conditions and Privacy Policy to order`)

            if (type === "crypto" && subscription)
                throw new Error(`You can't pay with crypto and with auto-renew on.`)

            const endpoint = "/api/checkout"
            const res = await fetch(endpoint, {

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

            window.location.href = res.url

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }

    }

    render () {
        const { quantity: quantityState, period: periodState, discount: discountState, userElite, eliteDiscount, submitting, email, subscription, acceptedTos } = this.state
        const { session, checkOutData: checkout } = this.props

        const { productTitle, productPricing, productRecurring, productPool, productAccount, productPreorder } = checkout.product

        const pricing = evaluatePricing(productPricing)
        const periods = Object.keys(pricing.periods)
        const period = (checkout.renewal && subscription && checkout?.order?.total != 0) ? checkout?.order?.length?.replace('D', '') : periods[periodState]
        const quantity = quantityState

        const price = getPricing(pricing, quantity, period)

        const minQuantity = pricing.min
        const maxQuantity = pricing.max
        const maxPeriods = Object.keys(pricing.periods)

        const inheritOrderData = (checkout.renewal && subscription && period === checkout?.order?.length?.replace('D', '') && checkout?.order?.total != 0 && !checkout?.order?.coupon?.oneTime)

        const subtotal = inheritOrderData ? checkout?.order?.total : (price.toFixed(2))
        const discount = inheritOrderData ? "0.00" : ((subtotal * (discountState / 100)) + (subtotal * (eliteDiscount / 100))).toFixed(2)
        const total = inheritOrderData ? checkout?.order?.total : (subtotal - discount).toFixed(2)

        const periodSlider = periods.length > 1 && ((checkout.renewal && !subscription) || checkout.main) && !checkout.productPage && checkout.isp && (
            <div className={Styles.slider}>
                <Slider min={0} max={maxPeriods.length - 1} step={1} defaultValue={periodState} {...sliderStyles} onChange={this.periodChange} />
            </div>
        ) || null

        const dispatchAt = (checkout.isp && period == 1) && checkout.data?.dispatchTime && <p style={{ marginTop: '10px', userSelect: "none", fontWeight: "600", fontSize: "12px", lineHeight: "15px", }}>
            This is a product that will be delivered to you at: <label style={{ display: "block", marginTop: "3px", color: "#FF2976" }}>
                {new Date(checkout.data.dispatchTime).toLocaleString("en-US")}
            </label>
        </p> || null

        const trialIndicator = subscription && checkout.trial && <p style={{ marginTop: '10px', userSelect: "none", fontWeight: "600", fontSize: "12px", lineHeight: "15px", }}>
            You will have {checkout.trial} day(s) of trial before being charged for this Porter VIP membership.
        </p> || null

        const eliteDiscountIndicator = userElite && checkout.product?.productEliteDiscount && <small>
            ({checkout.product?.productEliteDiscount}% Elite Discount Applied)
        </small> || null

        const cryptoButton = !trialIndicator && <div className={Styles.cryptoCheckout}>

            <p>Alternatively, checkout with Crypto payments!</p>

            <button className={Styles.checkout} onClick={this.checkOut("crypto")} disabled={submitting}>
                <p>
                    Crypto Checkout
                </p>
            </button>
        </div> || null

        const subscriptionCheckbox = !(productPreorder && !checkout.order) && (productRecurring && (checkout.isp || checkout.vip || checkout.server) && !checkout?.order?.ecomOrderId && period != 1 && !(checkout.server && checkout.productPage) && !trialIndicator && (
            <Checkbox
                checked={subscription}
                name="stripeSubscribe"
                onChange={this.checkboxChange("subscription")}
                borderColor="#404656"
                containerStyle={{ cursor: "pointer" }}
                icon={<div style={{ backgroundColor: "#5CFF94", borderRadius: 5, padding: 8 }} />}
                style={{ marginTop: '5px', background: "#313644", border: "1px solid #404656", width: "12px", height: "12px" }}
                label="Opt-in to auto renew this order before it expires"
                labelStyle={{ marginTop: '5px', marginLeft: "7px", userSelect: "none", fontWeight: "600", fontSize: "12px", lineHeight: "15px", color: "#5CFF94" }}
            />
        )) || null

        return (
            <div className={Styles.fullScreenContainer}>
                <div className={Styles.container}>
                    <div className={Styles.left}>
                        <div className={Styles.cart}>
                            <div className={Styles.info}>
                                <div className={Styles.imageContainer}>
                                    <Image src={'/checkout-icon.svg'} width={'72px'} height={'72px'} />
                                </div>
                                <div className={Styles.cartInfo}>
                                    <div className={Styles.cartChip}>
                                        <p>Your Cart</p>
                                    </div>

                                    <p className={Styles.productName}>
                                        {productTitle}
                                    </p>

                                    {!productAccount ?
                                        <p className={Styles.productInfo}>
                                            Length: {period} Day(s)

                                            {periodSlider}

                                        </p>
                                        : null}
                                </div>

                            </div>
                            <div className={Styles.inputSlider}>
                                <div className={Styles.quantity}>
                                    <p>
                                        Quantity
                                    </p>

                                    <input
                                        name={"quantity"}
                                        type={"text"}
                                        maxLength={9}
                                        className={Styles.couponInput}
                                        onChange={this.quantityValueChange}
                                        value={quantity}
                                        disabled={(checkout.renewal && checkout.isp) || checkout.vip}
                                    />

                                </div>
                                <div className={Styles.slider}>
                                    <Slider min={minQuantity} max={maxQuantity} step={productPool?.startsWith("SN_") || checkout.resi ? 1 : 5} defaultValue={quantity} {...sliderStyles} onChange={this.quantityChange} disabled={(checkout.renewal && checkout.isp) || checkout.vip} />
                                </div>
                            </div>
                        </div>
                        <div className={Styles.couponSection}>
                            <input
                                name={"coupon"}
                                type={"text"}
                                maxLength={255}
                                placeholder={"Enter Coupon"}
                                className={Styles.couponInput}
                                onChange={this.couponChange}
                                disabled={!!discountState}
                            />

                            <button disabled={!!discountState || submitting} onClick={this.applyCoupon}>
                                <p>
                                    Apply Coupon
                                </p>
                            </button>
                        </div>

                        <div className={Styles.subtotalSection}>
                            <p>Subtotal</p>
                            <p className={Styles.value}>${subtotal}</p>
                        </div>

                        <div className={Styles.discountSection}>
                            <p>Discount</p>
                            <div className={Styles.value}>
                                <p className={Styles.value}>-${discount}</p>
                                {eliteDiscountIndicator}
                            </div>
                        </div>


                        <div className={Styles.totalSection}>
                            <p>Total</p>
                            <p className={Styles.value}>${total}</p>
                        </div>

                        <div className={Styles.returnSection}>
                            <p>Looking for more? <a href={"#!"} onClick={this.closeModal}>Continue shopping</a></p>
                        </div>

                    </div>
                    <div className={Styles.right}>
                        <div className={Styles.header}>
                            <div className={Styles.step}>
                                <p>1</p>
                            </div>
                            <div className={Styles.title}>
                                <p className={Styles.headerTitle}>
                                    Customer Information
                                </p>
                                <p className={Styles.headerSubtitle}>
                                    Input customer information
                                </p>
                            </div>
                            <div className={Styles.closeButton} onClick={this.closeModal}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.000488281" y="10.6667" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(-45 0.000488281 10.6667)" fill="#73768E" />
                                    <rect x="1.3335" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(45 1.3335 0)" fill="#73768E" />
                                </svg>
                            </div>

                        </div>
                        <div className={Styles.body}>

                            <p>
                                Enter your email address. This address will be used to send your order status updates.
                            </p>

                            <input
                                name={"email"}
                                type={"text"}
                                maxLength={255}
                                placeholder={"example@gmail.com"}
                                value={email}
                                disabled={session.status === "authenticated"}
                                onChange={this.emailChange}
                            />

                            <Checkbox
                                checked={acceptedTos}
                                name="acceptedTos"
                                onChange={this.checkboxChange("acceptedTos")}
                                borderColor="#404656"
                                containerStyle={{ cursor: "pointer" }}
                                icon={<div style={{ backgroundColor: "#ffbc00", borderRadius: 5, padding: 8 }} />}
                                style={{ background: "#313644", border: "1px solid #404656", width: "12px", height: "12px" }}
                                label={
                                    <p onClick={e => e.stopPropagation()}>I have read and agree to the <a target="_blank" href='/legal/terms-conditions.html' style={{ textDecoration: "underline" }}>Terms &#38; Conditions</a> and <a target="_blank" href='/legal/privacy-policy.html' style={{ textDecoration: "underline" }}>Privacy Policy</a></p>
                                }
                                labelStyle={{ marginLeft: "7px", userSelect: "none", fontWeight: "600", fontSize: "12px", lineHeight: "15px", color: "#939AAA" }}
                            />

                            {subscriptionCheckbox}

                            {dispatchAt}

                            {trialIndicator}

                            <div className={Styles.actions}>
                                <button onClick={this.closeModal}>
                                    <p>
                                        Continue Shopping
                                    </p>
                                </button>
                                <button className={Styles.checkout} onClick={this.checkOut("stripe")} disabled={submitting}>
                                    <p>
                                        Proceeed to Checkout
                                    </p>
                                </button>
                            </div>

                            {/* cryptoButton */}

                            <div className={Styles.steps}>
                                <div className={Styles.highlight}>
                                    <p>
                                        Customer Info
                                    </p>
                                    <div className={Styles.step}>

                                    </div>
                                </div>
                                <div>
                                    <p>
                                        Payment Info
                                    </p>
                                    <div className={Styles.step}>

                                    </div>
                                </div>
                                <div>
                                    <p>
                                        Order Confirmation
                                    </p>
                                    <div className={Styles.step}>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )
    }
})
