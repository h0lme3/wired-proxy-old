import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState, useRef } from 'react'
import AdminNavBar from '../../components/navbar/navbar.admin'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles, } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle, BiMailSend, BiBadge, BiBadgeCheck, BiImport, BiMessageRounded, BiSend } from "react-icons/bi"
import ReactSwitch from 'react-switch'
import { toastLoader } from "../../helpers/notifications"
import { toast } from 'react-toastify'
import { parse } from 'papaparse'

function NewsLetterModal ({ closeModal }) {

    const [form, setForm] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        switch (e?.target?.type ?? key) {
            default: {
                setForm({ ...form, [key]: e?.target?.value || e })
            }
        }
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`Sending announcement/newsletter...`)

        if (!form.discord && !form.email && !form.everyone)
            return toastError(`Please choose where to send this post!`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/newsletter", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post: {
                        ...form
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`Successfully queued for posting`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't send the post due to an internal error.`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        Wired Newsletter/Announcements
                    </p>

                    <div className={Styles.inputs}>
                        <div>
                            <label>Title</label>
                            <input
                                name={"postTitle"}
                                type={"text"}
                                onChange={formChange("postTitle")}
                                value={form?.postTitle ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Content</label>
                            <textarea
                                name={"postContent"}
                                type={"textarea"}
                                onChange={formChange("postContent")}
                                style={{ minHeight: "80px", height: "auto", maxHeight: "160px" }}
                                value={form?.postContent ?? ""}
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label>Image URL (for Discord posts)</label>
                            <input
                                name={"postUrlLabel"}
                                type={"text"}
                                onChange={formChange("postUrlLabel")}
                                value={form?.postUrlLabel ?? ""}
                                required
                            />
                        </div>
                        <div>
                            <label>Send To Discord Webhook?</label>
                            <ReactSwitch
                                checked={!!form?.discord ?? false}
                                onChange={formChange("discord")}
                                onColor="#5CFF94"
                                offColor="#313644"
                                onHandleColor="#5cff94"
                                offHandleColor="#939AAA"
                                activeBoxShadow='0 0 2px 3px #5cff94'
                                handleDiameter={22}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                height={15}
                                width={35}
                            />
                        </div>

                        <div>
                            <label>Post to Email - Active Orders</label>
                            <ReactSwitch
                                checked={!!form?.email ?? false}
                                onChange={formChange("email")}
                                onColor="#5CFF94"
                                offColor="#313644"
                                onHandleColor="#5cff94"
                                offHandleColor="#939AAA"
                                activeBoxShadow='0 0 2px 3px #5cff94'
                                handleDiameter={22}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                height={15}
                                width={35}
                            />
                        </div>
                        <div>
                            <label>Post to Email - All Accounts</label>
                            <ReactSwitch
                                checked={!!form?.everyone ?? false}
                                onChange={formChange("everyone")}
                                onColor="#5CFF94"
                                offColor="#313644"
                                onHandleColor="#5cff94"
                                offHandleColor="#939AAA"
                                activeBoxShadow='0 0 2px 3px #5cff94'
                                handleDiameter={22}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                height={15}
                                width={35}
                            />
                        </div>




                        <div className={Styles.actions}>
                            <button className={Styles.cancel} onClick={closeModal}>
                                <p>
                                    Cancel
                                </p>
                            </button>

                            <button className={Styles.submit} onClick={submitModal} disabled={submitting}>
                                <p>
                                    Confirm
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

function SendModal ({ closeModal }) {

    const [form, setForm] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        switch (e?.target?.type ?? key) {
            default: {
                setForm({ ...form, [key]: e?.target?.value })
            }
        }
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`Sending post to webhooks...`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/webhook", {

                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post: {
                        ...form
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`Posted to ${res.posted}/${res.total} webhooks`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't send the post due to an internal error.`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        Webhook Post
                    </p>

                    <div className={Styles.inputs}>
                        <div>
                            <label>Title</label>
                            <input
                                name={"postTitle"}
                                type={"text"}
                                onChange={formChange("postTitle")}
                                value={form?.postTitle ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Description</label>
                            <textarea
                                name={"postContent"}
                                type={"textarea"}
                                onChange={formChange("postContent")}
                                style={{ minHeight: "80px", height: "auto", maxHeight: "160px" }}
                                value={form?.postContent ?? ""}
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label>Image URL</label>
                            <input
                                name={"postUrlLabel"}
                                type={"text"}
                                onChange={formChange("postUrlLabel")}
                                value={form?.postUrlLabel ?? ""}
                                required
                            />
                        </div>



                        <div className={Styles.actions}>
                            <button className={Styles.cancel} onClick={closeModal}>
                                <p>
                                    Cancel
                                </p>
                            </button>

                            <button className={Styles.submit} onClick={submitModal} disabled={submitting}>
                                <p>
                                    Send to Webhooks
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


function Modal ({ closeModal, update }) {

    const initializeForm = update ? { ...update } : {}
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        switch (e?.target?.type ?? key) {
            default: {
                setForm({ ...form, [key]: e?.target?.value ?? ["DISABLED", "ACTIVE"][+e] })
            }
        }
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the webhook...`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/webhook", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhook: {
                        ...form
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the webhook successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this webhook in the database.`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create`}
                    </p>

                    <div className={Styles.inputs}>
                        <div>
                            <label>ID</label>
                            <input
                                name={"groupId"}
                                type={"text"}
                                disabled={true}
                                placeholder={"Auto-generated"}
                                onChange={formChange("groupId")}
                                value={form?.groupId ?? undefined}
                                required
                            />
                        </div>

                        <div>
                            <label>Name</label>
                            <input
                                name={"groupName"}
                                type={"text"}
                                onChange={formChange("groupName")}
                                value={form?.groupName ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Webhook</label>
                            <input
                                name={"groupWebhook"}
                                type={"text"}
                                onChange={formChange("groupWebhook")}
                                value={form?.groupWebhook ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Coupon</label>
                            <input
                                name={"groupCoupon"}
                                type={"text"}
                                onChange={formChange("groupCoupon")}
                                value={form?.groupCoupon}
                                required
                            />
                        </div>


                        <div>
                            <label>Discount</label>
                            <input
                                name={"groupCouponDiscount"}
                                type={"text"}
                                onChange={formChange("groupCouponDiscount")}
                                value={form?.groupCouponDiscount ?? 0}
                                required
                            />
                        </div>

                        <div>
                            <label>Webhook Active</label>
                            <ReactSwitch
                                checked={form?.groupStatus === "ACTIVE"}
                                onChange={formChange("groupStatus")}
                                onColor="#5CFF94"
                                offColor="#313644"
                                onHandleColor="#5cff94"
                                offHandleColor="#939AAA"
                                activeBoxShadow='0 0 2px 3px #5cff94'
                                handleDiameter={22}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                height={15}
                                width={35}
                            />
                        </div>

                        <div className={Styles.actions}>
                            <button className={Styles.cancel} onClick={closeModal}>
                                <p>
                                    Cancel
                                </p>
                            </button>

                            <button className={Styles.submit} onClick={submitModal} disabled={submitting}>
                                <p>
                                    Confirm
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function Webhooks ({ webhooks }) {

    const router = useRouter()
    const fileRef = useRef()

    const [selection, setSelection] = useState([])
    const [clearSelection, setClearSelection] = useState(false)

    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [sendModalOpen, setSendModalOpen] = useState(false)
    const [newsletterModalOpen, setNewsletterModalOpen] = useState(false)

    const openModal = webhook => e => {
        setUpdate(webhook)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }

    const handleRowSelection = (e) => {
        setSelection(e?.selectedRows?.map(e => e.id))
    }

    const toggleSelectionStatus = useCallback((selection, toggle) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to {toggle ? "enable" : "disable"} {selection.length} selected webhook(s)?</p>
            <button className={Styles.submit} style={{ backgroundColor: "#FF2976", color: "#fff", padding: '10px', marginLeft: "auto" }} onClick={confirm}>
                Confirm!
            </button>
        </>


        const popup = toast(confirmPopUp, {
            autoClose: 10000,
            closeOnClick: false,
            closeButton: true,
            hideProgressBar: false,
            type: "error",
            style: { cursor: "unset" },
            icon: false,
        })

        async function confirm (e) {

            toast.dismiss(popup)

            const { toastSuccess, toastError } = toastLoader(`Updating ${selection.length} selected webhook(s)...`)

            try {

                const res = await fetch("/api/admin/webhook", {

                    method: "PATCH",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: selection,
                        toggle
                    })

                }).then(res => res.json())

                if (!res.ok) {
                    toastError(res.message)
                    return
                }

                setClearSelection(!clearSelection)
                toastSuccess(`Updated ${selection.length} selected webhook(s)`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't update ${selection.length} selected webhook(s)`)
            }

        }

    }, [clearSelection, router])

    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected webhook(s)`}?</p>
            <button className={Styles.submit} style={{ backgroundColor: "#FF2976", color: "#fff", padding: '10px', marginLeft: "auto" }} onClick={confirm}>
                Confirm!
            </button>
        </>


        const popup = toast(confirmPopUp, {
            autoClose: 10000,
            closeOnClick: false,
            closeButton: true,
            hideProgressBar: false,
            type: "error",
            style: { cursor: "unset" },
            icon: false,
        })

        async function confirm (e) {

            toast.dismiss(popup)

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected webhook(s)`}...`)

            try {

                const res = await fetch("/api/admin/webhook", {

                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: many ? data : [data.id],
                    })

                }).then(res => res.json())

                if (!res.ok) {
                    toastError(res.message)
                    return
                }

                setClearSelection(!clearSelection)
                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected webhook(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected webhook(s)`}`)
            }

        }

    }, [clearSelection, router])

    const handleFileChange = async (e) => {
        e.stopPropagation()
        e.preventDefault()

        const [file] = e.target.files
        if (!file)
            return

        const { toastSuccess, toastError } = toastLoader(`Importing file ${file.name}...`)

        try {

            const contents = await new Promise((r, x) => {
                const reader = new FileReader()
                reader.onload = (ev) => r(ev.target.result)
                reader.onerror = (er) => x(er)
                reader.readAsText(file)
            })

            const { data, errors } = parse(contents, { header: true, })
            if (!data || !data.length)
                return toastError(`Can't import an empty CSV file`)

            if (errors && errors.length)
                return toastError(`Found ${errors.length} in te CSV file, please fix them and reupload the file.`)

            let successCount = 0
            for (let entry of data) {
                try {

                    const res = await fetch("/api/admin/webhook", {

                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            webhook: {
                                ...entry
                            }
                        })

                    }).then(res => res.json())

                    if (!res.ok)
                        throw new Error(error)

                    successCount++

                } catch (e) {
                    console.error(e)
                }
            }

            toastSuccess(`Imported ${successCount}/${data.length} webhooks!`)
            router.replace(router.asPath)

        } catch (error) {
            toastError(error)
        }

    }


    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Webhook"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])
    const sendButton = useMemo(() => <BiMailSend key={2} title={"Send Message To Webhooks"} style={{ cursor: "pointer", fontSize: "28px", color: "#5CFF94" }} onClick={() => setSendModalOpen(true)} />, [])
    const importButton = useMemo(() => <BiImport key={3} title={"Import Webhooks CSV"} style={{ cursor: "pointer", fontSize: "28px", color: "#5CFF94" }} onClick={() => fileRef.current.click()} />, [fileRef])
    const newsletterButton = useMemo(() => <BiSend key={7} title={"Wired announcements/newsletter"} style={{ cursor: "pointer", fontSize: "28px", color: "#ff5600" }} onClick={() => setNewsletterModalOpen(true)} />, [])

    const columns = useMemo(() => [
        {
            name: "ID",
            selector: row => row.groupId,
            sortable: true,
            grow: 1,
        },

        {
            name: "Name",
            selector: row => row.groupName,
            sortable: true,
            grow: 2
        },

        {
            name: "Webhook",
            selector: row => row.groupWebhook?.slice(-10),
            sortable: true,
            grow: 2,
        },

        {
            name: "Coupon",
            selector: row => row.groupCoupon,
            sortable: true,
            grow: 2,
        },

        {
            name: "Discount %",
            selector: row => row.groupCouponDiscount,
            sortable: true,
            grow: 2,
        },

        {
            name: "Status",
            selector: row => row.groupStatus,
            sortable: true,
            grow: 1
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => (
                <div style={{ display: 'flex', gap: "8px" }}>
                    <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Webhook"} />
                    <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Webhook"} />
                </div>
            ),
            grow: 1
        },
    ],
        [confirmDelete]
    )

    const globalDeleteButton = useMemo(() => <BiMinusCircle key={0} onClick={confirmDelete(selection, true)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976", marginLeft: "10px" }} title={"Delete Coupons"} />, [selection, confirmDelete])
    const globalDisableButton = useMemo(() => <BiBadge key={1} onClick={toggleSelectionStatus(selection, 0)} style={{ cursor: "pointer", fontSize: "20px", color: "#FFCC61", marginLeft: "10px" }} title={"Disable Coupons"} />, [selection, toggleSelectionStatus])
    const globalEnableButton = useMemo(() => <BiBadgeCheck key={2} onClick={toggleSelectionStatus(selection, 1)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94", marginLeft: "10px" }} title={"Enable Coupons"} />, [selection, toggleSelectionStatus])

    const modal = modalOpen && !sendModalOpen && <Modal {...{ closeModal, update }} />
    const sendModal = !modalOpen && sendModalOpen && <SendModal closeModal={() => setSendModalOpen(false)} />
    const newsletterModal = newsletterModalOpen && <NewsLetterModal closeModal={() => setNewsletterModalOpen(false)} />

    return <>
        <Head>
            <title>Porter Admin - Webhooks</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <input type='file' id='file' ref={fileRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileChange} />
                <DataTable
                    title={"Webhooks"}
                    columns={columns}
                    data={webhooks?.map(webhook => ({ ...webhook, id: webhook.groupId }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[newsletterButton, importButton, sendButton, createButton, refreshButton]}
                    selectableRows={true}
                    onSelectedRowsChange={handleRowSelection}
                    clearSelectedRows={clearSelection}
                    contextActions={[globalEnableButton, globalDisableButton, globalDeleteButton]}
                />
            </div>
        </div>

        {modal}
        {sendModal}
        {newsletterModal}
    </>
}


export async function getServerSideProps ({ req }) {

    const session = await getSession({ req })
    if (!session || !session?.user?.admin || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const webhooks = await prisma.ppGroup.findMany()

    return {
        props: {
            webhooks: [...webhooks?.map((webhook) => ({ ...webhook, groupDatetime: null }))],
        }
    }
}