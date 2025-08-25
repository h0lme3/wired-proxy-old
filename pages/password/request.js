import { getSession, } from "next-auth/react"
import Image from "next/image"
import Styles from "../../styles/user/Signin.module.scss"

import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { toastLoader } from "../../helpers/notifications"

import Head from "next/head"


export default function PasswordRequest() {

    const [loading, setLoading] = useState(0)

    const [email, setEmail] = useState('')

    const router = useRouter()

    const onEmailChange = (e) => {
        setEmail(e.target.value)
    }


    const requestPasswordReset = async (e) => {

        e.preventDefault()

        const { toastSuccess, toastError } = toastLoader("Requesting password reset")

        if (!email.length > 1 && !email.includes('@')) 
            return toastError("Invalid email address")
        

        setLoading(true)


        try {

            const res = await fetch("/api/password/request", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setLoading(false)
                return
            }

            toastSuccess("Please check your email for instructions on resetting your password")

        } catch (error) {
            console.log(error)
            toastError("An error has occurred while attempting to request password reset")
            setLoading(false)
        }
    }

    return (

        <>
            <Head>
                <title>Wired - Request Password Reset</title>
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
                        Reset Password
                    </p>
                    <form onSubmit={requestPasswordReset} className={Styles.form}>
                        <input
                            name={"email"}
                            type={"email"}
                            maxLength={255}
                            placeholder={"Email"}
                            className={Styles.input}
                            onChange={onEmailChange}
                            required={true}
                        />

                        <button type="submit" className={Styles.loginButton} disabled={!!loading}>
                            <p>
                                Request
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