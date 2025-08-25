import { useState } from "react"
import { toast } from "react-toastify"
import Styles from "./setcredspopup.module.scss"
import { toastLoader } from '../../../helpers/notifications'
import ReactSwitch from "react-switch"
import { useRouter } from "next/router"


export default function SetCredsPopup ({ setCredData, credData }) {

    const [submitting, setSubmitting] = useState(false)
    const { orderId, secondUser, proxies } = credData
    const proxy = proxies?.[0]
    const [username, setUsername] = useState((secondUser && proxy?.username) || '')
    const [password, setPassword] = useState((secondUser && proxy?.password) || '')
    const router = useRouter()

    const submitForm = async (e) => {

        const { toastSuccess, toastError } = toastLoader(secondUser ? `Disabling custom credentials...` : `Setting custom credentials..`)
        setSubmitting(true)

        try {

            const res = await fetch("/api/order/actions", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    username,
                    password
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess("Custom credentials settings saved!")
            setSubmitting(false)
            setCredData(false)
            router.replace(router.asPath)

        } catch (error) {
            toastError(error.message)
            setSubmitting(false)
        }

    }


    const closeModal = (e) => {
        setCredData(null)
    }

    return (
        <div className={Styles.fullScreenContainer}>
            <div className={Styles.container}>
                <div className={Styles.header}>
                    <span>Custom Credentials for Order {orderId}</span>

                    <div className={Styles.closeButton} onClick={closeModal}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.000488281" y="10.6667" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(-45 0.000488281 10.6667)" fill="#73768E" />
                            <rect x="1.3335" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(45 1.3335 0)" fill="#73768E" />
                        </svg>
                    </div>
                </div>

                <div className={Styles.body}>
                    <p className={Styles.specs}>You can set a custom username and password for your ISP proxies through this form or disable to go back to the original random proxy credentials. </p>

                    <div className={Styles.inputs}>
                        <div>
                            <label>Username</label>
                            <input
                                name={"username"}
                                type={"text"}
                                onChange={e => setUsername(e.target.value)}
                                value={username}
                                required
                                disabled={secondUser || submitting}

                            />
                        </div>

                        <div>
                            <label>Password</label>
                            <input
                                name={"password"}
                                type={"text"}
                                onChange={e => setPassword(e.target.value)}
                                value={password}
                                required
                                disabled={secondUser || submitting}
                            />
                        </div>

                    </div>




                </div>

                <div className={Styles.actions}>
                    <button onClick={submitForm} disabled={submitting} className={Styles.submit}>
                        <p>
                            {!secondUser ? "Set Credentials" : "Disable Custom Credentials"}
                        </p>
                    </button>

                    <button onClick={closeModal} disabled={submitting}>
                        <p>
                            Cancel
                        </p>
                    </button>

                </div>
            </div>
        </div>
    )
}
