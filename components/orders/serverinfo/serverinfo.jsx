import { useState } from "react"
import { toast } from "react-toastify"
import Styles from "./serverinfo.module.scss"
import { toastLoader } from '../../../helpers/notifications'


export default function ServerInfo({ setServerData, serverData }) {

    const [submitting, setSubmitting] = useState(false)
    const [revealPassword, setRevealPassword] = useState(false)
    const { ipAddress, username, password, type, orderId} = serverData

    const [_, serverType, fullSpec] = type.split("_")
    const [serverCores, serverRam] = fullSpec.split('x')

    const serverTypes = {
        VM: "Virtual Machine",
        BM: "Baremetal"
    }

    const startServer = async (e) => {

        const { toastSuccess, toastError } = toastLoader(`Starting server...`)
        setSubmitting(true)

        try {

            const res = await fetch("/api/server/actions", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    action: "start"
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess("Server signaled to start!")
            setSubmitting(false)

        } catch (error) {
            toastError(error.message)
            setSubmitting(false)
        }

    }

    const stopServer = async (e) => {

        const { toastSuccess, toastError } = toastLoader(`Stopping server...`)
        setSubmitting(true)

        try {

            const res = await fetch("/api/server/actions", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    action: "stop"
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess("Server signaled to stop!")
            setSubmitting(false)

        } catch (error) {
            toastError(error.message)
            setSubmitting(false)
        }

    }

    const rebootServer = async (e) => {

        const { toastSuccess, toastError } = toastLoader(`Rebooting server...`)
        setSubmitting(true)

        try {

            const res = await fetch("/api/server/actions", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    action: "reboot"
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess("Server signaled to reboot!")
            setSubmitting(false)

        } catch (error) {
            toastError(error.message)
            setSubmitting(false)
        }

    }

    const toggleRevealPassword = (e) => {
        setRevealPassword(!revealPassword)
    }

    const closeModal = (e) => {
        setServerData(null)
    }

    const copy = (data) => async (e) => {
        if (typeof navigator.clipboard == 'undefined')
            return toast.error(`Copying is not supported in this context, please select and copy manually instead`)

        await navigator.clipboard.writeText(data)
        toast.success(`Copied to clipboard!`)
    }

    return (
        <div className={Styles.fullScreenContainer}>
            <div className={Styles.container}>
                <div className={Styles.header}>
                    <span>Server Information</span>

                    <div className={Styles.closeButton} onClick={closeModal}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.000488281" y="10.6667" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(-45 0.000488281 10.6667)" fill="#73768E" />
                            <rect x="1.3335" width="15.0849" height="1.88561" rx="0.942807" transform="rotate(45 1.3335 0)" fill="#73768E" />
                        </svg>
                    </div>
                </div>

                <div className={Styles.body}>
                    <p className={Styles.specs}> {serverTypes[serverType]} - {serverRam} GB of RAM - {serverCores} CPU Cores</p>


                    <div className={Styles.info}>
                        <p>IP Address: </p>
                        <span onClick={copy(ipAddress)}>{ipAddress}</span>
                    </div>

                    <div className={Styles.info}>
                        <p>Username: </p>
                        <span onClick={copy(username)}>{username}</span>
                    </div>

                    <div className={Styles.info}>
                        <p>Password: </p>
                        <span onClick={copy(password)}>{revealPassword ? password : "************"}</span>
                    </div>

                </div>

                <div className={Styles.actions}>
                    <button onClick={startServer} disabled={submitting}>
                        <p>
                            Start
                        </p>
                    </button>

                    <button onClick={stopServer} disabled={submitting}>
                        <p>
                            Stop
                        </p>
                    </button>

                    <button onClick={rebootServer} disabled={submitting}>
                        <p>
                            Reboot
                        </p>
                    </button>


                    <button onClick={toggleRevealPassword} className={Styles.reveal}>
                        <p>
                            {revealPassword ? "Hide" : "Reveal"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    )
}
