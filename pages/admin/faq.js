import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState } from 'react'
import AdminNavBar from '../../components/navbar/navbar.admin'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles, multiSelectStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle, BiBadge, BiBadgeCheck } from "react-icons/bi"
import ReactSwitch from 'react-switch'
import { toastLoader } from "../../helpers/notifications"
import { toast } from 'react-toastify'

import Select from 'react-select'
import { CURRENT_SITE, MIRROR_SITES } from '../../helpers/sites'


function Modal ({ closeModal, update, }) {

    const initializeForm = update ? { ...update } : { faqTitle: "", faqContent: "", faqSite: "", faqOrder: 0 }
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the FAQ...`)

        try {
            setSubmitting(true)

            const res = await fetch("/api/admin/faq", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guide: {
                        ...form,
                        createdAt: undefined
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the FAQ successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this FAQ`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create FAQ`}
                    </p>

                    <div className={Styles.inputs}>


                        <div>
                            <label>FAQ Title</label>
                            <input
                                name={"faqTitle"}
                                type={"text"}
                                value={form?.faqTitle ?? ""}
                                onChange={formChange("faqTitle")}
                                required
                            />
                        </div>


                        <div>
                            <label>FAQ Content</label>
                            <textarea
                                name={"faqContent"}
                                type={"textarea"}
                                onChange={formChange("faqContent")}
                                style={{ minHeight: "180px", height: "auto", maxHeight: "360px" }}
                                value={form?.faqContent ?? ""}
                                required
                            ></textarea>
                        </div>



                        <div>
                            <label>Site</label>
                            <Select
                                options={MIRROR_SITES.map(e => ({ value: e, label: e }))}
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
                                onChange={formChange("faqSite")}
                                defaultValue={{ value: form?.faqSite, label: form?.faqSite }}
                            />
                        </div>

                        <div>
                            <label>FAQ Order (lower number appears first)</label>
                            <input
                                name={"faqOrder"}
                                type={"number"}
                                value={form?.faqOrder ?? 0}
                                onChange={formChange("faqOrder")}
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

export default function Guides ({ FAQs }) {

    const router = useRouter()

    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = product => e => {
        setUpdate(product)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }


    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected faq(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected faq(s)`}...`)

            try {

                const res = await fetch("/api/admin/faq", {

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

                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected faq(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected faq(s)`}`)
            }

        }

    }, [router])




    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Product Page"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])

    const columns = useMemo(() => [

        {
            name: "id",
            selector: row => row.faqId,
            sortable: true,
            grow: 1

        },

        {
            name: "Site",
            selector: row => row.faqSite,
            sortable: true,
            grow: 1
        },

        {
            name: "Order",
            selector: row => row.faqOrder,
            sortable: true,
            grow: 1

        },

        {
            name: "Title",
            selector: row => row.faqTitle,
            sortable: true,
            grow: 2.5

        },


        {
            name: "Content",
            selector: row => row.faqContent,
            sortable: true,
            width: '500px',
            grow: 0
        },

        {
            name: "Created At",
            selector: row => new Date(row.createdAt).toISOString(),
            sortable: true,
            grow: 2
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete FAQ"} />
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit FAQ"} />
            </div>,
            grow: 1
        },
    ],
        [confirmDelete]
    )

    const modal = modalOpen && <Modal {...{ closeModal, update, }} />
    return <>
        <Head>
            <title>Porter Admin - FAQs</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"FAQs"}
                    columns={columns}
                    data={FAQs?.map(faq => ({ ...faq, id: faq.faqId }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[createButton, refreshButton]}
                />
            </div>
        </div>

        {modal}
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

    const FAQs = await prisma.fAQ.findMany()


    return {
        props: {
            FAQs: FAQs.map(e => ({ ...e, createdAt: +e.createdAt })),
        }
    }
}