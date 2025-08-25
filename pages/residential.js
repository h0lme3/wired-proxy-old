

import { NavBar } from "../components/navbar"

import Styles from "../styles/user/Residential.default.module.scss"

import { getSession } from "next-auth/react"

import Head from "next/head"
import { prisma } from "../helpers/database"

import { GoAlert } from "react-icons/go"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { CURRENT_SITE } from "../helpers/sites"

export default function ResidentialDefault ({ resiLinks }) {

    const router = useRouter()
    const { message } = router.query

    useEffect(() => {

        window.history.replaceState({}, document.title, router.route)

    }, [router])


    return (
        <>
            <Head>
                <title>Wired - Residential</title>
            </Head>

            <NavBar resiLinks={resiLinks} />
            <div className={Styles.container}>
                <GoAlert
                    size={"80px"}
                    color={"#ff5600"}
                />
                <p>{message}</p>
                <div>
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

export async function getServerSideProps({ req, res, query}) {

    const session = await getSession({ req })
    if (!session || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    if (!query.message) {
        return {
            redirect: {
                destination: '/dashboard',
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