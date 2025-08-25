import { getSession, signIn } from "next-auth/react"
import Image from "next/image"
import Styles from "../styles/user/Signup.module.scss"

import { useState } from "react"
import { toast } from "react-toastify"
import { useRouter } from "next/router"
import { countriesList } from "../helpers/constants"
import { toastLoader } from "../helpers/notifications"
import Link from "next/link"
import Head from "next/head"
import Checkbox from "react-custom-checkbox"


export default function Login() {

    const [loading, setLoading] = useState(0)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [region, setRegion] = useState('')
    const [acceptedTos, setAcceptedTos] = useState(false)


    const router = useRouter()

    const onEmailChange = (e) => {
        setEmail(e.target.value)
    }

    const onPasswordChange = (e) => {
        setPassword(e.target.value)
    }

    const onPasswordRepeatChange = (e) => {
        setPasswordRepeat(e.target.value)
    }

    const onFirstNameChange = (e) => {
        setFirstName(e.target.value)
    }

    const onLastNameChange = (e) => {
        setLastName(e.target.value)
    }

    const onRegionChange = (e) => {
        setRegion(e.target.value)
    }

    const onAcceptedTosChange = (e) => {
        setAcceptedTos(e)
    }

    const registerUser = async (e) => {
        e.preventDefault()

        const { toastSuccess, toastError } = toastLoader("Signing up..")

        if (!password || password.length < 8) 
            return toastError("Invalid password")
        

        if (password !== passwordRepeat) 
            return toastError("Passwords don't match.")
        

        if (!email.length > 1 && !email.includes('@')) 
            return toastError("Invalid email address")
        

        if (!firstName) 
            return toastError("Invalid first name")
        

        if (!lastName) 
            return toastError("Invalid last name")
        

        if (!region) 
            return toastError("Invalid region")
        
        if (!acceptedTos) 
            return toastError(`You need to agree to the Terms & Conditions and Privacy Policy to order`)

        setLoading(true)

        try {

            const res = await fetch("/api/signup", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName,
                    region,
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setLoading(false)
                return
            }


            toastSuccess("Signed up!")
            router.push('/signin')


        } catch (error) {
            console.log(error)
            toastError("Couldn't sign in")
            setLoading(false)

        }


    }

    return (
        <>
            <Head>
                <title>Wired - Sign-Up</title>
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
                        Sign-Up
                    </p>
                    <form onSubmit={registerUser} className={Styles.form}>

                        <input
                            name={"firstName"}
                            type={"firstName"}
                            maxLength={255}
                            placeholder={"First Name"}
                            className={Styles.input}
                            onChange={onFirstNameChange}
                            required={true}
                        />

                        <input
                            name={"lastName"}
                            type={"lastName"}
                            maxLength={255}
                            placeholder={"Last Name"}
                            className={Styles.input}
                            onChange={onLastNameChange}
                            required={true}
                        />

                        <select onChange={onRegionChange} required={true} defaultValue={"Region"}>
                            <option value="Region" disabled={true}>Region</option>
                            {Object.entries(countriesList).map((o, k) => <option key={k} value={o[1]}>{o[0]}</option>)}
                        </select>

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

                        <input
                            name={"passwordRepeat"}
                            type={"password"}
                            maxLength={255}
                            placeholder={"Password Repeat"}
                            className={Styles.input}
                            onChange={onPasswordRepeatChange}
                            required={true}
                        />


                        <Checkbox
                                checked={acceptedTos}
                                name="acceptedTos"
                                onChange={onAcceptedTosChange}
                                borderColor="#404656"
                                containerStyle={{ cursor: "pointer" }}
                                icon={<div style={{ backgroundColor: "#ff5600", borderRadius: 1, padding: 8 }} />}
                                style={{ background: "#fff", border: "2px solid #ff5600", width: "12px", height: "12px" }}
                                label={ 
                                        <p style={{fontSize: "12px !important"}} onClick={e => e.stopPropagation()}>I have read and agree to the <a target="_blank" href='/legal/terms-conditions.html' style={{textDecoration: "underline", fontSize: "12px !important"}}>Terms &#38; Conditions</a> and <a target="_blank" href='/legal/privacy-policy.html' style={{textDecoration: "underline", fontSize: "12px !important"}}>Privacy Policy</a></p>
                                }
                                labelStyle={{ marginLeft: "7px", userSelect: "none", fontWeight: "600", fontSize: "12px !important", lineHeight: "15px", color: "#939AAA" }}
                        />
                        <button type="submit" className={Styles.loginButton} disabled={!!loading}>
                            <p>
                                Sign Up
                            </p>
                        </button>

                        <div className={Styles.links}>
                            <Link href={"/signin"}>
                                <a href={"#!"}>Log-In Instead?</a>
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