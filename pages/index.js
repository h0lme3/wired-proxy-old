
import { prisma } from "../helpers/database"

import { getSession, useSession } from "next-auth/react"
import { useState, useEffect, useMemo } from "react"

import { Checkout } from '../components/checkout'
import { toast } from 'react-toastify'

import Head from "next/head"
import Image from "next/image"
import Link from "next/link"

import { evaluatePricing, getPricing } from "../helpers/pricing"
import dayjs from "dayjs"
import { useRouter } from "next/router"

import { CURRENT_SITE } from "../helpers/sites"
import Styles from "../styles/user/Index.module.scss"

import Select, { components } from 'react-select'
import Slider from "rc-slider"
import 'rc-slider/assets/index.css'
import { sendEvent } from "../helpers/sendEvent"

const sliderStyles = {
    railStyle: {
        backgroundColor: '#F2F2F2',
        height: '10px',
        borderRadius: '3px',
        boxShadow: "0px 1px 1px 1px rgba(0, 0, 0, 0.10) inset"
    },
    trackStyle: {
        backgroundColor: '#ff5600',
        height: '10px',
        borderRadius: '3px'
    },
    handleStyle: {
        borderColor: '#CC4602',
        background: '#FF5600',
        height: '20px',
        width: '20px',
        opacity: '1'
    }
}

const SelectStyles = {
    control: provided => ({
        ...provided,
        minHeight: "36px",
        padding: "0px 10px",
        minWidth: "189px",
        borderRadius: "6px",
        border: "1px solid #B6B6B6",
        background: "#FFF",
        boxShadow: "0px 4px 4px 0px rgba(255, 255, 255, 0.25) inset, 0px 2px 2px 0px rgba(0, 0, 0, 0.05), 0px 0px 0px 1px #E6E6E6",
        color: "#000",
        fontFamily: "Inter",
        fontSize: "14px",
        fontStyle: "normal",
        fontWeight: "500",
        lineHeight: "normal",

    }),
    singleValue: (base) => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
    }),
    menu: (base) => ({
        ...base,
        width: 'auto',
        minWidth: "350px",
        fontSize: '14px',
    }),
    option: (base) => ({
        ...base,
        padding: '5px 10px',
    }),

}

const SelectTheme = (theme) => ({
    ...theme,
    borderRadius: 0,
    colors: {
        ...theme.colors,
        primary25: '#FF560010',
        primary: '#FF5600',
    },
})

const InnerSingleValue = (label) => {
    const Component = ({ children, ...props }) => (
        <components.SingleValue {...props}>
            <span style={{
                color: "#5C5C68",
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: "500",
                lineHeight: "normal",
            }}>{label}: </span>
            <strong style={{
                color: "#000",
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: "500",
                lineHeight: "normal",
                padding: "0px 10px"
            }}>{children}</strong>
        </components.SingleValue>
    )

    // Assign a display name for better debugging
    Component.displayName = `InnerSingleValue(${label})`

    return Component
}

export default function Index ({ products, availability, }) {

    const { query, route } = useRouter()
    const [loading, setLoading] = useState(true)
    const session = useSession()

    useEffect(() => {
        if (session.status !== "loading") {
            setLoading(false)

            if (typeof query.success !== "undefined") {
                window.history.replaceState({}, document.title, route)
                toast.success(`Successfully placed your order!`, { autoClose: 15000 })
            } else if (typeof query.error !== "undefined") {
                window.history.replaceState({}, document.title, route)
                toast.error(`Your order checkout session was cancelled.`, { autoClose: 15000 })
            }

        }
    }, [session.status, query, route])


    return (
        <>
            <Head>
                <title>Wired - Global leaders in everything proxies</title>
                <style global={"true"}>{`
                    html, body {
                        background-color: white !important;
                        background: white !important;
                        margin: 0; /* Optional: Remove margin if needed */
                        padding: 0; /* Optional: Remove padding if needed */
                        color: #000 !important;
                        font-family: "SF Pro Display" !important;
                        scroll-behavior: smooth;
                    }
                `}
                </style>
            </Head>
            <div className={Styles.Container}>
                <NavBar />
            </div>
            <div className={Styles.Border}></div>
            <div className={Styles.PaddedContainer}>
                <div className={Styles.HeroSection}>
                    <div className={Styles.HeroGraphic}></div>
                    <h1>Global leaders in <br /> everything proxies</h1>
                    <p>Access every type of proxy and network for any industry <br /> under one roof.</p>
                    <div className={Styles.CTA}>
                        <Link href={"/#buy"}>
                            <a>Purchase</a>
                        </Link>
                    </div>
                </div>
            </div>
            <div className={Styles.PaddedContainer}>
                <div id="features" className={Styles.BentoSection}>
                    <div className={Styles.BentoHeader}>
                        <span>What we have to offer</span>
                        <h2>Everything you need, in one place</h2>
                        <p>Looking for residential networks, ISPs, mobile or datacenter proxies? <br /> We&apos;ve got you covered.</p>
                    </div>

                    <div className={Styles.BentoMain}>
                        <img src="/new-graphics/Bento1.svg"></img>
                        <h3>Residential Networks</h3>
                        <p>We offer all major residential networks at industry leading prices</p>
                    </div>

                    <div className={Styles.BentoBottom}>
                        <div>
                            <img src="/new-graphics/Bento2.svg"></img>
                            <h3>ISP Proxies</h3>
                            <p>Premium ISP announced on Tier 1 carrier networks</p>
                        </div>
                        <div>
                            <img src="/new-graphics/Bento3.svg"></img>
                            <h3>Datacenter & Mobile Proxies</h3>
                            <p>Specialized mobile proxy nodes and high speed datacenters</p>
                        </div>

                    </div>
                </div>

                <div className={Styles.BentoSection}>
                    <div className={Styles.BentoHeader}>
                        <span>Catering to all markets</span>
                        <h2>Explore our signature products</h2>
                        <p>We offer specialized products optimised for every market and use case. <br /> Choose your industry.</p>
                    </div>
                </div>

                <PurchaseSection {...{ products, availability }} />

                <div id="contact" className={Styles.SupportSection}>
                    <div className={Styles.SupportContainer}>
                        <div className={Styles.Graphic}></div>
                        <div className={Styles.Content}>
                            <h2>
                                Get in touch for updates <br /> and customer support.
                            </h2>
                            <span>
                                Get in touch for updates and customer support.
                            </span>

                            <div className={Styles.Buttons}>
                                <a
                                    href={"https://discord.gg/WDmy7EmRZu"}
                                    target={"_blank"}
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <div>
                                        <p>
                                            Join Discord
                                        </p>
                                    </div>
                                </a>

                                <a
                                    href={"mailto:admin@wiredproxies.com"}
                                    target={undefined}
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <div>
                                        <p>
                                            Email
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </div>

                    </div>
                </div>


                <Footer />
            </div>




        </>
    )
}

export function Footer () {
    const router = useRouter()
    return <div className={Styles.Footer}>
        <div className={Styles.LogoContainer}>
            <div onClick={() => router.push("/")} className={Styles.Logo}>
                <Image src="/logo.png" width="137" height="25" />
            </div>
            <p>
                Global leaders <br />
                in everything proxies.
            </p>
            <div className={Styles.Icons}>
                <a href="https://x.com/Wired_Proxies" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: "pointer" }} >
                        <path d="M14.5028 2.91675H16.9043L11.6575 8.91758L17.83 17.0834H12.997L9.21167 12.1309L4.88031 17.0834H2.47724L8.08924 10.6648L2.16797 2.91675H7.12366L10.5453 7.44354L14.5028 2.91675ZM13.6598 15.6449H14.9906L6.40056 4.27966H4.97252L13.6598 15.6449Z" fill="#ADADB3" />
                    </svg>
                </a>
                <a href="https://discord.gg/WDmy7EmRZu" target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.3635 4.18569C15.159 3.63132 13.8874 3.23803 12.5811 3.01587C12.4024 3.33708 12.2407 3.66756 12.0966 4.00594C10.7053 3.79517 9.29038 3.79517 7.89905 4.00594C7.75493 3.6676 7.59321 3.33712 7.41454 3.01587C6.10752 3.2399 4.83508 3.63413 3.62936 4.18859C1.23568 7.74878 0.586784 11.2205 0.911226 14.643C2.31303 15.6842 3.88204 16.476 5.55007 16.9841C5.92566 16.4763 6.25801 15.9376 6.54359 15.3736C6.00117 15.1699 5.47763 14.9187 4.97904 14.6228C5.11027 14.5271 5.2386 14.4285 5.36261 14.3329C6.81338 15.0187 8.39679 15.3743 10 15.3743C11.6032 15.3743 13.1866 15.0187 14.6374 14.3329C14.7629 14.4358 14.8912 14.5344 15.021 14.6228C14.5215 14.9192 13.997 15.1709 13.4535 15.3751C13.7388 15.9388 14.0711 16.477 14.447 16.9841C16.1165 16.4781 17.6867 15.6866 19.0888 14.6445C19.4695 10.6755 18.4385 7.23563 16.3635 4.18569ZM6.95455 12.5383C6.05043 12.5383 5.30349 11.7134 5.30349 10.6987C5.30349 9.68402 6.02448 8.85194 6.95167 8.85194C7.87886 8.85194 8.62004 9.68402 8.60421 10.6987C8.58829 11.7134 7.87598 12.5383 6.95455 12.5383ZM13.0455 12.5383C12.1399 12.5383 11.3959 11.7134 11.3959 10.6987C11.3959 9.68402 12.1168 8.85194 13.0455 8.85194C13.9741 8.85194 14.7095 9.68402 14.6936 10.6987C14.6778 11.7134 13.9669 12.5383 13.0455 12.5383Z" fill="#ADADB3" />
                    </svg>
                </a>

            </div>
        </div>

        <div className={Styles.LinksContainer}>
            <span>Home</span>
            <Link href={"/#features"}>
                <a>Features</a>
            </Link>
            <Link href={"/#buy"}>
                <a>Product</a>
            </Link>
            <Link href={"/#contact"}>
                <a>Contact</a>
            </Link>
        </div>

        <div className={Styles.LinksContainer}>
            <span>Resources</span>
            <Link href={"/dashboard"}>
                <a>Dashboard</a>
            </Link>
            <Link href={"/#contact"}>
                <a>Support Group</a>
            </Link>
        </div>
        <div className={Styles.LinksContainer}>
            <span>Company</span>
            <Link href={'/legal/terms-conditions.html'}>
                <a target={"_blank"} >Terms and Conditions</a>
            </Link>
            <Link href={'/legal/privacy-policy.html'}>
                <a target={"_blank"}>Privacy Policy</a>
            </Link>

        </div>
    </div >
}

export function NavBar () {
    const router = useRouter()
    const session = useSession()

    return <div className={Styles.Navbar}>
        <div onClick={() => router.push("/")} className={Styles.Logo}>
            <Image src="/logo.png" width="137" height="25" />
        </div>
        <div className={Styles.Links}>
            <Link href={"/#buy"}>
                <a>Purchase</a>
            </Link>
            <Link href={"/guides"}>
                <a>Guides</a>
            </Link>
            <Link href={"/faq"}>
                <a>FAQ</a>
            </Link>
            <Link href={"/#contact"}>
                <a>Contact</a>
            </Link>
        </div>
        <div className={Styles.NavButton}>
            {(
                session.status === "authenticated"
                    ? <Link href="/dashboard"><a>Dashboard</a></Link>
                    : <Link href="/signin"><a>Log In</a></Link>
            )}
        </div>
    </div>
}

function PurchaseSection ({ products, availability }) {

    const [checkOutData, setCheckOutData] = useState(false)

    const [category, setCategory] = useState('')
    const [type, setType] = useState('')
    const [form, setForm] = useState({ country: { value: "", label: "" }, type: { value: "", label: "" }, option: { value: "", label: "" }, period: -1, quantity: 0, })
    const router = useRouter()

    useEffect(() => {

        if (router.query.buy)
            document.querySelector('#buy').scrollIntoView({ behavior: 'smooth', block: 'start' })

        if (router.query.ref) {
            const refId = router.query.ref
            const storedRefIf = localStorage.getItem('ref')
            if (!storedRefIf || storedRefIf != refId) {
                localStorage.setItem('ref', refId)
                sendEvent('CLICK_REGISTERED', refId)
            }
        }

        window.history.replaceState({}, document.title, router.route)

    }, [router])

    const onCategoryChange = category => e => {
        setCategory(category)
        setForm({ country: { value: "", label: "" }, type: { value: "", label: "" }, option: { value: "", label: "" }, period: -1, quantity: 0, })
    }

    const onTypeChange = type => e => {
        setType(type)
        setForm({ country: { value: "", label: "" }, type: { value: "", label: "" }, option: { value: "", label: "" }, period: -1, quantity: 0, })
    }

    const getProductFilters = productFilters => {
        const filters = {}
        const tempFilters = productFilters?.toLowerCase()?.split(";")?.map(e => e?.trim())
        if (!tempFilters)
            return false

        for (let filter of tempFilters) {
            const [key, value] = filter.split(":").map(e => e?.trim())
            filters[key] = value?.trim()
        }


        return filters
    }

    const filteredByType = useMemo(() => {
        return availability?.[type?.toUpperCase()]
    }, [availability, type])

    const filteredByCategory = filteredByType?.filter(product => {
        const filters = getProductFilters(product.productFilter)
        const categories = filters?.category?.split(",").map(e => e?.trim()?.toLowerCase())
        return categories?.includes(category)
    })

    const availableCountries = useMemo(() => {

        if (!["dc", "isp", "servers"].includes(type))
            return []

        const types = filteredByCategory?.map(product => {
            const filters = getProductFilters(product.productFilter)
            return filters?.country
        })

        return [...new Set(types)]
    }, [type, category, filteredByType, filteredByCategory])



    const filteredByCountry = useMemo(() => {

        if (!["dc", "isp", "servers"].includes(type) || !form?.country?.value)
            return []

        return filteredByCategory.filter(product => {
            const filters = getProductFilters(product.productFilter)
            return filters?.country === form?.country?.value
        })
    }, [type, category, filteredByCategory])

    const availableTypes = useMemo(() => {

        if (!["dc", "isp", "servers"].includes(type))
            return []

        const types = filteredByCountry?.map(product => {
            const filters = getProductFilters(product.productFilter)
            return filters?.type
        })

        return [...new Set(types)]
    }, [form?.country, type, filteredByCountry])

    const filteredByInnerType = useMemo(() => {

        if (!["dc", "isp", "servers"].includes(type) || !form?.country?.value || !form?.type?.value)
            return []


        return filteredByCountry?.filter(product => {
            const filters = getProductFilters(product.productFilter)
            return filters?.type === form?.type?.value
        })
    }, [form?.type, form?.country, type, filteredByCountry])

    const onFormChange = (key) => (e) => {

        switch (key) {
            case "country": {
                setForm(prev => ({
                    ...prev,
                    [key]: e?.target?.value || e,
                    type: { value: "", label: "" },
                    option: { value: "", label: "" },
                    period: -1,
                    quantity: 0,
                }))
                break
            }
            case "type": {

                const filtered = filteredByCountry?.filter(product => {
                    const filters = getProductFilters(product.productFilter)
                    return filters?.type === e?.value
                })

                const product = filtered?.length === 1 ? filtered[0] : null

                setForm(prev => ({
                    ...prev,
                    [key]: e?.target?.value || e,
                    option: product ? {
                        label: product?.productTitle,
                        value: product?.productName
                    } : {
                        value: "",
                        label: ""
                    },
                    period: -1,
                    quantity: !product ? 0 : e?.value === "subnet" ? 1 : 10,
                }))
                break
            }
            case "option": {
                setForm(prev => ({
                    ...prev,
                    [key]: e?.target?.value || e,
                    quantity: type === "servers" ? 1 : type === "resi" ? evaluatePricing(products?.[e?.target?.value || e?.value]?.productPricing)?.min ?? 2 : prev?.type?.value === "subnet" ? 1 : 10,
                }))
                break
            }
            default: {
                setForm(prev => ({
                    ...prev,
                    [key]: e?.target?.value || e
                }))
                break
            }
        }

    }


    const variables = evaluatePricing(products?.[form.option?.value]?.productPricing)
    const maxPeriod = Object.keys(variables?.periods ?? {}).length - 1
    const ispMaxPeriodLength = Object.keys(variables?.periods ?? {})?.length
    const ispMaxPeriod = ispMaxPeriodLength - 1


    if (["isp", "dc", "servers"].includes(type) && ispMaxPeriod !== -1 && form.period === -1) {
        setForm(prev => ({ ...prev, period: ispMaxPeriod }))
    }

    if (type === "resi" && !form.quantity && form?.option?.value) {
        setForm(prev => ({ ...prev, quantity: variables?.min ?? 2 }))
    }

    if (type === "resi" && !form?.option?.value && filteredByCategory?.length === 1) {
        const product = filteredByCategory?.length === 1 ? filteredByCategory[0] : null
        setForm(prev => ({
            ...prev, option: product ? {
                label: product?.productTitle,
                value: product?.productName
            } : {
                value: "",
                label: ""
            },
        }))
    }

    const pricing = getPricing(variables, form?.quantity, Object.keys(variables?.periods ?? {})?.[form?.period] ?? variables.defaultPeriod)?.toFixed(2)

    const purchase = () => {
        const product = products?.[form?.option?.value]
        if (!product)
            return

        if (!form?.option?.value || !product?.productStock)
            return

        const payload = {
            isp: type === "isp" || type === "dc",
            vip: false,
            resi: type === "resi",
            product: product,
            server: type === "servers",
            account: type === "accounts",
            main: true,
            renewal: false,
            //referral: vip && referral,
            //trial: vip && !userPreviousVip && trialToggle && trialDays,
            data: {
                selectedPeriod: ["resi", "servers"].includes(type) ? 0 : form?.period,
                quantity: form?.quantity,
                dispatchTime: undefined
            }
        }


        setCheckOutData(payload)
    }

    const checkoutModal = checkOutData ? <Checkout setCheckOutData={setCheckOutData} checkOutData={checkOutData} /* userPoints={userPoints} */ /> : null

    return (
        <>
            {checkoutModal}
            <div id="buy" className={Styles.PurchaseSection}>

                <div className={Styles.Categories}>
                    <div onClick={onCategoryChange('events')} className={category === "events" ? Styles.Highlight : undefined}>
                        <p>Events</p>
                        <span>Concerts, shows & sports</span>
                    </div>
                    <div onClick={onCategoryChange('sneakers')} className={category === "sneakers" ? Styles.Highlight : undefined}>
                        <p>Retail</p>
                        <span>Sneakers, clothes & collectibles</span>
                    </div>
                    <div onClick={onCategoryChange('general')} className={category === "general" ? Styles.Highlight : undefined}>
                        <p>General</p>
                        <span>Data scraping, SEO & more</span>
                    </div>



                </div>


                <div className={Styles.Types}>
                    <div onClick={onTypeChange('resi')} className={type === "resi" ? Styles.Highlight : undefined}>
                        <p>Residential Proxies</p>
                    </div>
                    <div onClick={onTypeChange('isp')} className={type === "isp" ? Styles.Highlight : undefined}>
                        <p>ISP Proxies</p>
                    </div>
                    <div onClick={onTypeChange('dc')} className={type === "dc" ? Styles.Highlight : undefined}>
                        <p>Datacenter Proxies</p>
                    </div>
                    <div onClick={onTypeChange('servers')} className={type === "servers" ? Styles.Highlight : undefined}>
                        <p>Servers</p>
                    </div>
                </div>

                <div className={Styles.PurchaseCard} style={{ minHeight: !type || !category ? "783px !important" : undefined }}>
                    <div className={Styles.InnerContent}>

                        {
                            !type || !category ?
                                <h3>
                                    Choose your {!category ? "industry" : "product type"}
                                </h3> :
                                <>
                                    <p className={Styles.TypeTitle}>
                                        {{ "isp": "ISP Proxies", "resi": "Residential Proxies", "dc": "DC Proxies", "servers": "Servers" }[type]}
                                    </p>
                                    <span className={Styles.TypeDescription}>

                                        {type === "isp" ? "Announced on residential networks for quality but hosted in datacenters for speed"
                                            : type === "resi" ? "Large global networks of residential IP addresses billed by data usage"
                                                : type === "dc" ? "Announced and hosted in datacenter networks for reliability and speed"
                                                    : type === "servers" ? "Remote machines allowing for closer proximity to your proxies"
                                                        : "Routes traffic through a provider for fast, secure connections"}

                                    </span>

                                    <div className={Styles.Pricing}>

                                        <p className={Styles.PricePerUnit}>
                                            ${(pricing && form?.quantity ? pricing / form.quantity : 0).toFixed(2)}
                                        </p>
                                        <span className={Styles.PerUnit}>
                                            per {form?.type?.value == "subnet" ? "Subnet" : ["dc", "isp"].includes(type) ? "IP" : type === "servers" ? "Server" : type === "resi" ? "GB" : "Unit"}
                                        </span>

                                        <div className={Styles.Total}>
                                            <p>
                                                ${pricing}{
                                                    type !== "resi"
                                                        ? (
                                                            (Object.keys(variables?.periods ?? {})?.[form?.period] ?? 0) == 7
                                                                ? "/week"
                                                                : (Object.keys(variables?.periods ?? {})?.[form?.period] ?? 0) == 30
                                                                    ? "/month"
                                                                    : (Object.keys(variables?.periods ?? {})?.[form?.period] ?? 0) > 0
                                                                        ? "/" + (Object.keys(variables?.periods ?? {})?.[form?.period] ?? 0) + " days"
                                                                        : ""
                                                        )
                                                        : ""
                                                }
                                            </p>
                                        </div>
                                    </div>


                                    <p className={Styles.Hint}>
                                        {variables?.ranges?.length > 0 && !variables?.ranges?.every(range => range.multiplier === variables?.ranges[0]?.multiplier) ? "* Increase quantity for discounted rate" : ""}
                                    </p>


                                    <div className={Styles.Selects}>

                                        {type !== "resi" && <Select
                                            options={[
                                                ...availableCountries
                                                    ?.sort((a, b) => a.toLowerCase() === "united states" ? -1 : b.toLowerCase() === "united states" ? 1 : 0)
                                                    ?.map(e => ({ value: e, label: e.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) }))
                                            ]}
                                            onChange={onFormChange("country")}
                                            value={form.country}
                                            styles={SelectStyles}
                                            theme={SelectTheme}
                                            components={{ SingleValue: InnerSingleValue("Country") }}
                                            placeholder={""}
                                            isSearchable={false}
                                            isClearable={false}
                                        /> || null}

                                        {type !== "resi" && form?.country?.value &&
                                            <Select
                                                options={[
                                                    ...availableTypes?.map(e => ({ value: e, label: e.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) }))
                                                ]}
                                                onChange={onFormChange("type")}
                                                value={form.type}
                                                styles={SelectStyles}
                                                theme={SelectTheme}
                                                components={{ SingleValue: InnerSingleValue("Type") }}
                                                placeholder={""}
                                                isSearchable={false}
                                                isClearable={false}
                                            />
                                            || null}

                                        {(type === "resi" || (type !== "resi" && form?.country?.value && form?.type?.value)) && <Select
                                            options={type === "resi" ? [
                                                ...filteredByCategory
                                                    ?.sort((a, b) => a.productTitle.toLowerCase() === "evolve" ? -1 : b.productTitle.toLowerCase() === "evolve" ? 1 : 0)
                                                    ?.map(e => ({ value: e.productName, label: e.productTitle }))] : [
                                                ...filteredByInnerType?.map(e => ({ value: e.productName, label: e.productTitle }))
                                            ]}
                                            onChange={onFormChange("option")}
                                            value={form.option}
                                            styles={SelectStyles}
                                            theme={SelectTheme}
                                            components={{ SingleValue: InnerSingleValue("Product") }}
                                            placeholder={""}
                                            isSearchable={false}
                                            isClearable={false}
                                        /> || null}

                                    </div>


                                    <div className={Styles.Description}>
                                        {products?.[form?.option?.value]?.productDescription?.split("\n")?.map((e, key) => (
                                            <p key={key}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M15.2932 2.26171C15.609 2.4927 15.6776 2.9359 15.4467 3.25163L7.15499 14.585C7.04119 14.7405 6.86891 14.843 6.6779 14.8687C6.48689 14.8944 6.29364 14.8412 6.14273 14.7213L1.68439 11.1797C1.37808 10.9363 1.32702 10.4908 1.57036 10.1845C1.81369 9.87814 2.25927 9.82709 2.56558 10.0704L6.44683 13.1537L14.3033 2.41514C14.5343 2.09941 14.9775 2.03072 15.2932 2.26171Z" fill="#FF5600" />
                                                </svg>

                                                {e}
                                            </p>
                                        ))}


                                    </div>


                                    <div className={Styles.Sliders}>
                                        <div className={Styles.SliderContainer}>
                                            <p>
                                                Quantity
                                            </p>
                                            <div className={Styles.Slider}>
                                                <Slider min={variables?.min ?? 0} max={variables?.max} step={type == "resi" ? 1 : form?.type?.value?.toLowerCase()?.includes("subnet") ? 1 : 5} value={form.quantity} {...sliderStyles} onChange={onFormChange("quantity")} disabled={!form?.option?.value} />
                                            </div>
                                            <p style={{ textAlign: "right" }}>
                                                {form?.quantity} {type === "resi" ? "GB" : type === "servers" ? "Server" : form?.type?.value?.toLowerCase()?.includes("subnet") ? "Subnet" : "IP"}{(form?.quantity > 1 ? "s" : "")}
                                            </p>
                                        </div>

                                        {!["resi", "servers"].includes(type) && Object.keys(variables?.periods ?? {})?.length > 1 && <div className={Styles.SliderContainer}>
                                            <p>
                                                Period
                                            </p>
                                            <div className={Styles.Slider}>
                                                <Slider min={0} max={maxPeriod} step={1} defaultValue={form?.period} {...sliderStyles} onChange={onFormChange("period")} disabled={!form?.option?.value} />
                                            </div>
                                            <p style={{ textAlign: "right" }}>
                                                {Object.keys(variables?.periods ?? {})?.[form?.period] ?? 0} Days
                                            </p>
                                        </div> || null}


                                    </div>

                                    {form?.option?.value ? <div className={Styles.Purchase} onClick={purchase} disabled={!form?.option?.value || !products?.[form?.option?.value]?.productStock}>
                                        <p>
                                            {form?.option?.value && products?.[form?.option?.value]?.productStock ? "Purchase" : "Sold Out"}
                                        </p>
                                    </div> : null}
                                </>
                        }
                    </div>


                </div>
            </div >
        </>
    )
}

export async function getServerSideProps ({ req, res }) {

    const products = await prisma.product.findMany({
        where: {
            productActive: 1,
            productHomepage: 1,
            productSite: CURRENT_SITE
        },
        include: {
            productOrders: false,
            productPages: false
        }
    })

    const serialized = {}
    for (let product of products) {
        serialized[product.productName] = {
            ...product,
            productStock: product.productStock > 0
        }
    }


    const availability = {
        "SERVERS": products?.filter(e => e.productServer && e.productStock >= 0)?.map(e => ({ productName: e.productName, productTitle: e.productTitle, productPool: e.productPool, productFilter: e.productFilter })),
        "RESI": products?.filter(e => e.productResi && !["CAPTCHA", "PORTER_VIP"].includes(e.productPool) && e.productStock >= 0)?.map(e => ({ productName: e.productName, productTitle: e.productTitle, productVip: e.productVip, productFilter: e.productFilter })),
        "ISP": products?.filter(e => (e.productPool.startsWith("ISP_") || e.productPool.startsWith("SN_")) && !e.productPool.endsWith("_DC") && !e.productAccount && !e.productServer && !e.productResi && !["PORTER_VIP"].includes(e.productPool) && e.productStock >= 0)?.map(e => ({ productName: e.productName, productTitle: e.productTitle, productFilter: e.productFilter })),
        "DC": products?.filter(e => (e.productPool.startsWith("DC_") || e.productPool.endsWith("_DC")) && !e.productAccount && !e.productServer && !e.productResi && !["PORTER_VIP"].includes(e.productPool) && e.productStock >= 0)?.map(e => ({ productName: e.productName, productTitle: e.productTitle, productFilter: e.productFilter })),

    }

    return {
        props: {
            products: serialized,
            availability,
        }
    }

}