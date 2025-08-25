import { getSession, signIn } from "next-auth/react"
import Image from "next/image"
import Styles from "../styles/user/Signin.module.scss"

import { useState } from "react"
import { toast } from "react-toastify"
import { useRouter } from "next/router"
import Link from "next/link"
import { toastLoader } from "../helpers/notifications"

import Head from "next/head"


export default function Login () {

    const [loading, setLoading] = useState(0)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [otpVisible, setOtpVisible] = useState(false)

    const router = useRouter()

    const onEmailChange = (e) => {
        setEmail(e.target.value)
    }

    const onPasswordChange = (e) => {
        setPassword(e.target.value)
    }

    const onOtpChange = (e) => {
        setOtp(e.target.value)
    }

    const loginUser = async (e) => {

        e.preventDefault()

        const { toastSuccess, toastError, toastInfo } = toastLoader("Signing in..")

        if (!password || password.length < 8)
            return toastError("Invalid password")

        if (!email.length > 1 && !email.includes('@'))
            return toastError("Invalid email address")

        if ((!otp || otp.length != 8) && otpVisible)
            return toastError("Invalid 2FA Code")

        setLoading(true)

        try {

            const res = await signIn("default", {
                email,
                password,
                redirect: false
            }, {
                otp,
            })

            if (res.ok) {

                if (res.error === "OTP Required") {
                    setLoading(false)
                    setOtpVisible(true)
                    toastInfo("2FA Code has been sent to your email, please enter it to log-in.")
                    return
                } else if (res.error === "OTP Invalid") {
                    setLoading(false)
                    setOtpVisible(true)
                    toastError("2FA Code is invalid, please contact us if you have trouble logging in")
                    return
                }

                setLoading(false)
                toastSuccess("Signed in!")
                router.push('/dashboard')
            } else if (res.error) {
                setLoading(false)
                toastError("Invalid credentials.")
            }


        } catch (error) {
            console.log(error)
            toastError("Couldn't sign in")
            setLoading(false)
        }


    }

    return (

        <>
            <Head>
                <title>Wired - Sign-In</title>
            </Head>


            <div className={Styles.container}>
                <div className={Styles.loginForm}>
                    <div className={Styles.header}>
                        <Link href={"/"}>
                            <a style={{ margin: 0, padding: 0 }}>
                                <Image src={"/logo.png"} width={"140px"} height={"26px"} />
                            </a>
                        </Link>
                    </div>
                    <p>
                        Login
                    </p>

                    <span>Accounts are shared across <br /><a href="https://wiredproxies.com">Wired Proxies</a> &amp; <a href="https://wiredsms.com">Wired SMS</a></span>
                    <form onSubmit={loginUser} className={Styles.form}>
                        <input
                            name={"email"}
                            type={"email"}
                            maxLength={255}
                            placeholder={"Email"}
                            className={Styles.input}
                            onChange={onEmailChange}
                            required={true}
                        />

                        <input
                            name={"password"}
                            type={"password"}
                            maxLength={255}
                            placeholder={"Password"}
                            className={Styles.input}
                            onChange={onPasswordChange}
                            required={true}
                        />
                        {otpVisible && <input
                            name={"otp"}
                            type={"text"}
                            maxLength={8}
                            placeholder={"2FA Code"}
                            className={Styles.input}
                            onChange={onOtpChange}
                        /> || null}

                        <button type="submit" className={Styles.loginButton} disabled={!!loading}>
                            <p>
                                {otpVisible ? "Authorise" : "Sign In"}
                            </p>
                        </button>

                        <div className={Styles.links}>
                            <Link href={"/signup"}>
                                <a>Create An Account</a>
                            </Link>
                            <Link href={"/password/request"}>
                                <a>Forgot Password?</a>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export async function getServerSideProps ({ req }) {
    const session = await getSession({ req })
    if (!session || !session?.user?.customerId) {
        return {
            props: {}
        }
    } else {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }
}