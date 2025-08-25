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


function Modal ({ closeModal, update, pools, poolsQuantity, accountQuantity }) {

    const initializeForm = update ? { ...update } : { productResi: 0, productVip: 0, productActive: 0, productRecurring: 0, productExtendable: 0, productHomepage: 0, productDescription: "", productTitle: "", productEliteDiscount: 0, productSite: "", productPreorder: 0, productFilter: "" }
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the product...`)

        if (isNaN(form.productStock))
            return toastError(`Product stock should be a number.`)

        try {

            const pricingData = JSON.parse(form.productPricing)
            const mockQuantity = pricingData.min
            const mockPeriod = pricingData.defaultPeriod

            const range = pricingData.ranges.find(r => mockQuantity <= r.max && mockQuantity >= r.min)
            const multiplier = pricingData.periods[mockPeriod]
            const price = (mockQuantity * range.multiplier) * multiplier

            if (isNaN(price))
                throw new Error(`Failed`)

        } catch (error) {
            return toastError(`Product pricing evaluation failed, please make sure it's JSON and uses the correct format for pricing data`)
        }

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/product", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product: {
                        ...form,
                        productStock: Number(form.productStock),
                        productPricing: JSON.stringify(JSON.parse(form.productPricing), null, 2),
                        productEliteDiscount: Number(form.productEliteDiscount),
                        productName: form.productName?.trim()
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the product successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this product`)
            setSubmitting(false)
        }

    }
    const poolAvailableQty = (form?.productPool && (poolsQuantity?.find(e => e.type === form.productPool)?._count || accountQuantity?.find(e => e.type === form.productPool)?._count))
    const poolAvailableQtyDisplay = "Pool Available Qty: " + (form?.productPool?.startsWith("SN_") ? poolAvailableQty / 256 : poolAvailableQty || " - ")

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.id}` : `Create Product`}
                    </p>

                    <div className={Styles.inputs}>
                        <div>
                            <label>Product ID</label>
                            <input
                                name={"productName"}
                                type={"text"}
                                value={form?.productName ?? ""}
                                onChange={formChange("productName")}
                                required
                                disabled={update}
                            />
                        </div>

                        <div>
                            <label>Product Pool </label>
                            <input
                                name={"productPool"}
                                list="poolOptions"
                                onChange={formChange("productPool")}
                                value={form?.productPool ?? ""}
                                required
                            />
                            <datalist id="poolOptions">
                                {pools.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
                            </datalist>

                        </div>

                        <div>
                            <label>Product Pricing</label>
                            <textarea
                                name={"productPricing"}
                                type={"textarea"}
                                onChange={formChange("productPricing")}
                                style={{ minHeight: "38px", height: "auto", maxHeight: "160px" }}
                                value={form?.productPricing ?? ""}
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label>Product Stock ({poolAvailableQtyDisplay}) </label>
                            <input
                                name={"productStock"}
                                type={"text"}
                                value={form?.productStock ?? ""}
                                onChange={formChange("productStock")}
                                required
                            />
                        </div>

                        <div>
                            <label>Product Elite Discount %</label>
                            <input
                                name={"productEliteDiscount"}
                                type={"text"}
                                value={form?.productEliteDiscount ?? ""}
                                onChange={formChange("productEliteDiscount")}
                                required
                            />
                        </div>


                        <div>
                            <label>Product Dispatch Time (Calendar 1 Day Products) (UTC)</label>
                            <input
                                name={"productDispatchTime"}
                                type={"time"}
                                value={form?.productDispatchTime ?? ""}
                                onChange={formChange("productDispatchTime")}
                                required
                            />
                        </div>

                        <div>
                            <label>Product Title </label>
                            <input
                                name={"productTitle"}
                                type={"text"}
                                value={form?.productTitle ?? ""}
                                onChange={formChange("productTitle")}
                                required
                            />
                        </div>

                        <div>
                            <label>Product Description</label>
                            <textarea
                                name={"productDescription"}
                                type={"textarea"}
                                onChange={formChange("productDescription")}
                                style={{ minHeight: "38px", height: "auto", maxHeight: "160px" }}
                                value={form?.productDescription ?? ""}
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
                                onChange={formChange("productSite")}
                                defaultValue={{ value: form?.productSite, label: form?.productSite }}
                            />
                        </div>

                        <div>
                            <label>Product Filter (category: events; type: subnet; country: united states; ...) </label>
                            <input
                                name={"productFilter"}
                                type={"text"}
                                value={form?.productFilter ?? ""}
                                onChange={formChange("productFilter")}
                                required
                            />
                        </div>


                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: "px" }}>
                            <div>
                                <label>Product Extendable?</label>
                                <ReactSwitch
                                    checked={!!form?.productExtendable ?? false}
                                    onChange={formChange("productExtendable")}
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
                                <label>Product Recurring?</label>
                                <ReactSwitch
                                    checked={!!form?.productRecurring ?? false}
                                    onChange={formChange("productRecurring")}
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
                                <label>Display On Homepage?</label>
                                <ReactSwitch
                                    checked={!!form?.productHomepage ?? false}
                                    onChange={formChange("productHomepage")}
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
                                <label>Product<br />Active?</label>
                                <ReactSwitch
                                    checked={!!form?.productActive ?? false}
                                    onChange={formChange("productActive")}
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", marginBottom: "5px" }}>
                            <div>
                                <label>VIP<br />Product?</label>
                                <ReactSwitch
                                    checked={!!form?.productVip ?? false}
                                    onChange={formChange("productVip")}
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
                                <label>Resi<br />Product?</label>
                                <ReactSwitch
                                    checked={!!form?.productResi ?? false}
                                    onChange={formChange("productResi")}
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
                                <label>Server<br />Product?</label>
                                <ReactSwitch
                                    checked={!!form?.productServer ?? false}
                                    onChange={formChange("productServer")}
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
                                <label>Accounts<br />Product?</label>
                                <ReactSwitch
                                    checked={!!form?.productAccount ?? false}
                                    onChange={formChange("productAccount")}
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
                                <label>Preorders<br />Enabled?</label>
                                <ReactSwitch
                                    checked={!!form?.productPreorder ?? false}
                                    onChange={formChange("productPreorder")}
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

export default function Products ({ products, pools, publicToggle, poolsQuantity, accountQuantity, trialToggle, trialDays, cartHold }) {

    const router = useRouter()

    const [publicToggleState, setPublicToggleState] = useState(publicToggle)
    const [trialToggleState, setTrialToggleState] = useState(trialToggle)
    const [cartHoldState, setCartHoldState] = useState(cartHold)

    const [selection, setSelection] = useState([])
    const [clearSelection, setClearSelection] = useState(false)

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

    const handleRowSelection = (e) => {
        setSelection(e?.selectedRows?.map(e => e.id))
    }


    const toggleSelectionStatus = useCallback((selection, toggle) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to {toggle ? "enable" : "disable"} {selection.length} selected product(s)?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Updating ${selection.length} selected product(s)...`)

            try {

                const res = await fetch("/api/admin/product", {

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
                toastSuccess(`Updated ${selection.length} selected product(s)`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't update ${selection.length} selected product(s)`)
            }

        }

    }, [clearSelection, router])

    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {!many ? data.id : `${data.length} selected product(s)`}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting ${!many ? data.id : `${data.length} selected product(s)`}...`)

            try {

                const res = await fetch("/api/admin/product", {

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
                toastSuccess(`Deleted ${!many ? data.id : `${data.length} selected product(s)`} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete ${!many ? data.id : `${data.length} selected product(s)`}`)
            }

        }

    }, [clearSelection, router])


    const toggleCartHold = useCallback(async toggle => {

        const { toastSuccess, toastError } = toastLoader(`${toggle ? 'Enabling' : 'Disabling'} the cart hold.`)

        try {

            const res = await fetch("/api/admin/cartholdtoggle", {

                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toggle: +toggle
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                return
            }

            setCartHoldState(toggle)
            toastSuccess(`${toggle ? 'Enabled' : 'Disabled'} the cart hold.`)

        } catch (error) {
            toastError(error.message)
        }

    }, [])


    const togglePublicToggle = useCallback(async toggle => {

        const { toastSuccess, toastError } = toastLoader(`${toggle ? 'Enabling' : 'Disabling'} the public toggle.`)

        try {

            const res = await fetch("/api/admin/publictoggle", {

                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toggle: +toggle
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                return
            }

            setPublicToggleState(toggle)
            toastSuccess(`${toggle ? 'Enabled' : 'Disabled'} the public toggle.`)

        } catch (error) {
            toastError(error.message)
        }

    }, [])


    const toggleTrialToggle = useCallback(async toggle => {

        const { toastSuccess, toastError } = toastLoader(`${toggle ? 'Enabling' : 'Disabling'} the Porter VIP Trial toggle.`)

        try {

            const res = await fetch("/api/admin/trialtoggle", {

                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toggle: +toggle
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                return
            }

            setTrialToggleState(toggle)
            toastSuccess(`${toggle ? 'Enabled' : 'Disabled'} the Porter VIP Trial toggle.`)

        } catch (error) {
            toastError(error.message)
        }

    }, [])


    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Product Page"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])

    const cartHoldButton = useMemo(() => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} key={2}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Cart hold: </label>
        <ReactSwitch
            checked={!!cartHoldState}
            onChange={toggleCartHold}
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
    </div>, [cartHoldState, toggleCartHold])

    const publicToggleButton = useMemo(() => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} key={3}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Public: </label>
        <ReactSwitch
            checked={!!publicToggleState}
            onChange={togglePublicToggle}
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
    </div>, [publicToggleState, togglePublicToggle])

    const trialToggleButton = useMemo(() => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} key={4}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Porter VIP Trial ({trialDays} days): </label>
        <ReactSwitch
            checked={!!trialToggleState}
            onChange={toggleTrialToggle}
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
    </div>, [trialDays, trialToggleState, toggleTrialToggle])


    const columns = useMemo(() => [

        {
            name: "ID",
            selector: row => row.productName,
            sortable: true,
            grow: 2,
        },

        {
            name: "Title",
            selector: row => row.productTitle,
            sortable: true,
        },


        {
            name: "Pool",
            selector: row => row.productPool,
            sortable: true,
        },


        {
            name: "Stock",
            selector: row => row.productStock,
            sortable: true,
        },

        {
            name: "Recurring",
            selector: row => row.productRecurring ? "Yes" : "No",
            sortable: true,
        },

        {
            name: "Extendable",
            selector: row => row.productExtendable ? "Yes" : "No",
            sortable: true,
        },

        {
            name: "Homepage",
            selector: row => row.productHomepage ? "Yes" : "No",
            sortable: true,
        },

        {
            name: "Type",
            selector: row => (
                row.productVip ? "VIP" :
                    row.productResi ? "Resi" :
                        row.productServer ? "Server" :
                            row.productAccount ? "Accounts" :
                                row.productPool === "PORTER_VIP" ? "Porter VIP" :
                                    "ISP"
            ),
            sortable: true,
        },


        {
            name: "Elite Discount",
            selector: row => row.productEliteDiscount ? `${row.productEliteDiscount}%` : "No",
            sortable: true,
        },

        {
            name: "Site",
            selector: row => row.productSite,
            sortable: true,
        },

        {
            name: "Status",
            selector: row => row.productActive ? "Active" : "Inactive",
            sortable: true,
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Product"} />
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Product"} />
            </div>
        },
    ],
        [confirmDelete]
    )

    const globalDisableButton = useMemo(() => <BiBadge key={1} onClick={toggleSelectionStatus(selection, 0)} style={{ cursor: "pointer", fontSize: "20px", color: "#FFCC61", marginLeft: "10px" }} title={"Disable Products"} />, [selection, toggleSelectionStatus])
    const globalEnableButton = useMemo(() => <BiBadgeCheck key={2} onClick={toggleSelectionStatus(selection, 1)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94", marginLeft: "10px" }} title={"Enable Products"} />, [selection, toggleSelectionStatus])

    const modal = modalOpen && <Modal {...{ closeModal, update, pools, poolsQuantity, accountQuantity }} />
    return <>
        <Head>
            <title>Porter Admin - Products</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Products"}
                    columns={columns}
                    data={products?.map(product => ({ ...product, id: product.productName }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[cartHoldButton, trialToggleButton, publicToggleButton, createButton, refreshButton]}
                    selectableRows={true}
                    onSelectedRowsChange={handleRowSelection}
                    clearSelectedRows={clearSelection}
                    contextActions={[globalEnableButton, globalDisableButton,]}
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

    const products = await prisma.product.findMany({
        include: {
            productOrders: false,
            productPages: false
        }
    })

    const pools = await prisma.proxy.groupBy({
        by: ['type'],
        where: {
            status: "AVAILABLE"
        },
        _count: true
    })

    const accountPools = await prisma.account.groupBy({
        by: ['type'],
        where: {
            status: "AVAILABLE"
        },
        _count: true
    })

    const config = await prisma.config.findUnique({
        where: {
            configId: 1
        },
        select: {
            publicToggle: true,
            porterVipTrialDays: true,
            porterVipTrialToggle: true,
            cartHoldActive: true
        }
    })

    return {
        props: {
            products,
            pools: [...pools?.map(e => e?.type)],
            poolsQuantity: [...pools],
            accountQuantity: [...accountPools],
            publicToggle: config?.publicToggle ?? false,
            trialToggle: config?.porterVipTrialToggle ?? false,
            trialDays: config?.porterVipTrialDays ?? 0,
            cartHold: config?.cartHoldActive ?? false
        }
    }
}