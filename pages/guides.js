
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
import { Footer, NavBar } from "."



export default function Guide ({ guides }) {

    const router = useRouter()
    const { query, route, } = router
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("")
    const GuideFilter = ({ label }) => {
        return <p onClick={() => setFilter(label)} className={filter === label ? Styles.Highlight : ""}>
            {label}
        </p>
    }

    const Guide = ({ icon, date, title, type, slug }) => {
        return <div className={Styles.Guide} onClick={() => router.push(`/guide/${slug}`)}>
            <div className={Styles.Background}></div>
            <div className={Styles.Head}>
                <img className={Styles.Icon} src={icon} width={"38"} height={"38"} />
                <span className={Styles.Date}>{date}</span>
            </div>
            <p>{title}</p>
            <span className={Styles.Type}>{type}</span>
        </div>
    }

    const uniqueFilters = useMemo(() => {
        const allFilters = guides.flatMap((guide) =>
            guide.guideFilters?.split(",").map((filter) => {
                return filter.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
            }) || []
        )
        return Array.from(new Set(allFilters))
    }, [guides])

    const filteredGuides = !filter
        ? guides
        : guides.filter((e) => {
            const filters = e.guideFilters
                ?.split(",")
                .map((filter) => filter.toLowerCase().trim())
            return filters?.includes(filter.toLowerCase())
        })



    return <>
        <Head>
            <title>Wired - Guides</title>
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

            <div className={Styles.GuidesSection}>

                <div className={Styles.Filters}>
                    <span>Sort by guide type</span>
                    {uniqueFilters.map((label, idx) => (
                        <GuideFilter key={idx} label={label} />
                    ))}
                </div>

                <div className={Styles.GuidesContainer}>
                    <div className={Styles.Header}>
                        <h3>Guides</h3>
                        {filter && <div className={Styles.AppliedFilter}>
                            <p>{filter}</p>
                            <svg onClick={() => setFilter("")} width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="10.5" fill="white" stroke="#E9E9E9" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.86189 5.86195C6.12224 5.6016 6.54435 5.6016 6.8047 5.86195L11 10.0572L15.1952 5.86195C15.4556 5.6016 15.8777 5.6016 16.138 5.86195C16.3984 6.1223 16.3984 6.54441 16.138 6.80476L11.9428 11L16.138 15.1953C16.3984 15.4556 16.3984 15.8777 16.138 16.1381C15.8777 16.3984 15.4556 16.3984 15.1952 16.1381L11 11.9428L6.8047 16.1381C6.54435 16.3984 6.12224 16.3984 5.86189 16.1381C5.60154 15.8777 5.60154 15.4556 5.86189 15.1953L10.0572 11L5.86189 6.80476C5.60154 6.54441 5.60154 6.1223 5.86189 5.86195Z" fill="#A6A6A6" />
                            </svg>

                        </div> || null}
                        <div className={Styles.GuidesCount}>
                            <p>
                                {filteredGuides?.length} Guides
                            </p>
                        </div>

                    </div>

                    <div className={Styles.Content}>

                        {filteredGuides.map((guide, idx) => {
                            return <Guide
                                key={idx}
                                title={guide.guideTitle}
                                icon={guide.guideIcon}
                                date={dayjs(guide.createdAt).format('MMM D, YYYY')}
                                type={guide.guideDescription}
                                slug={guide.guideSlug}
                            />
                        })}




                    </div>
                </div>

            </div>

            <Footer />
        </div>

    </>

}

export async function getServerSideProps ({ req, res }) {

    const guides = await prisma.guide.findMany({
        select: {
            guideSlug: true,
            guideDescription: true,
            guideFilters: true,
            guideIcon: true,
            guideTitle: true,
            createdAt: true
        },
        where: {
            guideSite: CURRENT_SITE
        }
    })

    return {
        props: {
            guides: guides.map(e => ({ ...e, createdAt: +e.createdAt })),
        }
    }

}