
import { getSession, useSession } from "next-auth/react"
import { useState, useEffect, useMemo } from "react"

import { toast } from 'react-toastify'

import Head from "next/head"
import Image from "next/image"
import Link from "next/link"

import dayjs from "dayjs"
import { useRouter } from "next/router"

import { CURRENT_SITE } from "../helpers/sites"
import Styles from "../styles/user/Index.module.scss"
import { Footer, NavBar } from "."

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { prisma } from "../helpers/database"



export default function FAQs ({ FAQs }) {

    const router = useRouter()
    const session = useSession()

    const [filter, setFilter] = useState("")

    const Faq = ({ title, content }) => {
        const [opened, setOpened] = useState(false)
        const toggle = () => setOpened(!opened)
        const Plus = <svg style={{ display: "inline-flex", marginLeft: "auto" }} width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_69_35)">
                <path d="M13.2 8V13.2M13.2 13.2V18.4M13.2 13.2H8M13.2 13.2H18.4" stroke="#5C5C68" stroke-width="2" stroke-linecap="round" />
                <path d="M22.36 1.04004H3.64004C2.2041 1.04004 1.04004 2.2041 1.04004 3.64004V22.36C1.04004 23.796 2.2041 24.96 3.64004 24.96H22.36C23.796 24.96 24.96 23.796 24.96 22.36V3.64004C24.96 2.2041 23.796 1.04004 22.36 1.04004Z" stroke="#E9E9E9" />
            </g>
            <defs>
                <clipPath id="clip0_69_35">
                    <rect width="26" height="26" fill="white" />
                </clipPath>
            </defs>
        </svg>


        const Minus = <svg style={{ display: "inline-flex", marginLeft: "auto" }} width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_69_35)">
                <path d="M22.36 1.04004H3.64004C2.2041 1.04004 1.04004 2.2041 1.04004 3.64004V22.36C1.04004 23.796 2.2041 24.96 3.64004 24.96H22.36C23.796 24.96 24.96 23.796 24.96 22.36V3.64004C24.96 2.2041 23.796 1.04004 22.36 1.04004Z" stroke="#E9E9E9" />
                <path d="M8 13H18" stroke="#5C5C68" stroke-width="2" stroke-linecap="round" />
            </g>
            <defs>
                <clipPath id="clip0_69_35">
                    <rect width="26" height="26" fill="white" />
                </clipPath>
            </defs>
        </svg>

        const parseMarkdownLinks = content => {
            const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g
            return content.replace(linkRegex, (match, text, url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
            })
        }

        return <div className={Styles.Item}>
            <div
                className={Styles.Title}
                onClick={toggle}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21V3H5V21L12 17L19 21Z" stroke="black" stroke-width="2" stroke-linecap="round" />
                </svg>

                <p>{title}</p>

                {opened ? Minus : Plus}
            </div>
            <div
                className={`${Styles.Description} ${opened ? Styles.Active : ''}`}
            >
                <span dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(content) }} />
            </div>
        </div>
    }


    const filteredFAQs = !filter ? FAQs : FAQs.filter(e => e.faqTitle.toLowerCase().includes(filter.toLowerCase()) || e.faqContent.toLowerCase().includes(filter.toLowerCase()))
    return <>
        <Head>
            <title>Wired - Frequently Asked Questions</title>
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
            <div className={Styles.FaqHero}>
                <div className={Styles.FaqHeroLeft}>
                    <h1>
                        Frequently Asked Questions
                    </h1>

                    <p>
                        Your questions answered to help you navigate the world of proxies with <br /> confidence and ease.
                    </p>

                    <div className={Styles.SearchBox}>

                        <input type="text" placeholder="Search FAQ" value={filter} onChange={(e) => setFilter(e.target.value)} />

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 20L16.05 16.05M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" stroke="#5C5C68" stroke-width="2" stroke-linecap="round" />
                            <path d="M20 20L16.05 16.05M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" stroke="white" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round" />
                        </svg>

                    </div>

                    <p className={Styles.BottomText}>
                        Can&apos;t find your answer?
                        <Link href={"/#contact"}><a>Contact Support</a></Link>
                    </p>

                </div>

                <div className={Styles.Graphic}></div>
            </div>

            <div className={Styles.FaqContainer}>

                {filteredFAQs?.sort((a, b) => a.faqOrder - b.faqOrder)?.map((FAQ, idx) =>
                    <Faq key={idx} title={FAQ.faqTitle} content={FAQ.faqContent} />
                )}

            </div>

            <Footer />
        </div>

    </>

}

export async function getServerSideProps ({ req, query }) {

    const FAQs = await prisma.fAQ.findMany({
        where: {
            faqSite: CURRENT_SITE
        }
    })

    return {
        props: {
            FAQs: FAQs.map(e => ({ ...e, createdAt: +e.createdAt })),
        }
    }
}