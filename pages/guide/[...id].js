
import { getSession, useSession } from "next-auth/react"
import { useState, useEffect, useMemo } from "react"

import { toast } from 'react-toastify'

import Head from "next/head"
import Image from "next/image"
import Link from "next/link"

import dayjs from "dayjs"
import { useRouter } from "next/router"

import { CURRENT_SITE } from "../../helpers/sites"
import Styles from "../../styles/user/Index.module.scss"
import { Footer, NavBar } from "../."

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { prisma } from "../../helpers/database"



export default function Guide ({ markdown }) {

    const router = useRouter()
    const { query, route, } = router
    const [loading, setLoading] = useState(true)

    return <>
        <Head>
            <title>Wired - Guide</title>
            <style global={"true"}>{`
                    html, body {
                        background-color: white !important;
                        background: white !important;
                        margin: 0; /* Optional: Remove margin if needed */
                        padding: 0; /* Optional: Remove padding if needed */
                        color: #000 !important;
                        font-family: "SF Pro Display" !important;
                    }
                `}
            </style>
        </Head>
        <div className={Styles.Container}>
            <NavBar />
        </div>
        <div className={Styles.Border}></div>
        <div className={Styles.PaddedContainer}>
            <div className={Styles.GuideHero}>
                <div className={Styles.GuideHeroLeft}>
                    <h1>
                        Your guide to <br />
                        getting wired in.
                    </h1>

                    <p>
                        Comprehensive step-by-step guide on configuring and <br /> using Wired Proxies across various applications, ensuring <br /> seamless integration and optimal performance
                    </p>

                    <div className={Styles.CTA}>
                        <Link href={"/#buy"}>
                            <a>Purchase Now</a>
                        </Link>
                    </div>

                </div>

                <div className={Styles.Graphic}></div>
            </div>

            <div className={Styles.MarkdownContainer}>
                <MDXRemote {...markdown} />
            </div>

            <Footer />
        </div>

    </>

}

export async function getServerSideProps ({ req, query }) {

    const { id: [id] } = query
    if (!id) {
        return {
            redirect: {
                destination: '/guides',
                permanent: false
            }
        }
    }

    const guide = await prisma.guide.findUnique({
        where: {
            guideSlug: id
        }
    })

    if (!guide) {
        return {
            redirect: {
                destination: '/guides',
                permanent: false
            }
        }
    }

    const markdown = await serialize(guide.guideContent)

    return {
        props: {
            guide: {
                ...guide,
                createdAt: +guide.createdAt,
                guideContent: null
            },
            markdown
        }
    }
}