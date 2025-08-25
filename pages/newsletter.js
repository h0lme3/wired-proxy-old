

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

export default function Newsletter ({ resiLinks }) {

    const session = useSession()
    const [loading, setLoading] = useState(false)
    const [opt, setOpt] = useState(false)

    useEffect(() => {
        if (session.status !== "loading") {
            setLoading(false)
            setOpt(!!session?.data?.user?.newsletter)
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


    return (
        <>
            <Head>
                <title>Wired - Newsletter</title>
            </Head>

            <NavBar resiLinks={resiLinks} />
            <div className={Styles.container}>
                <div className={Styles.subContainer}>
                    <p style={{ marginTop: "0px" }}>Opt in to receive occasional newsletter?</p>
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

                <div className={Styles.subContainer}>
                    <Link href="/">
                        <a>
                            Homepage
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
            </div>

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
        }
    }
}