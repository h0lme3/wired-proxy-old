import { evaluatePricing, getPricing } from '../../helpers/pricing'
import { prisma } from "../../helpers/database"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

import { CustomerSupport } from "../../components/index/customersupport"
import { Footer } from "../../components/index/footer"
import { Checkout } from '../../components/checkout'

import Head from "next/head"
import { Header } from '../../components/index/header'
import dayjs from 'dayjs'
import { CURRENT_SITE } from '../../helpers/sites'

if (typeof window !== "undefined") {
    import("../../public/website/js/bootstrap.bundle.min.js")
}

function formatTemplateString (email, args) {
    return email && email.replace(/{(.*?)}/g, (_, literal) => {
        return literal in (args || {})
            ? args[literal]
            : _
    })
}


export default function Index ({ productPage }) {

    const [loading, setLoading] = useState(true)
    const session = useSession()

    useEffect(() => {
        setLoading(false)
    }, [])


    const loader = !loading && session.status !== "loading" ? null : (
        <div id="Preloading_Overlay" className="preloading-overlay-section">
            <div className="preloading-overlay-image">
                <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/porter-white-logo.png`}
                    alt="Wired" />
            </div>
        </div>
    )

    return (
        <>
            <Head>
                <title>Wired - Setting The New Standard.</title>
            </Head>

            {loader}

            <Header />
            <Ordering productPage={productPage} session={session} />

            <CustomerSupport />
            <Footer />
        </>
    )
}



function Ordering ({ productPage, session }) {

    const pricing = evaluatePricing(productPage?.product?.productPricing)

    const [checkOutData, setCheckOutData] = useState(false)
    const [ispForm, setIspForm] = useState({ option: "", period: pricing.defaultPeriod, quantity: pricing.min, })

    const price = getPricing(pricing, ispForm.quantity, ispForm.period)

    const onIspFormChange = (slider) => (e) => {
        switch (slider) {
            default: {
                setIspForm(prev => ({
                    ...prev,
                    [slider]: e?.target?.value
                }))
            }
        }

    }

    const checkout = (e) => {
        const type = productPage.product.productServer ? "server" : productPage.product.productAccount ? "account" : "isp"
        const payload = {
            data: {
                quantity: ispForm.quantity,
            },
            productPage: productPage.productPageId,
            [type]: true,
            main: true,
            renewal: false,
            product: productPage.product
        }


        setCheckOutData(payload)
    }

    const checkoutModal = checkOutData ? <Checkout setCheckOutData={setCheckOutData} checkOutData={checkOutData} /> : null
    const dispatch = +new Date(productPage.productPageDispatch) < +new Date ? "time of order" : dayjs(productPage.productPageDispatch).format("YYYY-MM-DD HH:mm")
    return (
        <>
            {checkoutModal}

            <section className="main-hero-section">
                <div className="container">
                    <div className="row">
                        <div className="col-md-5">
                            <div className="main-hero-content-wrapper">
                                <div className="main-hero-content-wrap">
                                    <h1 className="main-hero-content-title">{productPage.productPageTitle}</h1>
                                    <h2 className="main-hero-content-subtitle">
                                        {formatTemplateString(productPage.productPageDescription, {
                                            dispatch,
                                            title: productPage.productPageTitle
                                        })}
                                    </h2>

                                </div>
                            </div>
                        </div>
                        <div className="col-md-1"></div>
                        <div className="col-md-4">
                            <div>
                                <div className="individual-plan-infobox-wrapper">
                                    <div className="individual-plan-infobox-wrap">
                                        <div className="individual-plan-head">
                                            <div className="individual-plan-title">
                                                <h4 className="individual-plan-title-text">{productPage.product.productTitle}</h4>
                                            </div>
                                        </div>
                                        <div className="individual-plan-body">
                                            <div className="individual-plan-form">


                                                <form>
                                                    <div className="form-group">
                                                        <div id='isp_desc' className="individual-plan-info-text">
                                                            {productPage.product.productDescription}
                                                        </div>
                                                    </div>
                                                    {
                                                        !productPage.product.productServer && <div className="form-group">
                                                            <div className="range-slider">
                                                                <label>Quantity</label>
                                                                <span id='isp_quantity_output' className="range-slider__value">{ispForm.quantity}</span>  {productPage?.product?.productAccount ? "Pack(s)" : !productPage?.product?.productPool?.startsWith("SN_") && "IPs"}
                                                                <input id='isp_quantity_slider' className="form-control-range range-slider__range" type="range" value={ispForm.quantity} min={pricing?.min ?? 0} max={pricing?.max ?? 0} step={productPage?.product?.productPool?.startsWith("SN_") || productPage?.product?.productAccount ? 1 : 5} onChange={onIspFormChange("quantity")} />
                                                            </div>
                                                        </div> || null
                                                    }


                                                    <div className="form-row">
                                                        <div className="col-sm-6 col-xs-12">
                                                            <div className="individual-plan-price">$<span id='isp_price'>{price?.toFixed(2)}</span></div>
                                                        </div>
                                                        <div className="col-sm-6 col-xs-12 text-right">
                                                            <button id='isp_buy' type="button" className="btn btn-primary purchase-plan-btn" onClick={checkout}>Purchase</button>
                                                        </div>
                                                    </div>

                                                </form>


                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="main-hero-section-line-bg"></div>
            </section>

        </>
    )
}

export async function getServerSideProps ({ req, res, query }) {

    const { id: [id] } = query

    const productPage = await prisma.productPage.findUnique({
        where: {
            productPageId: id,
        },
        include: {
            product: {
                select: {
                    productActive: true,
                    productName: true,
                    productPricing: true,
                    productPool: true,
                    productTitle: true,
                    productDescription: true,
                    productRecurring: true,
                    productEliteDiscount: true,
                    productServer: true,
                    productAccount: true,
                    productSite: true,
                    productPreorder: true
                }
            }
        }
    })

    if (!productPage?.product?.productActive || productPage?.product?.productSite !== CURRENT_SITE) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    const serialized = {
        ...productPage,
        productPageDispatch: +productPage.productPageDispatch
    }

    return {
        props: {
            productPage: serialized
        }
    }

}