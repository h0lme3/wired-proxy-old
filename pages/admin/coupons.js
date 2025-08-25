import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState, useRef } from 'react'
import AdminNavBar from '../../components/navbar/navbar.admin'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles, multiSelectStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle, BiBadgeCheck, BiBadge, BiImport } from "react-icons/bi"
import ReactSwitch from 'react-switch'
import { toastLoader } from "../../helpers/notifications"

import { toast } from 'react-toastify'
import Select from 'react-select'

import { parse } from 'papaparse'
import { MIRROR_SITES } from '../../helpers/sites'

function Modal ({ closeModal, update, products }) {

    const initializeForm = update ? { ...update } : { use: 0, minimumQuantity: 0, maximumQuantity: 0, vip: 0, newOrders: 0, oneTime: 0 }
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        switch (e?.target?.type ?? key) {
            case "appliesTo": {
                const choices = e?.map(e => e.value)?.join()
                setForm({ ...form, [key]: choices })
                break
            }
            default: {
                setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
            }
        }
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the coupon...`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/coupon", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coupon: {
                        ...form,
                        start: null,
                        expiry: null,
                        discount: Number(form.discount),
                        maxUses: Number(form.maxUses),
                        use: Number(form.use),
                        minimumQuantity: Number(form.minimumQuantity),
                        maximumQuantity: Number(form.maximumQuantity),
                        vip: Number(form.vip),
                        newOrders: Number(form.newOrders),
                        oneTime: Number(form.oneTime)
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the coupon successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this coupon in the database.`)
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
                            <label>Coupon Code (ID)</label>
                            <input
                                name={"discountCode"}
                                type={"text"}
                                disabled={update}
                                onChange={formChange("discountCode")}
                                value={form?.discountCode ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Discount %</label>
                            <input
                                name={"discount"}
                                type={"text"}
                                onChange={formChange("discount")}
                                value={form?.discount ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Max Uses</label>
                            <input
                                name={"maxUses"}
                                type={"text"}
                                onChange={formChange("maxUses")}
                                value={form?.maxUses ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Current Uses</label>
                            <input
                                name={"use"}
                                type={"text"}
                                onChange={formChange("use")}
                                value={form?.use ?? 0}
                                required
                            />
                        </div>


                        <div>
                            <label>Minimum Quantity</label>
                            <input
                                name={"minimumQuantity"}
                                type={"text"}
                                onChange={formChange("minimumQuantity")}
                                value={form?.minimumQuantity ?? 0}
                                required
                            />
                        </div>

                        <div>
                            <label>Maximum Quantity</label>
                            <input
                                name={"maximumQuantity"}
                                type={"text"}
                                onChange={formChange("maximumQuantity")}
                                value={form?.maximumQuantity ?? 0}
                                required
                            />
                        </div>


                        <div>
                            <label>Applies To</label>
                            <Select
                                options={products.map(e => ({ value: e.productName, label: e.productName }))}
                                styles={multiSelectStyles}
                                isMulti={true}
                                isClearable={true}
                                closeMenuOnSelect={false}
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
                                onChange={formChange("appliesTo")}
                                defaultValue={form?.appliesTo?.split(',').map(e => ({ value: e, label: e }))}
                            />
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
                                onChange={formChange("site")}
                                defaultValue={{ value: form?.site, label: form?.site }}
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: "0px" }}>

                            <div>
                                <label>Coupon VIP?</label>
                                <ReactSwitch
                                    checked={!!form?.vip ?? false}
                                    onChange={formChange("vip")}
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
                                <label>New Orders Only?</label>
                                <ReactSwitch
                                    checked={!!form?.newOrders ?? false}
                                    onChange={formChange("newOrders")}
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
                                <label>One Time Only? (Wired)</label>
                                <ReactSwitch
                                    checked={!!form?.oneTime ?? false}
                                    onChange={formChange("oneTime")}
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
                                <label>Coupon Active</label>
                                <ReactSwitch
                                    checked={!!form?.active ?? false}
                                    onChange={formChange("active")}
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

export default function Coupons ({ coupons, products }) {

    const router = useRouter()
    const fileRef = useRef()

    const [selection, setSelection] = useState([])
    const [clearSelection, setClearSelection] = useState(false)

    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = coupon => e => {
        setUpdate(coupon)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }

    const handleRowSelection = (e) => {
        setSelection(e?.selectedRows?.map(e => e.id))
    }

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
                return toastError(`Found ${errors.length} errors in the CSV file, please fix them and reupload the file.`)

            let successCount = 0
            for (let entry of data) {
                try {

                    const res = await fetch("/api/admin/coupon", {

                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            coupon: {
                                discountCode: entry.discountCode,
                                start: null,
                                expiry: null,
                                active: Number(entry.active),
                                discount: Number(entry.discount),
                                maxUses: Number(entry.maxUses),
                                use: Number(entry?.use ?? 0),
                                minimumQuantity: Number(entry?.minimumQuantity ?? 0),
                                maximumQuantity: Number(entry?.maximumQuantity ?? 0),
                                vip: Number(entry?.vip ?? 0),
                                appliesTo: entry.appliesTo,
                                newOrders: Number(entry?.newOrders ?? 0),
                                oneTime: Number(entry?.oneTime ?? 0),
                                site: entry?.site ?? undefined
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

            toastSuccess(`Imported ${successCount}/${data.length} coupons!`)
            router.replace(router.asPath)

        } catch (error) {
            toastError(error)
        }

    }

    const toggleSelectionStatus = useCallback((selection, toggle) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to {toggle ? "enable" : "disable"} {selection.length} selected coupon(s)?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Updating ${selection.length} selected coupon(s)...`)

            try {

                const res = await fetch("/api/admin/coupon", {

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
                toastSuccess(`Updated ${selection.length} selected coupon(s)`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't update ${selection.length} selected coupon(s)`)
            }

        }

    }, [clearSelection, router])


    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected coupon(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected coupon(s)`}...`)

            try {

                const res = await fetch("/api/admin/coupon", {

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
                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected coupon(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected coupon(s)`}`)
            }

        }

    }, [clearSelection, router])

    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Coupon"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])
    const importButton = useMemo(() => <BiImport key={2} title={"Import Coupons CSV"} style={{ cursor: "pointer", fontSize: "28px", color: "#5CFF94" }} onClick={() => fileRef.current.click()} />, [fileRef])

    const columns = useMemo(() => [
        {
            name: "Code",
            selector: row => row.discountCode,
            sortable: true,
            grow: 2,
        },

        {
            name: "Discount %",
            selector: row => row.discount,
            sortable: true,
            grow: 2
        },


        {
            name: "Applies To",
            selector: row => row.appliesTo?.split(',')?.length > 1 ? row.appliesTo?.split(',')?.length + ' Products' : row.appliesTo,
            sortable: true,
            grow: 2,
        },

        {
            name: "Max Uses",
            selector: row => row.maxUses,
            sortable: true,
            grow: 2,
        },

        {
            name: "Uses",
            selector: row => row.use,
            sortable: true,
            grow: 2,
        },

        {
            name: "Min Qty",
            selector: row => row.minimumQuantity,
            sortable: true,
            grow: 1,
        },

        {
            name: "Max Qty",
            selector: row => row.maximumQuantity,
            sortable: true,
            grow: 1,
        },
        {
            name: "VIP",
            selector: row => row.vip ? "Yes" : "No",
            sortable: true,
            grow: 1
        },

        {
            name: "New Orders",
            selector: row => row.newOrders ? "Yes" : "No",
            sortable: true,
            grow: 1
        },

        {
            name: "One Time",
            selector: row => row.oneTime ? "Yes" : "No",
            sortable: true,
            grow: 1
        },


        {
            name: "Site",
            selector: row => row.site,
            sortable: true,
            grow: 1
        },

        {
            name: "Status",
            selector: row => row.active ? "Active" : "Inactive",
            sortable: true,
            grow: 1
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => (
                <div style={{ display: 'flex', gap: "8px" }}>
                    <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Coupon"} />
                    <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Coupon"} />
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

    const modal = modalOpen && <Modal {...{ closeModal, update, products }} />
    return <>
        <Head>
            <title>Porter Admin - Coupons</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <input type='file' id='file' ref={fileRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileChange} />
                <DataTable
                    title={"Coupons"}
                    columns={columns}
                    data={coupons?.map(coupon => ({ ...coupon, id: coupon.discountCode }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[importButton, createButton, refreshButton]}
                    selectableRows={true}
                    onSelectedRowsChange={handleRowSelection}
                    clearSelectedRows={clearSelection}
                    contextActions={[globalEnableButton, globalDisableButton, globalDeleteButton]}
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

    const coupons = await prisma.promotion.findMany()

    const products = await prisma.product.findMany({
        select: {
            productName: true
        }
    })

    return {
        props: {
            coupons: [...coupons?.map((coupon) => ({ ...coupon, start: null, expiry: null }))],
            products
        }
    }
}