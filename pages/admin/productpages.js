import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useMemo, useState } from 'react'
import AdminNavBar from '../../components/navbar/navbar.admin'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, BiPlusCircle, BiMinusCircle } from "react-icons/bi"
import { toastLoader } from "../../helpers/notifications"
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

const utcOffset = dayjs().utcOffset()

function Modal({ closeModal, update, products }) {

    const initializeForm = update ? { ...update } : {}
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        switch (e?.target?.type) {
            case "datetime-local": {
                const ts = +new Date(e?.target?.value)
                if (!isNaN(ts)) {
                    setForm({ ...form, [key]: ts })
                }
                break
            }
            default: {
                setForm({ ...form, [key]: e?.target?.value ?? +e })
            }
        }
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the product page...`)

        if (isNaN(form.productPageDispatch))
            return toastError(`ProductPage dispatch should be a valid date.`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/productpage", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productPage: {
                        ...form,
                        productPageDispatch: dayjs(form.productPageDispatch).toJSON()
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the product page successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this product page in the database.`)
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
                            <label>Page ID</label>
                            <input
                                name={"productPageId"}
                                type={"text"}
                                disabled={update}
                                onChange={formChange("productPageId")}
                                value={form?.productPageId ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Product</label>

                            <select                                 
                                name={"productName"}
                                type={"text"}
                                onChange={formChange("productName")}
                                value={form?.productName ?? ""}
                                required
                            >
                                { products.map((e, idx) => <option key={idx} value={e.productName}>{e.productName}</option>)}
                            </select>

                        </div>

                        <div>
                            <label>Page Title</label>
                            <input
                                name={"productPageTitle"}
                                type={"text"}
                                onChange={formChange("productPageTitle")}
                                value={form?.productPageTitle ?? ""}
                                required
                            />
                        </div>

                        <div>
                            <label>Page Dispatch (UTC {!(utcOffset < 0) && "+"}{utcOffset / 60})</label>
                            <input
                                name={"productPageDispatch"}
                                type={"datetime-local"}
                                value={form?.productPageDispatch && dayjs(new Date(form?.productPageDispatch)?.toISOString()).add(utcOffset, "minute").toISOString()?.slice(0, 16)}
                                onChange={formChange("productPageDispatch")}
                                required
                            />
                        </div>
                        
                        <div>
                            <label>Page Description - {`{dispatch} & {title} placeholders will substitute the dispatch and page title`}</label>
                            <textarea
                                name={"productPageDescription"}
                                type={"textarea"}
                                onChange={formChange("productPageDescription")}
                                style={{ minHeight: "80px", height: "auto", maxHeight: "160px" }}
                                value={form?.productPageDescription ?? ""}
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

export default function ProductPages({ productPages, products }) {

    const router = useRouter()

    const [update, setUpdate] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = productPage => e => {
        setUpdate(productPage)
        setModalOpen(true)
    }

    const closeModal = e => {
        setUpdate(null)
        setModalOpen(false)
    }

    

    const confirmDelete = useCallback(productPage => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {productPage.productPageId}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting productPage ${productPage.id}...`)

            try {

                const res = await fetch("/api/admin/productpage", {

                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: productPage.id
                    })

                }).then(res => res.json())

                if (!res.ok) {
                    toastError(res.message)
                    return
                }

                toastSuccess(`Deleted the product page ${productPage.id} successfully.`)
                router.replace(router.asPath)

            } catch (error) {
                toastError(`Couldn't delete this productPage`)
            }

        }

    }, [router])

    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Product Page"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])

    const columns = useMemo(() => [
        {
            name: "Page ID",
            selector: row => row.productPageId,
            sortable: true,
        },

        {
            name: "Product ID",
            selector: row => row.productName,
            sortable: true,
        },

        {
            name: "Title",
            selector: row => row.productPageTitle,
            sortable: true,
        },

        {
            name: "Dispatch Time",
            selector: row => dayjs(row.productPageDispatch).toISOString(),
            sortable: true,
        },

        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => (
                <div style={{ display: 'flex', gap: "8px" }}>
                    <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Product Page"} />
                    <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Product Page"} />
                </div>
            )
        },
    ],
        [confirmDelete]
    )


    const modal = modalOpen && <Modal {...{ closeModal, update, products }} />
    return <>
        <Head>
            <title>Porter Admin - Product Pages</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Product Pages"}
                    columns={columns}
                    data={productPages?.map(productPage => ({ ...productPage, id: productPage.productPageId }))}
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


export async function getServerSideProps({ req }) {

    const session = await getSession({ req })
    if (!session || !session?.user?.admin || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const productPages = await prisma.productPage.findMany()
    const products = await prisma.product.findMany({
        select: {
            productName: true
        }
    })

    return {
        props: {
            productPages: [...productPages?.map((productPage) => ({ ...productPage, productPageDispatch: +productPage.productPageDispatch }))],
            products: [...products]
        }
    }
}