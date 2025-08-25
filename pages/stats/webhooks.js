import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState } from 'react'
import StatsNavBar from '../../components/navbar/navbar.stats'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles, countriesList, multiSelectStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle, BiBadge, BiBadgeCheck, BiMailSend } from "react-icons/bi"
import ReactSwitch from 'react-switch'
import { toastLoader } from "../../helpers/notifications"
import { toast } from 'react-toastify'

import Select from 'react-select'
import { CURRENT_SITE, MIRROR_SITES } from '../../helpers/sites'


function Modal ({ closeModal, update, managers, coupons }) {

    const initializeForm = update ? { ...update } : {}
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the webhooks...`)

        if (!form.name || !form.webhook || !form.country || !form.regions || !form.manager || !form.coupon || !form.status || !form.contact || !form.hype)
            return toastError(`Some fields are empty, please fill them before submitting`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/webhooks", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhook: {
                        ...form,
                        createdAt: undefined,
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the webhooks successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this webhooks`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create Webhook`}
                    </p>

                    <div className={Styles.inputs}>

                        <div>
                            <label>Name</label>
                            <input
                                name={"name"}
                                type={"text"}
                                value={form?.name ?? ""}
                                onChange={formChange("name")}
                                required={true}
                            />
                        </div>


                        <div>
                            <label>Webhook</label>
                            <input
                                name={"webhook"}
                                type={"text"}
                                value={form?.webhook ?? ""}
                                onChange={formChange("webhook")}
                                required={true}
                            />
                        </div>

                        <div>
                            <label>Country</label>
                            <Select
                                options={Object.values(countriesList).map(e => ({ value: e, label: e }))}
                                styles={multiSelectStyles}
                                isMulti={false}
                                isClearable={false}
                                theme={theme => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary75: '#313644',
                                        primary50: '#313644',
                                        primary25: '#313644',
                                        danger: '#ff2976',
                                        dangerLight: '#ff2976',
                                    }
                                })}
                                onChange={formChange("country")}
                                defaultValue={{ value: form?.country, label: form?.country }}
                                required={true}
                            />

                        </div>

                        <div>
                            <label>Regions (separated with &quot;,&quot;)</label>
                            <input
                                name={"regions"}
                                type={"text"}
                                value={form?.regions ?? ""}
                                onChange={formChange("regions")}
                                required={true}
                            />
                        </div>


                        <div>
                            <label>Manager</label>
                            <Select
                                options={managers.map(e => ({ value: e.customerId, label: `${e.firstName} ${e.lastName} (ID: ${e.customerId})` }))}
                                styles={multiSelectStyles}
                                isMulti={false}
                                isClearable={false}
                                theme={theme => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary75: '#313644',
                                        primary50: '#313644',
                                        primary25: '#313644',
                                        danger: '#ff2976',
                                        dangerLight: '#ff2976',
                                    }
                                })}
                                onChange={formChange("manager")}
                                defaultValue={() => {
                                    const manager = form?.manager ? managers.find(e => e.customerId == form?.manager) : null
                                    return { value: form?.manager, label: manager ? manager.firstName + ' ' + manager.lastName + ` (ID: ${form.manager})` : form?.manager }
                                }}
                                required={true}
                            />

                        </div>

                        <div>
                            <label>Coupon</label>
                            <Select
                                options={coupons.map(e => ({ value: e.discountCode, label: e.discountCode }))}
                                styles={multiSelectStyles}
                                isMulti={false}
                                isClearable={false}
                                theme={theme => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary75: '#313644',
                                        primary50: '#313644',
                                        primary25: '#313644',
                                        danger: '#ff2976',
                                        dangerLight: '#ff2976',
                                    }
                                })}
                                onChange={formChange("coupon")}
                                defaultValue={{ value: form?.coupon, label: form?.coupon }}
                                required={true}
                            />

                        </div>


                        <div>
                            <label>Status</label>
                            <Select
                                options={["Active", "Inactive", "Manual"].map(e => ({ value: e, label: e }))}
                                styles={multiSelectStyles}
                                isMulti={false}
                                isClearable={false}
                                theme={theme => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary75: '#313644',
                                        primary50: '#313644',
                                        primary25: '#313644',
                                        danger: '#ff2976',
                                        dangerLight: '#ff2976',
                                    }
                                })}
                                onChange={formChange("status")}
                                defaultValue={{ value: form?.status, label: form?.status }}
                                required={true}
                            />
                        </div>





                        <div>
                            <label>Contact</label>
                            <input
                                name={"contact"}
                                type={"text"}
                                value={form?.contact ?? ""}
                                onChange={formChange("contact")}
                                required
                            />
                        </div>



                        <div>
                            <label>Hype</label>
                            <Select
                                options={[1, 2, 3, 4, 5].map(e => ({ value: e, label: e }))}
                                styles={multiSelectStyles}
                                isMulti={false}
                                isClearable={false}
                                theme={theme => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary75: '#313644',
                                        primary50: '#313644',
                                        primary25: '#313644',
                                        danger: '#ff2976',
                                        dangerLight: '#ff2976',
                                    }
                                })}
                                onChange={formChange("hype")}
                                defaultValue={{ value: form?.hype, label: form?.hype }}
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

            const res = await fetch("/api/admin/webhooks", {

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

                        <div>
                            <label>Regions (separated by &quot;,&quot; - case insensitive - leaving empty sends to all)</label>
                            <input
                                name={"regions"}
                                type={"text"}
                                onChange={formChange("regions")}
                                value={form?.regions ?? ""}
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

export default function Webhooks ({ webhooks, managers, coupons }) {

    const router = useRouter()

    const [search, setSearch] = useState('')
    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [sendModalOpen, setSendModalOpen] = useState(false)

    const openModal = webhooks => e => {
        setUpdate(webhooks)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }

    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected webhooks(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected webhooks(s)`}...`)

            try {

                const res = await fetch("/api/admin/webhooks", {

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

                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected webhooks(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected webhooks(s)`}`)
            }

        }

    }, [router])


    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Webhook"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])
    const sendButton = useMemo(() => <BiMailSend key={3} title={"Send Message To Webhooks"} style={{ cursor: "pointer", fontSize: "28px", color: "#5CFF94" }} onClick={() => setSendModalOpen(true)} />, [])

    const searchField = useMemo(() => <div key={4} className={Styles.inputs} style={{ padding: 0, width: "240px" }}><input type="text" placeholder='Search...' onChange={(e) => setSearch(e.target.value)} /></div>, [])

    const columns = useMemo(() => [


        {
            name: "Country",
            selector: row => row.country,
            sortable: true,
        },

        {
            name: "Regions",
            selector: row => row.regions,
            sortable: true,
        },

        {
            name: "Manager",
            selector: row => {
                const manager = managers.find(e => e.customerId == row.manager)
                return manager ? manager.firstName + ' ' + manager.lastName + ` (ID: ${row.manager})` : 'ID: ' + row.manager
            },
            sortable: true,
        },

        {
            name: "Name",
            selector: row => row.name,
            sortable: true,

        },

        {
            name: "Coupon",
            selector: row => row.coupon,
            sortable: true,
        },

        {
            name: "Discount %",
            selector: row => {
                const coupon = coupons.find(e => e.discountCode == row.coupon)
                return coupon ? coupon.discount : ' - '
            },
            sortable: true,

        },


        {
            name: "Contact",
            selector: row => row.contact,
            sortable: true,

        },

        {
            name: "Hype",
            selector: row => row.hype,
            sortable: true,
        },

        {
            name: "Status",
            selector: row => row.status,
            sortable: true,
        },


        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Webhook"} />
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Webhook"} />
            </div>
        },
    ],
        [managers, coupons, confirmDelete]
    )


    const data = !search ? webhooks : webhooks.filter(e => Object.values?.(e)?.some(e => {
        if (typeof e === "string") {
            return e.toLowerCase().includes(search.toLowerCase())
        } else {
            return e == search
        }
    }))

    const modal = modalOpen && !sendModalOpen && <Modal {...{ closeModal, update, managers, coupons }} />
    const sendModal = !modalOpen && sendModalOpen && <SendModal closeModal={() => setSendModalOpen(false)} />

    return <>
        <Head>
            <title>Porter Stats - Webhooks</title>
        </Head>

        <StatsNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Webhooks"}
                    columns={columns}
                    data={data?.map(webhooks => ({ ...webhooks, id: webhooks.webhookId }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[searchField, sendButton, createButton, refreshButton]}

                />
            </div>
        </div>

        {modal}
        {sendModal}

    </>
}


export async function getServerSideProps ({ req }) {

    const session = await getSession({ req })
    const isPr = session?.user?.customerId && session?.user?.adminType === "PR"
    if (!session || !session?.user?.customerId || (!session?.user?.admin && !isPr)) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }


    const managers = await prisma.customer.findMany(isPr ? {
        where: {
            customerId: session.user.customerId
        },
        select: {
            admin: true,
            adminType: true,
            customerId: true,
            firstName: true,
            lastName: true,
        }
    } : {
        where: {
            OR: [
                {
                    adminType: "PR"
                },
                {
                    admin: true
                }
            ]
        },
        select: {
            admin: true,
            adminType: true,
            customerId: true,
            email: true,
            firstName: true,
            lastName: true,
        }
    })

    const coupons = await prisma.promotion.findMany(isPr ? {
        where: {
            active: 1,
            site: 'porter',

        },
        select: {
            discount: true,
            discountCode: true
        }
    } : {
        where: {
            active: 1,
        },
        select: {
            discount: true,
            discountCode: true
        }
    })

    const webhooks = await prisma.webhook.findMany(isPr ? {
        where: {
            manager: session.user.customerId
        }
    } : undefined)

    return {
        props: {
            webhooks: webhooks.map(e => ({ ...e, createdAt: +e.createdAt })),
            managers: managers,
            coupons: coupons
        }
    }
}