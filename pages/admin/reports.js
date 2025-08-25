import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import dayjs from 'dayjs'

function compare (a, b, sort) {
    if (typeof (a) == "string" && a.startsWith("$")) {
        const aClean = parseFloat(a.replace('$', ''))
        const bClean = parseFloat(b.replace('$', ''))
        return sort === "asc" ? aClean - bClean : bClean - aClean
    } else if (!isNaN(parseFloat(a)) && !isNaN(parseFloat(b))) {
        return sort === "asc" ? parseFloat(a) - parseFloat(b) : parseFloat(b) - parseFloat(a)
    } else {
        return sort === "asc" ? a.toString().localeCompare(b.toString()) : b.toString().localeCompare(a.toString())
    }
}


function get30DaysBeforeNow () {
    const inputDateTime = dayjs()
    const fromDate = inputDateTime.subtract(30, 'days')
    return fromDate.toDate()
}

function getStartAndEndOfMonth (inputDate) {
    const inputDateTime = dayjs(inputDate)
    const startOfMonth = inputDateTime.startOf('month')
    const endOfMonth = inputDateTime.add(1, 'month').startOf('month')
    return {
        start: startOfMonth.toDate(),
        end: endOfMonth.toDate()
    }
}

function getStartAndEndWithCustomOffset (offsetMonths) {
    if (!Number.isInteger(offsetMonths) || offsetMonths < 0) {
        throw new Error('Invalid offset value. Please provide a non-negative integer.')
    }

    const currentDate = dayjs()
    const startDate = currentDate.subtract(offsetMonths, 'month').startOf('month')
    const endDate = currentDate

    return {
        start: startDate.toDate(),
        end: endDate.toDate()
    }
}

function ViewCustomer ({ closeModal, data, products, row }) {
    const rows = data.filter(e => e.email === row.email || e.reportMainEmail === row.email)

    const columns = [

        {
            name: "Email",
            selector: row => row.email + `(ID: ${row.customerId})`,
            sortable: true,
            grow: 3,

        },

        {
            name: "Product",
            selector: row => products.find(e => e.productName === row.productName)?.productTitle || row.productName,
            sortable: true,
            grow: 5,

        },

        {
            name: "Site",
            selector: row => row.site || ' - ',
            sortable: true,
        },

        {
            name: "# Orders",
            selector: row => row.orders,
            sortable: true,
        },

        {
            name: "Total Qty",
            selector: row => row.quantity,
            sortable: true,
        },


        {
            id: "$total",
            name: "Total Sales",
            selector: row => `$` + (row.total).toFixed(2),
            sortable: true,
        },


    ]

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal} style={{ width: "1200px" }} >
                    <p className={Styles.modalTitle}>
                        Grouped Customer Stats for {row.email}
                    </p>

                    <div className={Styles.inputs}>

                        <DataTable
                            dense
                            columns={columns}
                            data={rows?.map((row, idx) => ({ ...row, id: idx }))}
                            theme={'porter'}
                            sortFunction={(rows, field, dir) => rows.sort((a, b) => compare(field(a), field(b), dir)).slice(0)}
                            pagination
                            defaultSortFieldId={'$total'}
                            defaultSortAsc={false}

                        />


                        <div className={Styles.actions}>
                            <button className={Styles.cancel} onClick={closeModal}>
                                <p>
                                    Close
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

function Modal ({ closeModal, update, }) {

    const initializeForm = { ...update, company: update?.note?.split('%%%')[0] || '', contact: update?.note?.split('%%%')[1] || '' }
    delete initializeForm.id

    const [form, setForm] = useState(initializeForm)
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()

    const formChange = key => e => {
        setForm({ ...form, [key]: e?.target?.value ?? e?.value ?? +e })
    }

    const submitModal = async e => {

        const { toastSuccess, toastError } = toastLoader(`${update ? "Updating" : "Creating"} the customer...`)

        try {

            setSubmitting(true)

            const res = await fetch("/api/admin/customer", {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer: {
                        customerId: update?.customerId,
                        note: form.company || form.contact ? `${form.company}%%%${form.contact}` : null,
                        favourite: form.favourite,
                        reportMainEmail: form.reportMainEmail,
                        email: form.email,
                        potential: !update || update.customerId === form.email,
                    }
                })

            }).then(res => res.json())

            if (!res.ok) {
                toastError(res.message)
                setSubmitting(false)
                return
            }

            toastSuccess(`${update ? "Updated" : "Created"} the customer successfully.`)
            setSubmitting(false)

            closeModal()
            router.replace(router.asPath)

        } catch (error) {
            toastError(`Couldn't create or update this customer`)
            setSubmitting(false)
        }

    }

    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal}>
                    <p className={Styles.modalTitle}>
                        {update ? `Edit ${update.email} (ID: ${update.customerId})` : `Create Potential Customer`}
                    </p>

                    <div className={Styles.inputs}>
                        <div style={!update || update.customerId === update.email ? { display: "none" } : {}}>
                            <label>Customer ID</label>
                            <input
                                name={"customerId"}
                                type={"text"}
                                value={form?.customerId ?? ""}
                                onChange={formChange("customerId")}
                                disabled={update}
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
                                disabled={update}
                            />
                        </div>

                        <div>
                            <label>Company</label>

                            <textarea
                                name={"company"}
                                type={"textarea"}
                                onChange={formChange("company")}
                                style={{ minHeight: "64px", height: "auto", maxHeight: "160px" }}
                                value={form?.company ?? ""}
                                maxLength={200}
                            ></textarea>
                        </div>

                        <div>
                            <label>Contact</label>

                            <textarea
                                name={"contact"}
                                type={"textarea"}
                                onChange={formChange("contact")}
                                style={{ minHeight: "64px", height: "auto", maxHeight: "160px" }}
                                value={form?.contact ?? ""}
                                maxLength={200}
                            ></textarea>
                        </div>

                        <div>
                            <label>Main Email</label>
                            <input
                                name={"reportMainEmail"}
                                type={"text"}
                                value={form?.reportMainEmail ?? ""}
                                onChange={formChange("reportMainEmail")}
                            />
                        </div>

                        <div>
                            <label>Favourite Customer?</label>
                            <ReactSwitch
                                checked={!!form?.favourite ?? false}
                                onChange={formChange("favourite")}
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

export default function Reports ({ products, customers, periodFilter, custom }) {

    const router = useRouter()
    const mountedRef = useRef()

    const [search, setSearch] = useState('')
    const [period, setPeriod] = useState((!periodFilter || periodFilter === 'active') ? 'active' : !custom ? dayjs(periodFilter.start).format('YYYY-MM') : `${custom}`)
    const [filter, setFilter] = useState('')
    const [siteFilter, setSiteFilter] = useState('')
    const [grouped, setGrouped] = useState(false)
    const [favouriteOnly, setFavouriteOnly] = useState(false)
    const [allCustomers, setAllCustomers] = useState(false)

    const [viewPopupOpen, setViewPopupOpen] = useState(false)


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

    const onFilterChange = value => {
        setFilter(value)
    }

    const onSiteFilterChange = value => {
        setSiteFilter(value)
        setFilter('')
    }

    const onPeriodChange = value => {
        setPeriod(value)
    }

    useEffect(() => {
        if (mountedRef.current) {
            router.replace({
                pathname: router.pathname,
                query: {
                    filter,
                    period: period.startsWith('c') ? period.split('-')[1] : period,
                    custom: period.startsWith('c') || null,
                    all: allCustomers || null
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, filter, allCustomers])


    useEffect(() => {
        mountedRef.current = true
    }, [])


    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const searchField = useMemo(() => <div key={2} className={Styles.inputs} style={{ padding: 0, width: "180px" }}><input type="text" placeholder='Search...' onChange={(e) => setSearch(e.target.value)} /></div>, [])
    const filterField = <div key={3} className={Styles.inputs} style={{ padding: 0, width: "180px" }}>
        <select
            className={Styles.select}
            onChange={e => onFilterChange(e?.target?.value)}
            value={filter}
        >
            <option value={''}> {"All Products"} </option>
            {products.filter(e => !siteFilter ? true : e.productSite === siteFilter).map((e, idx) => <option key={idx} value={e.productName}>{e.productTitle}</option>)}
        </select>
    </div>

    const periodFilterField = <div key={4} className={Styles.inputs} style={{ padding: 0, width: "180px" }}>
        <select
            className={Styles.select}
            onChange={e => onPeriodChange(e?.target?.value)}
            value={period}
        >
            <option value={'active'}> Current </option>

            {Array.from({ length: 12 }, (_, i) => dayjs().subtract(i, 'month').format('YYYY-MM')).map((e, idx) =>
                <option key={idx} value={e}>{e}</option>
            )}

            <option value={'c-3'}> 3 Months </option>
            <option value={'c-6'}> 6 Months </option>
            <option value={'c-12'}> 1 Year </option>


        </select>
    </div>



    const siteFilterField = <div key={5} className={Styles.inputs} style={{ padding: 0, width: "180px" }}>
        <select
            className={Styles.select}
            onChange={e => onSiteFilterChange(e?.target?.value)}
            value={siteFilter}
        >
            <option value={''}> All Sites </option>
            <option value={'porter'}> Porter </option>
            <option value={'wired'}> Wired </option>
            <option value={'play'}> Play </option>

        </select>
    </div>

    const groupedButton = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }} key={2}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Group Customers: </label>
        <ReactSwitch
            checked={!!grouped}
            onChange={setGrouped}
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
            disabled={!(!filter || filter == 'active')}
        />
    </div>


    const favouriteOnlyButton = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }} key={2}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Show Favourite Only: </label>
        <ReactSwitch
            checked={!!favouriteOnly}
            onChange={setFavouriteOnly}
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


    const loadAllCustomersButton = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }} key={2}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Load All Customers: </label>
        <ReactSwitch
            checked={!!allCustomers}
            onChange={setAllCustomers}
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

    const createButton = useMemo(() => <BiPlusCircle key={1} title={"Add Potential Customer"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={openModal(null)} />, [])


    const confirmDelete = useCallback((data, many = false) => async e => {

        const confirmPopUp = <>
            <p>Are you sure you want to delete {data.email}?</p>
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

            const { toastSuccess, toastError } = toastLoader(`Deleting potential customer ${data.email}...`)

            try {

                const res = await fetch("/api/admin/customer", {

                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: data.email,
                    })

                }).then(res => res.json())

                if (!res.ok) {
                    toastError(res.message)
                    return
                }

                toastSuccess(`Deleted potential customer ${data.email}!`)
                router.replace(router.asPath)

            } catch (error) {
                console.log(error)
                toastError(`Couldn't delete potential customer`)
            }

        }

    }, [router])


    const columns = useMemo(() => [

        {
            id: "id",
            name: "Customer",
            selector: row => `${row.email}  ${row.discordId ? `[${row.discordId}]` : ''}`,
            sortable: true,
            grow: 3,
        },

        {
            name: "Product",
            selector: row => products.find(e => e.productName === row.productName)?.productTitle || row.productName,
            sortable: true,
            grow: 3,

        },

        {
            name: "Site",
            selector: row => row.site || ' - ',
            sortable: true,
        },

        {
            name: "Company",
            selector: row => row.note?.split('%%%')[0] || ' - ',
            sortable: true,
            grow: 2,
        },

        {
            name: "Contact",
            selector: row => row.note?.split('%%%')[1] || ' - ',
            sortable: true,
            grow: 2,
        },

        {
            name: "# Orders",
            selector: row => row.orders,
            sortable: true,
        },

        {
            name: "Total Qty",
            selector: row => row.quantity,
            sortable: true,
        },


        {
            id: "$total",
            name: "Total Sales",
            selector: row => `$` + (row.total).toFixed(2),
            sortable: true,
        },

        {
            name: "Favourite",
            selector: row => row.favourite ? 'Yes' : 'No',
            sortable: true,
        },



        {
            name: "Actions",
            button: true,
            right: true,
            cell: row => <div style={{ display: 'flex', gap: "8px" }}>
                {row.email === row.customerId ? <BiMinusCircle key={0} onClick={confirmDelete(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#FF2976" }} title={"Delete Potential Customer"} /> : <></>}
                <BiEdit key={1} onClick={openModal(row)} style={{ cursor: "pointer", fontSize: "20px", color: "#5CFF94" }} title={"Edit Product"} />
            </div>
        },
    ],
        [products, confirmDelete]
    )



    const favouriteFiltered = !favouriteOnly ? customers : customers.filter(e => e.favourite)
    const siteFiltered = !siteFilter ? favouriteFiltered : favouriteFiltered.filter(e => e.site === siteFilter)
    const groupedData = (!grouped) ? siteFiltered : Object.values(siteFiltered.reduce((acc, customer) => {

        const key = customer.reportMainEmail || customer.email

        if (!acc[key]) {

            acc[key] = {
                key,
                ...customer,
            }

        } else {

            acc[key].orders += 1
            acc[key].quantity += Number(customer.quantity)
            acc[key].total += Number(customer.total)
            acc[key].productName = "Multiple"

            if (acc[key].site !== customer.site)
                acc[key].site = 'Multiple'
        }

        return acc

    }, {}))


    const data = !search ? groupedData : groupedData.filter(e => Object.values?.(e)?.some(v => {
        if (typeof v === "string") {
            return v.toLowerCase().includes(search.toLowerCase())
        } else if (typeof v === 'object' && v !== null) {
            return Object.values(v)?.some(c => typeof c === 'string' ? c.toLowerCase().includes(search.toLowerCase()) : c == search)
        } else {
            return v == search
        }
    }))


    const modal = modalOpen && <Modal {...{ closeModal, update }} />
    const viewCustomerModal = viewPopupOpen && <ViewCustomer {...{ closeModal: () => setViewPopupOpen(false), data: siteFiltered, products, row: viewPopupOpen }} />

    const totalSoldQuantity = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: "20px" }} key={2}>
        <label style={{ fontSize: "12px", margin: 0, marginRight: "10px" }}>Total Sold Qty: {data?.reduce((a, b) => a + b.quantity, 0) ?? 0}</label>
    </div>


    return <>
        <Head>
            <title>Porter Admin - Reports</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Reports"}
                    columns={columns}
                    data={data?.map(customer => ({ ...customer, id: customer.key }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[totalSoldQuantity, loadAllCustomersButton, favouriteOnlyButton, groupedButton, siteFilterField, periodFilterField, filterField, searchField, refreshButton, createButton]}
                    paginationPerPage={14}
                    sortFunction={(rows, field, dir) => rows.sort((a, b) => compare(field(a), field(b), dir)).slice(0)}
                    defaultSortAsc={false}
                    defaultSortFieldId={"$total"}
                    onRowClicked={(row, e) => (!grouped || (filter && filter !== 'active')) ? {} : setViewPopupOpen(row)}

                />
            </div>
        </div>

        {modal}
        {viewCustomerModal}
    </>
}


export async function getServerSideProps ({ req, query }) {

    const session = await getSession({ req })
    if (!session || !session?.user?.admin || !session?.user?.customerId) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false
            }
        }
    }

    const { filter, period, custom, all } = query
    const periodFilter = (!period || period === 'active') ? null : !custom ? getStartAndEndOfMonth(period) : getStartAndEndWithCustomOffset(Number(period))

    const products = await prisma.product.findMany({
        select: {
            productName: true,
            productTitle: true,
            productSite: true
        }
    })


    const where = (!period || period === 'active') ? filter ? {
        productName: filter,
        status: 'ACTIVE',
        orderTime: {
            gt: get30DaysBeforeNow()
        }
    } : {
        status: 'ACTIVE',
        orderTime: {
            gt: get30DaysBeforeNow()
        }
    } : filter ? {
        productName: filter,
        orderTime: {
            lt: periodFilter.end,
            gt: periodFilter.start
        },
    } : {
        orderTime: {
            lt: periodFilter.end,
            gt: periodFilter.start
        }
    }

    const orders = await prisma.order.findMany({
        select: {
            customer: {
                select: {
                    email: true,
                    customerId: true,
                    site: true,
                    note: true,
                    discordId: true,
                    favourite: true,
                    reportMainEmail: true
                }
            },
            productName: true,
            quantity: true,
            total: true,
            orderTime: true,
            orderId: true,
            product: {
                select: {
                    productAccount: true
                }
            }
        },
        where: where,
    })



    const serialized = orders.filter(customer => {
        if (!customer?.product?.productAccount)
            return true

        if (period && period !== 'active')
            return true

        const currentDate = dayjs()
        const dateToCheck = dayjs(customer.orderTime)

        return dateToCheck.year() === currentDate.year() && dateToCheck.month() === currentDate.month()

    }).reduce((acc, customer) => {

        const key = `${customer.productName}_${customer.customer.customerId}`

        if (!acc[key]) {
            acc[key] = {
                key,
                ...customer.customer,
                productName: customer.productName,
                quantity: 0,
                orders: 0,
                total: 0,
            }
        }

        acc[key].orders += 1
        acc[key].quantity += Number(customer.quantity?.replace(" GB", ""))
        acc[key].total += Number(customer.total)

        return acc

    }, {})

    let data = []

    if (all) {

        const customers = await prisma.customer.findMany({
            select: {
                email: true,
                customerId: true,
                site: true,
                note: true,
                discordId: true,
                favourite: true,
                reportMainEmail: true
            },
            where: {
                customerId: {
                    notIn: [...Array.from(new Set(Object.values(serialized).map(e => e.customerId)))]
                }
            },
        })

        //data = [...Object.values(serialized), ...customers.map(e => ({ ...e, total: 0, orders: 0, quantity: 0, productName: ' - ', orderTime: '', }))]
        data = Array.from(new Set([...Object.values(serialized), ...customers.map(e => ({ ...e, total: 0, orders: 0, quantity: 0, productName: ' - ', orderTime: '', }))]))

    } else {
        if ((period && period !== 'active')) {
            data = Object.values(serialized)
        } else {
            const customers = await prisma.customer.findMany({
                select: {
                    email: true,
                    customerId: true,
                    site: true,
                    note: true,
                    discordId: true,
                    favourite: true,
                    reportMainEmail: true
                },
                where: {
                    customerId: {
                        notIn: [...Array.from(new Set(Object.values(serialized).map(e => e.customerId)))]
                    },
                    favourite: 1
                },
            })

            data = Array.from(new Set([...Object.values(serialized), ...customers.map(e => ({ ...e, total: 0, orders: 0, quantity: 0, productName: ' - ', orderTime: '', }))]))
        }
    }

    const potentialCustomers = await prisma.potentialCustomer.findMany({
        where: {
            email: {
                notIn: [...Array.from(new Set(data.map(e => e.email)))]
            }
        }
    })

    if (potentialCustomers?.length) {
        data = Array.from(new Set([...Object.values(data), ...potentialCustomers.map(e => ({ ...e, total: 0, orders: 0, quantity: 0, productName: ' - ', orderTime: '', customerId: e.email, regDate: null }))]))
    }

    return {
        props: {
            products,
            customers: data,
            custom: custom ? `c-${period}` : '',
            periodFilter: (!period || period === 'active') ? 'active' : {
                start: periodFilter.start.toISOString(),
                end: periodFilter.end.toISOString(),
            },
            filter: filter || ''
        }
    }
}