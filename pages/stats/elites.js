import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState } from 'react'
import StatsNavBar from '../../components/navbar/navbar.stats'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles, countriesList, multiSelectStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle, BiBadge, BiBadgeCheck } from "react-icons/bi"
import ReactSwitch from 'react-switch'
import { toastLoader } from "../../helpers/notifications"
import { toast } from 'react-toastify'

import Select from 'react-select'
import { CURRENT_SITE, MIRROR_SITES } from '../../helpers/sites'


function Modal ({ closeModal, update, managers }) {

    const initializeForm = update ? { ...update } : {}
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the elite...`)


        if (!form.discordId || !form.discordName || !form.country || !form.email || !form.manager || !form.type || !form.notes)
            return toastError(`Some fields are empty, please fill them before submitting`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/elites", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    elite: {
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

            toastSuccess(`${update ? "Updated" : "Created"} the elite successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this elite`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create Elite`}
                    </p>

                    <div className={Styles.inputs}>



                        <div>
                            <label>Discord ID</label>
                            <input
                                name={"discordId"}
                                type={"text"}
                                value={form?.discordId ?? ""}
                                onChange={formChange("discordId")}
                                required
                            />
                        </div>


                        <div>
                            <label>Discord Name</label>
                            <input
                                name={"discordName"}
                                type={"text"}
                                value={form?.discordName ?? ""}
                                onChange={formChange("discordName")}
                                required
                            />
                        </div>


                        <div>
                            <label>Email</label>
                            <input
                                name={"email"}
                                type={"text"}
                                value={form?.email ?? ""}
                                onChange={formChange("email")}
                                required
                            />
                        </div>

                        <div>
                            <label>Status</label>
                            <Select
                                options={["Active", "Inactive"].map(e => ({ value: e, label: e }))}
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
                            />
                        </div>

                        <div>
                            <label>Type</label>
                            <Select
                                options={["Normal", "Sponsored", "Staff", "Bulk"].map(e => ({ value: e, label: e }))}
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
                                onChange={formChange("type")}
                                defaultValue={{ value: form?.type, label: form?.type }}
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
                            />

                        </div>


                        <div>
                            <label>Notes</label>
                            <textarea
                                name={"notes"}
                                type={"textarea"}
                                onChange={formChange("notes")}
                                style={{ minHeight: "80px", height: "auto", maxHeight: "160px" }}
                                value={form?.notes ?? ""}
                                required
                            ></textarea>
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

export default function Elites ({ elites, posts, managers }) {

    const router = useRouter()

    const [search, setSearch] = useState('')
    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = elite => e => {
        setUpdate(elite)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }

    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected elite(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected elite(s)`}...`)

            try {

                const res = await fetch("/api/admin/elites", {

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

                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected elite(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected elite(s)`}`)
            }

        }

    }, [router])


    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Elite"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])
    const searchField = useMemo(() => <div key={2} className={Styles.inputs} style={{ padding: 0, width: "240px" }}><input type="text" placeholder='Search...' onChange={(e) => setSearch(e.target.value)} /></div>, [])

    const columns = useMemo(() => [

        {
            name: "Status",
            selector: row => row.status,
            sortable: true,
        },


        {
            name: "Type",
            selector: row => row.type,
            sortable: true,
        },


        {
            name: "Country",
            selector: row => row.country,
            sortable: true,
        },

        {
            name: "Manager",
            selector: row => {
                const manager = managers.find(e => e.customerId == row.manager)
                return manager ? manager.firstName + ' ' + manager.lastName + ` (ID: ${row.manager})` : 'ID: ' + row.manager
            },
            sortable: true,
            grow: 1.5,
        },

        {
            name: "Discord ID",
            selector: row => row.discordId,
            sortable: true,
            grow: 1.5

        },

        {
            name: "Discord Name",
            selector: row => row.discordName,
            sortable: true,
        },

        {
            name: "Email",
            selector: row => row.email,
            sortable: true,
            grow: 1.5
        },

        {
            name: "Notes",
            selector: row => row.notes,
            sortable: true,
            grow: 1.5

        },


        {
            name: "Posts This Month",
            selector: row => posts[row.discordId]?.currentMonth ?? '0',
            sortable: true,

        },


        {
            name: "Posts Last Month",
            selector: row => posts[row.discordId]?.lastMonth ?? '0',
            sortable: true,
        },


        {
            name: "Posts All Time",
            selector: row => posts[row.discordId]?.allTime ?? '0',
            sortable: true,
        },


        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Elite"} />
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Elite"} />
            </div>
        },
    ],
        [managers, confirmDelete, posts]
    )


    const data = !search ? elites : elites.filter(e => Object.values?.(e)?.some(e => {
        if (typeof e === "string") {
            return e.toLowerCase().includes(search.toLowerCase())
        } else {
            return e == search
        }
    }))

    const modal = modalOpen && <Modal {...{ closeModal, update, managers }} />
    return <>
        <Head>
            <title>Porter Stats - Elites</title>
        </Head>

        <StatsNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Elites"}
                    columns={columns}
                    data={data?.map(elite => ({ ...elite, id: elite.eliteId }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[searchField, createButton, refreshButton]}

                />
            </div>
        </div>

        {modal}
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
            email: true,
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
            firstName: true,
            lastName: true,
        }
    })

    const elites = await prisma.elite.findMany(isPr ? {
        where: {
            manager: session.user.customerId
        }
    } : undefined)

    const customers = await prisma.customer.findMany({
        where: {
            discordId: {
                in: elites.map(e => e.discordId).filter(e => typeof e == "string")
            }
        },
        select: {
            customerId: true,
            discordId: true
        }
    })

    const posts = await prisma.successPost.findMany({
        where: {
            customerId: {
                in: customers.map(e => e.customerId.toString())
            }
        }
    })

    const postData = {}

    for (let post of posts) {
        const discordId = customers.find(e => e.customerId == post.customerId).discordId
        if (!postData[discordId])
            postData[discordId] = { currentMonth: 0, lastMonth: 0, allTime: 0 }

        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
        const lastMonth = (new Date().getMonth()).toString().padStart(2, '0')

        if (post.period.startsWith(currentMonth))
            postData[discordId].currentMonth++


        if (post.period.startsWith(lastMonth))
            postData[discordId].lastMonth++


        postData[discordId].allTime++

    }

    return {
        props: {
            elites: elites.map(e => ({ ...e, createdAt: +e.createdAt })),
            posts: postData,
            managers: managers,
        }
    }
}