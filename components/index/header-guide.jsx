import { useSession } from "next-auth/react"
import Link from "next/link"

export function Header({ }) {
    const session = useSession()
    return (
        <header className="site-header">
            <nav className="container navbar navbar-expand-lg">
                <Link href={"/"}>
                    <a className="navbar-brand"><img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/porter-white-logo.png`} alt="Wired" /></a>
                </Link>
                
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#PorterNavbarContent" aria-controls="PorterNavbarContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"><img src={`${process.env.NEXT_PUBLIC_DOMAIN}/website/images/navbar-toggler-icon.png`} alt="" /></span>
                </button>

                <div className="collapse navbar-collapse" id="PorterNavbarContent">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item">
                            <Link href="/#buy"><a className="nav-link">Purchase Plan</a></Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/guide"><a className="nav-link">Insomniac Guide</a></Link>
                        </li>
                        <li className="nav-item">
                            {(
                                session.status === "authenticated"
                                    ? <Link href="/dashboard"><a className="nav-link login-menu">Dashboard</a></Link>
                                    : <Link href="/signin"><a className="nav-link login-menu">Log In</a></Link>
                            )}
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    )
}
