import { getSession, signIn } from "next-auth/react"
import Image from "next/image"
import Styles from "../../styles/user/Signin.module.scss"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { toastLoader } from "../../helpers/notifications"

import Head from "next/head"

export default function CompleteSignUp() {

    const router = useRouter()
    const { activationCode: activationCodeQuery, email: emailQuery } = router.query

    useEffect(() => {

        if (!activationCodeQuery || !emailQuery)
            return router.push('/signin')

        window.history.replaceState({}, document.title, router.route)

    })


    const [loading, setLoading] = useState(0)

    const [email, setEmail] = useState(emailQuery)
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    const [activationCode, setActivationCode] = useState(activationCodeQuery)


    const onPasswordChange = (e) => {
        setPassword(e.target.value)
    }

    const onRepeatPasswordChange = (e) => {
        setRepeatPassword(e.target.value)
    }

    const completeGuestSignUp = async (e) => {
        e.preventDefault()

        const { toastSuccess, toastError } = toastLoader("Setting your password...")

        if (!email.length > 1 && !email.includes('@')) 
            return toastError("Invalid email address")
        

        if (!password || password.length < 8) 
            return toastError("Invalid password")
        

        if (password !== repeatPassword) 
            return toastError("Passwords don't match.")
        
        if (!activationCode) 
            return toastError("Please re-visit the link from your email")

        setLoading(true)


        try {

            const res = await fetch("/api/password/complete", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    repeatPassword,
                    activationCode
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setLoading(false)
                return
            }

            toastSuccess("Your password has been set! You'll be redirected to login shortly")
            router.push('/signin')

        } catch (error) {
            console.log(error)
            toastError("An error has occurred while attempting to complete sign up")
            setLoading(false)
        }


    }

    return (

        <>
            <Head>
                <title>Wired - Complete Guest Sign-Up</title>
            </Head>


            <div className={Styles.container}>
                <div className={Styles.loginForm}>
                    <div className={Styles.header}>
                        <Link href={"/"}>
                            <a style={{margin: 0, padding: 0}}>
                                <Image src={"/logo.png"} width={"140px"} height={"26px"} />
                            </a>
                        </Link>
                    </div>
                    <p>
                        Complete Guest Sign-Up
                    </p>
                    <form onSubmit={completeGuestSignUp} className={Styles.form}>
                        <input
                            name={"email"}
                            type={"email"}
                            maxLength={255}
                            placeholder={"Email"}
                            className={Styles.input}
                            required={true}
                            disabled={true}
                            value={email}
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

                        <input
                            name={"repeatPassword"}
                            type={"password"}
                            maxLength={255}
                            placeholder={"Repeat Password"}
                            className={Styles.input}
                            onChange={onRepeatPasswordChange}
                            required={true}
                        />

                        <input
                            name={"activationCode"}
                            type={"password"}
                            maxLength={255}
                            placeholder={"Reset Code"}
                            className={Styles.input}
                            required={true}
                            disabled={true}
                            value={activationCode}
                            hidden={true}
                        />


                        <button type="submit" className={Styles.loginButton} disabled={!!loading}>
                            <p>
                                Sign Up
                            </p>
                        </button>

                        <div className={Styles.links}>
                            <Link href={"/signup"}>
                                <a>Create An Account</a>
                            </Link>
                            <Link href={"/signin"}>
                                <a>Log-In Instead?</a>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export async function getServerSideProps({ req }) {
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