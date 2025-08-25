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

    const initializeForm = update ? { ...update } : { guideSlug: "", guideIcon: "", guideTitle: "", guideDescription: "", guideContent: "", guideSite: "guideSite" }
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the guide...`)

        try {
            setSubmitting(true)

            const res = await fetch("/api/admin/guide", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guide: {
                        ...form,
                        guideSlug: form.guideSlug?.toLowerCase()?.trim(),
                        createdAt: undefined
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the guide successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this guide`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create Guide`}
                    </p>

                    <div className={Styles.inputs}>

                        <div>
                            <label>Guide Slug (lowercase ID with no spaces) - (example: insomniac-guide)</label>
                            <input
                                name={"guideSlug"}
                                type={"text"}
                                value={form?.guideSlug ?? ""}
                                onChange={formChange("guideSlug")}
                                required
                                disabled={update}
                            />
                        </div>

                        <div>
                            <label>Guide Title</label>
                            <input
                                name={"guideTitle"}
                                type={"text"}
                                value={form?.guideTitle ?? ""}
                                onChange={formChange("guideTitle")}
                                required
                            />
                        </div>
                        <div>
                            <label>Guide Description</label>
                            <input
                                name={"guideDescription"}
                                type={"text"}
                                value={form?.guideDescription ?? ""}
                                onChange={formChange("guideDescription")}
                                required
                            />
                        </div>

                        <div>
                            <label>Guide Icon (direct image link)</label>
                            <input
                                name={"guideIcon"}
                                type={"text"}
                                value={form?.guideIcon ?? ""}
                                onChange={formChange("guideIcon")}
                                required
                            />
                        </div>

                        <div>
                            <label>Guide Filters (applications, getting started, technical, ...) </label>
                            <input
                                name={"guideFilters"}
                                type={"text"}
                                value={form?.guideFilters ?? ""}
                                onChange={formChange("guideFilters")}
                                required
                            />
                        </div>


                        <div>
                            <label>Guide Content (Markdown)</label>
                            <textarea
                                name={"guideContent"}
                                type={"textarea"}
                                onChange={formChange("guideContent")}
                                style={{ minHeight: "280px", height: "auto", maxHeight: "360px" }}
                                value={form?.guideContent ?? ""}
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
                                onChange={formChange("guideSite")}
                                defaultValue={{ value: form?.guideSite, label: form?.guideSite }}
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

export default function Guides ({ guides }) {

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
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected guide(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected guides(s)`}...`)

            try {

                const res = await fetch("/api/admin/guide", {

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

                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected guide(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected guide(s)`}`)
            }

        }

    }, [router])




    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Product Page"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])

    const columns = useMemo(() => [

        {
            name: "Slug",
            selector: row => row.guideSlug,
            sortable: true,

        },

        {
            name: "Title",
            selector: row => row.guideTitle,
            sortable: true,
        },

        {
            name: "Site",
            selector: row => row.guideSite,
            sortable: true,
        },


        {
            name: "Short Description",
            selector: row => row.guideDescription,
            sortable: true,
        },


        {
            name: "Filters",
            selector: row => row.guideFilters,
            sortable: true,
        },

        {
            name: "Created At",
            selector: row => new Date(row.createdAt).toISOString(),
            sortable: true,
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Guide"} />
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Guide"} />
            </div>
        },
    ],
        [confirmDelete]
    )

    const modal = modalOpen && <Modal {...{ closeModal, update, }} />
    return <>
        <Head>
            <title>Porter Admin - Guides</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Guides"}
                    columns={columns}
                    data={guides?.map(guide => ({ ...guide, id: guide.guideSlug }))}
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

    const guides = await prisma.guide.findMany()


    return {
        props: {
            guides: guides.map(e => ({ ...e, createdAt: +e.createdAt })),
        }
    }
}