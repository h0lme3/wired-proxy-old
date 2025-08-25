import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import StatsNavBar from '../../components/navbar/navbar.stats'
import Styles from "../../styles/admin/AdminGeneric-noSelect.module.scss"

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


function compare (a, b, sort) {
    if (!isNaN(parseFloat(a)) && !isNaN(parseFloat(b))) {
        return sort === "asc" ? parseFloat(a) - parseFloat(b) : parseFloat(b) - parseFloat(a)
    } else {
        return sort === "asc" ? a.toString().localeCompare(b.toString()) : b.toString().localeCompare(a.toString())
    }
}


function ViewProducts ({ closeModal, row: data, isPr }) {
    const rows = Object.entries(data.products).map(e => ({ ...e[1], name: e[0] }))

    const columns = [

        {
            id: "name",
            name: "Product",
            selector: row => row.name,

        },

        {
            id: "current",
            name: "% Total",
            selector: row => (((row.current / data.total) * 100) || 0).toFixed(2) + '%',
            sortable: true,
        },

        {
            id: "percentage",
            name: "$ Value",
            selector: row => (row.current).toFixed(2),
            sortable: true,
            omit: isPr
        }
    ]


    return (
        <>
            <div className={Styles.modalContainer}>
                <div className={Styles.modal} style={{ width: "600px" }} >
                    <p className={Styles.modalTitle}>
                        Product stats of {data?.name} - {data?.coupon}
                    </p>

                    <div className={Styles.inputs}>

                        <DataTable
                            dense
                            columns={columns}
                            data={rows?.map((row, idx) => ({ ...row, id: idx }))}
                            theme={'porter'}
                            sortFunction={(rows, field, dir) => rows.sort((a, b) => dir == "asc" ? a.current - b.current : b.current - a.current).slice(0)}
                            pagination
                            defaultSortFieldId={'current'}
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

export default function Sales ({ managers, sales, products, isPr }) {

    const mountedRef = useRef()
    const router = useRouter()

    const [search, setSearch] = useState('')

    const [extraColumnsVisible, setExtraColumnsVisible] = useState(false)
    const [viewPopupOpen, setViewPopupOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const [siteFilter, setSiteFilter] = useState('porter')

    const onFilterChange = type => value => {
        if (type === "filter")
            setFilter(value)
        else if (type === "site") {
            setSiteFilter(value)
            setFilter('')
        }
    }

    useEffect(() => {
        if (mountedRef.current) {
            router.replace({
                pathname: router.pathname,
                query: {
                    site: siteFilter,
                    filter: filter
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, siteFilter])

    useEffect(() => {
        mountedRef.current = true
    }, [])

    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const showExtraButton = useMemo(() => <button key={1} className={Styles.submit} style={{ padding: 0, width: "160px" }} onClick={() => setExtraColumnsVisible(!extraColumnsVisible)}><p>{extraColumnsVisible ? "Hide" : "Show"} Extra Columns</p></button>, [extraColumnsVisible])
    const searchField = useMemo(() => <div key={2} className={Styles.inputs} style={{ padding: 0, width: "180px" }}><input type="text" placeholder='Search...' onChange={(e) => setSearch(e.target.value)} /></div>, [])
    const filterField = <div key={3} className={Styles.inputs} style={{ padding: 0, width: "180px" }}>
        <select
            className={Styles.select}
            onChange={e => onFilterChange("filter")(e?.target?.value)}
            value={filter}
        >
            <option value={''}> {filter !== '' ? "Clear" : "Set"} Filter </option>
            {products.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
        </select>
    </div>

    const siteFilterField = !isPr && <div key={4} className={Styles.inputs} style={{ padding: 0, width: "180px" }}>
        <select
            className={Styles.select}
            onChange={e => onFilterChange("site")(e?.target?.value)}
            value={siteFilter}
        >
            <option value={'porter'}> Porter </option>
            <option value={'wired'}> Wired </option>
            <option value={'play'}> Play </option>

        </select>
    </div> || null


    const columns = [

        {
            name: "Country",
            selector: row => row?.webhook?.country ?? "N/A",
            sortable: true,
            minWidth: "100px"
        },

        {
            name: "Regions",
            selector: row => row?.webhook?.regions ?? "N/A",
            sortable: true,
            minWidth: "100px"

        },

        {
            name: "Manager",
            selector: row => {

                if (!row?.webhook?.manager)
                    return "N/A"

                const manager = managers.find(e => e.customerId == row?.webhook?.manager)
                return manager ? manager.firstName + ' ' + manager.lastName + ` (ID: ${row?.webhook?.manager})` : 'ID: ' + row?.webhook?.manager
            },
            sortable: true,

            minWidth: "180px"

        },

        {
            name: "Name",
            selector: row => row?.webhook?.name ?? "N/A",
            sortable: true,
            minWidth: "180px"


        },

        {
            name: "Coupon",
            selector: row => row.coupon,
            sortable: true,
            minWidth: "180px"

        },

        {
            name: "Discount %",
            selector: row => row.discount,
            sortable: true,

            minWidth: "120px"


        },


        {
            name: "Contact",
            selector: row => row?.webhook?.contact ?? "N/A",
            sortable: true,
        },

        {
            name: "Hype",
            selector: row => row?.webhook?.hype ?? "N/A",
            sortable: true,
        },

        {
            id: "%total",
            name: "% Total",
            selector: row => (row.percentage ?? 0).toFixed(2) + '%',
            sortable: true,
        },

        {
            name: "$ Value",
            selector: row => (row.total ?? 0).toFixed(2),
            sortable: true,
            omit: !extraColumnsVisible || isPr,
            minWidth: "100px"


        },

        {
            name: "% Change",
            selector: row => (row.change ?? 0).toFixed(2) + '%',
            sortable: true,
            omit: !extraColumnsVisible,
            minWidth: "150px",
            conditionalCellStyles: [
                {
                    when: row => (row.change ?? 0).toFixed(2) > 0,
                    style: {
                        color: '#5CFF94'
                    }
                },
                {
                    when: row => (row.change ?? 0).toFixed(2) < 0,
                    style: {
                        color: '#FF2976'
                    }
                }

            ]


        },

        {
            name: "% New Sales",
            selector: row => (row.newSales ?? 0).toFixed(2) + '%',
            sortable: true,
            omit: !extraColumnsVisible,
            minWidth: "150px"

        },

        {
            name: "% Renewals",
            selector: row => (row.renewals ?? 0).toFixed(2) + '%',
            sortable: true,
            omit: !extraColumnsVisible,
            minWidth: "150px"


        },

        {
            name: "% New Customers",
            selector: row => (row.newCustomers ?? 0).toFixed(2) + '%',
            sortable: true,
            omit: !extraColumnsVisible,
            minWidth: "180px"


        },


        {
            name: "Clicks",
            selector: row => row?.webhook?.clicks ?? "N/A",
            sortable: true,
            omit: !extraColumnsVisible,
            minWidth: "100px"


        },


        {
            name: "Previous % Total",
            selector: row => (row.previousPercentage ?? 0).toFixed(2) + '%',
            sortable: true,
            minWidth: "180px"

        },

        {
            name: "Previous $ Total",
            selector: row => (row.previousTotal ?? 0).toFixed(2),
            sortable: true,
            omit: !extraColumnsVisible || isPr,
            minWidth: "180px"

        },
    ]


    const data = !search ? sales : sales.filter(e => Object.values?.(e)?.some(v => {
        if (typeof v === "string") {
            return v.toLowerCase().includes(search.toLowerCase())
        } else if (typeof v === 'object' && v !== null) {
            return Object.values(v)?.some(c => typeof c === 'string' ? c.toLowerCase().includes(search.toLowerCase()) : c == search)
        } else {
            return v == search
        }
    }))

    const viewProductsPopup = viewPopupOpen && <ViewProducts {...{ closeModal: () => setViewPopupOpen(false), row: viewPopupOpen, sales, isPr }} />

    return <>
        <Head>
            <title>Porter Stats - Sales</title>
        </Head>

        <StatsNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Sales"}
                    columns={columns}
                    data={data?.map((sales, idx) => ({ ...sales, id: idx }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[siteFilterField, filterField, searchField, showExtraButton, refreshButton]}
                    onRowClicked={(row, e) => setViewPopupOpen(row)}
                    sortFunction={(rows, field, dir) => rows.sort((a, b) => compare(field(a), field(b), dir)).slice(0)}
                    defaultSortAsc={false}
                    defaultSortFieldId={"%total"}
                    paginationPerPage={15}
                />
            </div>
        </div>

        {viewProductsPopup}

    </>
}


export async function getServerSideProps ({ req, query }) {

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

    const { filter, site } = query

    const managers = await prisma.customer.findMany({
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

    const webhooks = await prisma.webhook.findMany(isPr ? {
        where: {
            manager: session.user.customerId
        }
    } : undefined)

    const coupons = await prisma.promotion.findMany(isPr ? {
        where: {
            active: 1,
            site: isPr ? 'porter' : site ?? 'porter',
            discountCode: {
                in: [...webhooks.map(e => e.coupon)].filter(e => typeof e == "string")
            }
        },
        select: {
            discount: true,
            discountCode: true
        }
    } : {
        where: {
            active: 1,
            site: isPr ? 'porter' : site ?? 'porter'
        },
        select: {
            discount: true,
            discountCode: true
        }
    })

    if (!isPr) {
        coupons.push({ discount: 'N/A', discountCode: 'N/A' })
    }


    const currentOrdersArr = await prisma.order.findMany({
        where: {
            orderTime: {
                gt: new Date(new Date() - (30 * 24 * 60 * 60 * 1000))
            },
            product: {
                productSite: isPr ? 'porter' : site ?? 'porter'
            }
        },
        select: {
            total: true,
            couponName: true,
            productName: true,
            lastChain: true,
            orderId: true,
            note: true,
            customerId: true,
            product: {
                select: {
                    productSite: true
                }
            }
        }
    })

    const previousOrdersArr = await prisma.order.findMany({
        where: {
            orderTime: {
                lt: new Date(new Date() - (30 * 24 * 60 * 60 * 1000)),
                gt: new Date(new Date() - (60 * 24 * 60 * 60 * 1000))
            },
            product: {
                productSite: isPr ? 'porter' : site ?? 'porter'
            }
        },
        select: {
            total: true,
            couponName: true,
            productName: true,
            lastChain: true,
            orderId: true,
            note: true,
            customerId: true,
            product: {
                select: {
                    productSite: true
                }
            }
        }
    })

    const currentOrders = currentOrdersArr.map(e => ({ ...e, couponName: e.couponName || 'N/A' }))
    const previousOrders = previousOrdersArr.map(e => ({ ...e, couponName: e.couponName || 'N/A' }))

    const customerIds = new Set([...currentOrders.map(e => e.customerId), ...previousOrders.map(e => e.customerId)])
    const firstOrders = await prisma.order.groupBy({
        by: ['customerId'],
        where: {
            customerId: {
                in: [...customerIds]
            },
        },
        having: {
            customerId: {
                _count: {
                    equals: 1
                }
            }
        }
    })

    const firstOrdersByCustomerId = firstOrders.map(e => e.customerId)

    const ordersTotal = currentOrders.filter(e => !filter ? true : e.productName === filter).filter(e => e.total).map(e => parseFloat(e.total)).reduce((a, b) => a + b, 0)
    const previousTotal = previousOrders.filter(e => !filter ? true : e.productName === filter).filter(e => e.total).map(e => parseFloat(e.total)).reduce((a, b) => a + b, 0)

    const sales = []
    const products = []

    for (let coupon of coupons.map(e => e.discountCode)) {
        const orders = currentOrders.filter(e => (e.couponName || e.note) == coupon)
        const previous = previousOrders.filter(e => (e.couponName || e.note) == coupon)

        for (let order of orders) {
            if (products.includes(order.productName))
                continue

            products.push(order.productName)
        }

        for (let order of previous) {
            if (products.includes(order.productName))
                continue

            products.push(order.productName)
        }
    }

    for (let { discount, discountCode: coupon } of coupons) {
        const webhook = webhooks.find(e => e.coupon?.toLowerCase() === coupon.toLowerCase())

        const products = {}
        const orders = currentOrders.filter(e => !filter ? true : e.productName === filter).filter(e => e.couponName?.toLowerCase() == coupon?.toLowerCase() || (webhook && e.note == webhook.webhookId))
        const previous = previousOrders.filter(e => !filter ? true : e.productName === filter).filter(e => e.couponName?.toLowerCase() == coupon?.toLowerCase() || (webhook && e.note == webhook.webhookId))

        for (let order of orders) {
            if (products[order.productName]) {
                products[order.productName].current += parseFloat(order.total)
            } else {
                products[order.productName] = { current: parseFloat(order.total), previous: 0, renewal: 0, new: 0, newCustomer: 0 }
            }

            if (order.lastChain) {
                products[order.productName].renewal++
            } else if (firstOrdersByCustomerId.includes(order.customerId)) {
                products[order.productName].newCustomer++
            } else {
                products[order.productName].new++

            }
        }

        for (let order of previous) {
            if (products[order.productName]) {
                products[order.productName].previous += parseFloat(order.total)
            } else {
                products[order.productName] = { current: 0, previous: parseFloat(order.total) }
            }
        }


        const webhookTotalValue = Object.values(products).map(e => e.current).reduce((a, b) => a + b, 0)
        const webhookPreviousValue = Object.values(products).map(e => e.previous).reduce((a, b) => a + b, 0)
        const webhookTotalPercentage = (webhookTotalValue / ordersTotal) * 100
        const webhookPreviousPercentage = (webhookPreviousValue / previousTotal) * 100
        const webhookChangePercentage = ((webhookTotalValue - webhookPreviousValue) / Math.abs(webhookPreviousValue)) * 100.0

        const webhookRenewalsCount = Object.values(products).filter(e => e.renewal).map(e => e.renewal).reduce((a, b) => a + b, 0)
        const webhookNewCount = Object.values(products).filter(e => e.new).map(e => e.new).reduce((a, b) => a + b, 0)
        const webhookNewCustomerCount = Object.values(products).filter(e => e.newCustomer).map(e => e.newCustomer).reduce((a, b) => a + b, 0)

        const webhookOrdersCountTotal = webhookRenewalsCount + webhookNewCount + webhookNewCustomerCount
        const webhookRenewalPercentage = (webhookRenewalsCount / webhookOrdersCountTotal) * 100
        const webhookNewPercentage = (webhookNewCount / webhookOrdersCountTotal) * 100
        const webhookNewCustomerPercentage = (webhookNewCustomerCount / webhookOrdersCountTotal) * 100

        sales.push({
            coupon: coupon,
            discount: discount,
            products: products,
            total: webhookTotalValue,
            percentage: webhookTotalPercentage,
            previousTotal: webhookPreviousValue,
            previousPercentage: webhookPreviousPercentage,
            change: webhookChangePercentage,
            newSales: webhookNewPercentage,
            newCustomers: webhookNewCustomerPercentage,
            renewals: webhookRenewalPercentage,
            webhook: webhook ? {
                ...webhook,
                createdAt: +webhook.createdAt
            } : null
        })
    }

    return {
        props: {
            managers: managers,
            sales: sales,
            products: products,
            isPr
        }
    }
}
