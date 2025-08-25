

import { NavBar } from "../components/navbar"

import Styles from "../styles/user/Newsletter.default.module.scss"

import { getSession, useSession } from "next-auth/react"

import Head from "next/head"
import { prisma } from "../helpers/database"

import { GoAlert } from "react-icons/go"
import Link from "next/link"
import { CURRENT_SITE } from "../helpers/sites"
import { useEffect, useState } from "react"
import ReactSwitch from "react-switch"
import { toastLoader } from "../helpers/notifications"

export default function Newsletter ({ resiLinks, phoneApiKey, phoneWebhook, ptWebhook, insomniacWebhook, automatiqWebhook }) {

    const session = useSession()
    const [loading, setLoading] = useState(false)
    const [opt, setOpt] = useState(false)
    const [otpState, setOtpState] = useState(false)
    const [emailState, setEmailState] = useState("")

    const [phoneApiKeyState, setPhoneApiKeyState] = useState(phoneApiKey)
    const [phoneWebhookState, setPhoneWebhookState] = useState(phoneWebhook)
    const [ptWebhookState, setPtWebhookState] = useState(ptWebhook)
    const [insomniacWebhookState, setInsomniacWebhookState] = useState(insomniacWebhook)
    const [automatiqWebhookState, setAutomatiqWebhookState] = useState(!!automatiqWebhook)

    useEffect(() => {
        if (session.status !== "loading") {
            setLoading(false)
            setOpt(!!session?.data?.user?.newsletter)
            setOtpState(!!session?.data?.user?.otpState)
            setEmailState(session?.data?.user?.secondEmail)
        }
    }, [session])

    const changeOptState = async checked => {

        setLoading(true)
        const { toastSuccess, toastError } = toastLoader(`${checked ? 'Opting in to' : 'Opting out of'} the Wired newsletter.`)

        try {

            const res = await fetch("/api/newsletter", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newsletter: +checked
                })

            }).then(res => res.json())

            if (!res.ok) {
                setLoading(false)
                toastError(res.message)
                return
            }

            setOpt(checked)
            setLoading(false)
            toastSuccess(`${checked ? 'Opted in to' : 'Opted out of'} the Wired newsletter.`)

        } catch (error) {
            setLoading(false)
            toastError(error.message)
        }
    }

    const changeOtpState = async checked => {

        setLoading(true)
        const { toastSuccess, toastError } = toastLoader(`${checked ? 'Opting in to' : 'Opting out of'} the 2fa authentication.`)

        try {

            const res = await fetch("/api/otpState", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    otpState: +checked
                })

            }).then(res => res.json())

            if (!res.ok) {
                setLoading(false)
                toastError(res.message)
                return
            }

            setOtpState(checked)
            setLoading(false)
            toastSuccess(`${checked ? 'Opted in to' : 'Opted out of'} the 2fa authentication.`)

        } catch (error) {
            setLoading(false)
            toastError(error.message)
        }
    }


    const changeEmailState = async e => {

        setLoading(true)
        const { toastSuccess, toastError } = toastLoader(`Setting alternative login and communication email...`)

        if (session?.data?.user?.secondEmail?.toLowerCase() == emailState.toLowerCase())
            return toastError("This alternate email is already set.")

        try {

            const res = await fetch("/api/secondEmail", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    secondEmail: emailState
                })

            }).then(res => res.json())

            if (!res.ok) {
                setLoading(false)
                toastError(res.message)
                return
            }

            setLoading(false)
            toastSuccess(emailState ? `Set alternate email to ${emailState}` : `Cleared alternate email.`)

        } catch (error) {
            setLoading(false)
            toastError(error.message)
        }
    }


    const changeFieldState = field => async e => {

        setLoading(true)
        const { toastSuccess, toastError } = toastLoader(`Saving field...`)

        let value = ''
        switch (field) {

            case "phoneWebhook": {
                value = phoneWebhookState
                break
            }

            case "ptWebhook": {
                value = ptWebhookState
                break
            }

            case "insomniacWebhook": {
                value = insomniacWebhookState
                break
            }

            case "automatiqWebhook": {
                value = e
                break
            }

            default: {
                return toastError("Invalid field provided..")
            }
        }
        try {

            const res = await fetch("/api/phone_settings", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    field: field,
                    value: value,
                })

            }).then(res => res.json())

            if (!res.ok) {
                setLoading(false)
                toastError(res.message)
                return
            }

            setLoading(false)
            toastSuccess(`Saved data to the field.`)

            if (field == "automatiqWebhook") {
                setAutomatiqWebhookState(e)
            }

        } catch (error) {
            setLoading(false)
            toastError(error.message)
        }
    }

    return (
        <>
            <Head>
                <title>Wired - Settings</title>
            </Head>

            <NavBar resiLinks={resiLinks} />
            <div className={Styles.container}>
                <div className={Styles.subContainer2}>
                    <p style={{ marginTop: "0px" }}>Newsletter</p>
                    <ReactSwitch
                        checked={opt}
                        disabled={loading}
                        onChange={changeOptState}
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

                <div className={Styles.subContainer2}>
                    <p style={{ marginTop: "0px" }}>Account 2FA</p>
                    <ReactSwitch
                        checked={otpState}
                        disabled={loading}
                        onChange={changeOtpState}
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



                <div className={Styles.subContainer2} style={{ marginBottom: "0px" }}>
                    <p style={{ marginTop: "0px" }}>Alternate login email</p>
                    <div>
                        <input
                            name={"email"}
                            type={"email"}
                            disabled={loading}
                            placeholder="Alternate Email"
                            onChange={e => setEmailState(e.target.value)}
                            value={emailState}
                        />
                        <button className={Styles.set} disabled={loading} onClick={changeEmailState}>
                            <p>
                                Set
                            </p>
                        </button>
                    </div>
                </div>


                <div className={Styles.subContainer2} style={{ marginBottom: "0px" }}>
                    <p style={{ marginTop: "0px" }}>Phone API Key: </p>
                    <div>
                        <input
                            name={"phoneApiKey"}
                            type={"text"}
                            disabled={true}
                            placeholder="Phone API Key"
                            onChange={e => setPhoneApiKeyState(e.target.value)}
                            value={phoneApiKeyState}
                        />
                        <button className={Styles.set} disabled={loading} onClick={() => {
                            const { toastSuccess, toastError } = toastLoader(`Copying..`)

                            navigator.clipboard.writeText(phoneApiKeyState || '').then(() => {
                                toastSuccess(`Copied phone API key to clipboard!`)
                            }).catch(err => {
                                console.error("Failed to copy!", err)
                                toastError(`Failed to copy.. please make sure permissions to write to clipboard is set.`)
                            })
                        }}>
                            <p>
                                Copy
                            </p>
                        </button>
                    </div>
                </div>

                <div className={Styles.subContainer2} style={{ marginBottom: "0px" }}>
                    <p style={{ marginTop: "0px" }}>Integration - Custom/Discord/Slack: </p>
                    <div>
                        <input
                            name={"phoneWebhook"}
                            type={"text"}
                            disabled={loading}
                            placeholder="Webhook"
                            onChange={e => setPhoneWebhookState(e.target.value)}
                            value={phoneWebhookState}
                        />
                        <button className={Styles.set} disabled={loading} onClick={changeFieldState("phoneWebhook")}>
                            <p>
                                Set
                            </p>
                        </button>
                    </div>
                </div>

                <div className={Styles.subContainer2} style={{ marginBottom: "0px" }}>
                    <p style={{ marginTop: "0px" }}>Integration - Private Tabs: </p>
                    <div>
                        <input
                            name={"ptWebhook"}
                            type={"text"}
                            disabled={loading}
                            placeholder="API Key"
                            onChange={e => setPtWebhookState(e.target.value)}
                            value={ptWebhookState}
                        />
                        <button className={Styles.set} disabled={loading} onClick={changeFieldState("ptWebhook")}>
                            <p>
                                Set
                            </p>
                        </button>
                    </div>
                </div>

                <div className={Styles.subContainer2} style={{ marginBottom: "0px" }}>
                    <p style={{ marginTop: "0px" }}>Integration - Insomniac: </p>
                    <div>
                        <input
                            name={"insomniacWebhook"}
                            type={"text"}
                            disabled={loading}
                            placeholder="API Key"
                            onChange={e => setInsomniacWebhookState(e.target.value)}
                            value={insomniacWebhookState}
                        />
                        <button className={Styles.set} disabled={loading} onClick={changeFieldState("insomniacWebhook")}>
                            <p>
                                Set
                            </p>
                        </button>
                    </div>
                </div>


                <div className={Styles.subContainer2} style={{ marginBottom: "30px" }}>
                    <p style={{ marginTop: "0px" }}> Integration - Automatiq:</p>
                    <ReactSwitch
                        checked={automatiqWebhookState}
                        disabled={loading}
                        onChange={changeFieldState("automatiqWebhook")}
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
                <div className={Styles.subContainer}>
                    <Link href="/">
                        <a>
                            Homepage
                        </a>
                    </Link>
                    <Link href="/guides">
                        <a>
                            Guides
                        </a>
                    </Link>
                    <Link href="/dashboard">
                        <a>
                            Dashboard
                        </a>
                    </Link>
                    <Link href="/?buy">
                        <a>
                            Purchase
                        </a>
                    </Link>
                </div>
            </div >

        </>
    )
}

export async function getServerSideProps ({ req, res, query }) {

    const session = await getSession({ req })
    if (!session || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const customer = await prisma.customer.findUnique({
        where: {
            customerId: session.user.customerId
        }
    })


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
            resiLinks: resiProducts?.map(e => ({ label: e.productTitle, id: e.productName, vip: e.productVip })) ?? [],
            phoneApiKey: customer.phoneApiKey,
            phoneWebhook: customer.phoneWebhook,
            ptWebhook: customer.ptWebhook,
            insomniacWebhook: customer.insomniacWebhook,
            automatiqWebhook: customer.automatiqWebhook
        }
    }
}