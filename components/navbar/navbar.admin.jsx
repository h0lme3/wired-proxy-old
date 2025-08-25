import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { withRouter } from 'next/router'
import { Component } from 'react'
import { toast } from "react-toastify"

import Hamburger from "./hamburger"
import Styles from "./navbar.admin.module.scss"

function withSession (Component) {
    return function useSessionWrap (props) {
        const session = useSession()
        if (Component.prototype.render) {
            return <Component session={session} {...props} />
        }
    }
}

export default withRouter(withSession(class AdminNavBar extends Component {

    constructor (props) {
        super(props)
        this.state = {
            menuActive: false
        }
    }

    toggleMenu = () => {
        this.setState({ menuActive: !this.state.menuActive })
    }

    logOut = () => {

        toast.loading("Signing out..", { autoClose: 3000 })

        signOut({
            redirect: true,
            callbackUrl: "/signin"
        })
    }

    render () {
        const { menuActive } = this.state
        const { router, session } = this.props

        const fullName = session?.data?.user ? session?.data?.user?.firstName + ' ' + session?.data?.user?.lastName : ""

        const linkStyles = [Styles.links, menuActive ? Styles.active : undefined].join(" ")
        return (
            <nav className={Styles.navbarContainer}>
                <div className={Styles.container}>

                    <div className={Styles.navigation}>

                        <div onClick={() => router.push("/")} className={Styles.logo}>
                            <Image src="/logo.svg" width="87" height="30" />
                        </div>

                        <Hamburger className={Styles.hamburger} menuActive={menuActive} toggleMenu={this.toggleMenu} />

                        <div className={linkStyles}>
                            <Link href={"/admin/statistics"}>
                                <a className={router.route === "/admin/statistics" ? Styles.active : undefined}>
                                    Statistics
                                </a>
                            </Link>

                            <Link href={"/admin/products"}>
                                <a className={router.route === "/admin/products" ? Styles.active : undefined}>
                                    Products
                                </a>
                            </Link>
                            <Link href={"/admin/productpages"}>
                                <a className={router.route === "/admin/productpages" ? Styles.active : undefined}>
                                    Product Pages
                                </a>
                            </Link>

                            <Link href={"/admin/coupons"}>
                                <a className={router.route === "/admin/coupons" ? Styles.active : undefined}>
                                    Coupons
                                </a>
                            </Link>


                            <Link href={"/admin/webhooks"}>
                                <a className={router.route === "/admin/webhooks" ? Styles.active : undefined}>
                                    Webhooks
                                </a>
                            </Link>

                            <Link href={"/admin/orders"}>
                                <a className={router.route === "/admin/orders" ? Styles.active : undefined}>
                                    Orders
                                </a>
                            </Link>

                            <Link href={"/admin/guides"}>
                                <a className={router.route === "/admin/guides" ? Styles.active : undefined}>
                                    Guides
                                </a>
                            </Link>

                            <Link href={"/admin/faq"}>
                                <a className={router.route === "/admin/faq" ? Styles.active : undefined}>
                                    FAQs
                                </a>
                            </Link>

                            <Link href={"/admin/reports"}>
                                <a className={router.route === "/admin/reports" ? Styles.active : undefined}>
                                    Reports
                                </a>
                            </Link>

                            <Link href={'/stats/sales'}>
                                <a className={router.route === '/stats/sales' ? Styles.active : undefined}>
                                    Stats
                                </a>
                            </Link>


                            <Link href={'/dashboard'}>
                                <a className={router.route === '/dashboard' ? Styles.active : undefined}>
                                    User
                                </a>
                            </Link>

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


