import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { withRouter } from 'next/router'
import { Component } from 'react'
import { toast } from "react-toastify"

import Hamburger from "./hamburger"
import Styles from "./navbar.module.scss"

import { FiChevronDown, FiChevronUp } from "react-icons/fi"
import { toastLoader } from "../../helpers/notifications"

function withSession (Component) {
    return function useSessionWrap (props) {
        const session = useSession()
        if (Component.prototype.render) {
            return <Component session={session} {...props} />
        }
    }
}

export default withRouter(withSession(class NavBar extends Component {

    constructor (props) {
        super(props)
        this.state = {
            menuActive: false,
            resiMenuActive: false,
        }
    }

    toggleMenu = () => {
        this.setState({ menuActive: !this.state.menuActive })
    }

    toggleResiMenu = (toggle = undefined) => (e) => {
        this.setState({ resiMenuActive: typeof toggle === "undefined" ? !this.state.resiMenuActive : toggle })
    }

    logOut = () => {

        toast.loading("Signing out..", { autoClose: 3000 })

        signOut({
            redirect: true,
            callbackUrl: "/signin"
        })
    }

    redirectToPortal = async (e) => {

        try {

            if (this.state.submitting)
                return

            this.setState({ submitting: true })

            const { toastSuccess, toastError } = toastLoader(`Redirecting to billing portal...`)

            const res = await fetch("/api/subscription/portal", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                this.setState({ submitting: false })
                return
            }

            window.location.href = res.redirect

        } catch (error) {
            toastError(error.message)
            this.setState({ submitting: false })
        }

    }

    render () {
        const { menuActive, resiMenuActive } = this.state
        const { router, session } = this.props

        const { resiLinks } = this.props
        const fullName = session?.data?.user ? session?.data?.user?.firstName + ' ' + session?.data?.user?.lastName : ""

        const resiMenuStyles = [Styles.resiMenu, resiMenuActive ? Styles.resiMenuShow : undefined].join(" ")
        const linkStyles = [Styles.links, menuActive ? Styles.active : undefined].join(" ")
        const adminLink = session?.data?.user?.admin ? (
            <Link href={'/admin/statistics'}>
                <a className={router.route === '/admin/statistics' ? Styles.active : undefined}>
                    Admin
                </a>
            </Link>
        ) : null

        const prLink = !session?.data?.user?.admin && session?.data?.user?.adminType === 'PR' ? (
            <Link href={'/stats/sales'}>
                <a className={router.route === '/stats/sales' ? Styles.active : undefined}>
                    Sales
                </a>
            </Link>
        ) : null


        return (
            <nav className={Styles.navbarContainer}>
                <div className={Styles.container}>

                    <div className={Styles.navigation}>

                        <div onClick={() => router.push("/")} className={Styles.logo}>
                            <Image src="/logo.svg" width="87" height="30" />
                        </div>

                        <Hamburger className={Styles.hamburger} menuActive={menuActive} toggleMenu={this.toggleMenu} />

                        <div className={linkStyles}>
                            <Link href={"/dashboard"}>
                                <a className={router.route === "/dashboard" ? Styles.active : undefined}>
                                    Dashboard
                                </a>
                            </Link>


                            {/*
                            <Link href={"/residential/Wired Rotating Residential Proxies"}>
                                <a className={router.route === "/residential/Wired Rotating Residential Proxies" ? Styles.active : undefined}>
                                    Rotating Generator
                                </a>
                            </Link> 
                            */}


                            <div className={router.route.includes("/residential") ? [Styles.resiContainer, Styles.active].join(" ") : Styles.resiContainer} onClick={this.toggleResiMenu()} onMouseEnter={this.toggleResiMenu(true)} onMouseLeave={this.toggleResiMenu(false)}>
                                <a style={{ display: "flex", gap: "2px", alignItems: "center", justifyContent: "center" }}>Residential Generator {resiMenuActive ? <FiChevronUp /> : <FiChevronDown />} </a>

                                <div className={resiMenuStyles} onClick={e => e.stopPropagation()}>
                                    {resiLinks?.map((e, i) => (
                                        <Link key={i} href={`/residential/${e.id}`}>
                                            <a>
                                                {e.label + (e.vip ? " [VIP]" : "")}
                                            </a>
                                        </Link>
                                    ))}

                                </div>
                            </div>
                            <Link href={"/#buy"}>
                                <a className={Styles.highlight}>
                                    Purchase
                                </a>
                            </Link>

                            <a href={"#!"} onClick={this.redirectToPortal}>
                                Billing
                            </a>

                            <Link href={"/settings"}>
                                <a className={router.route === "/settings" ? Styles.active : undefined}>
                                    Settings
                                </a>
                            </Link>
                            {prLink}
                            {adminLink}

                            <a href={"#!"} className={Styles.logout} onClick={this.logOut}>
                                Logout
                            </a>
                        </div>

                    </div>

                    <div className={Styles.actions}>
                        <div className={Styles.userInfo}>
                            <p>{session?.data?.user?.email} </p>
                            <span> {session?.data?.user?.admin ? "Admin" : session?.data?.user?.meta === "elite" ? "Elite" : "User"} </span>
                        </div>

                        <img src={`https://ui-avatars.com/api/?bold=true&size=64&background=ff5600&color=fff&format=png&name=${fullName}`} width={"35"} height={"35"} />

                    </div>

                </div>
            </nav>
        )
    }
}))


