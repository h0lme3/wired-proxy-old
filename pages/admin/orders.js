import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { useMemo, useState } from 'react'
import AdminNavBar from '../../components/navbar/navbar.admin'
import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { prisma } from "../../helpers/database"
import { adminTableStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, BiEdit, } from "react-icons/bi"

export default function Orders ({ orders }) {


    const [search, setSearch] = useState('')

    const router = useRouter()
    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])
    const searchField = useMemo(() => <div key={1} className={Styles.inputs} style={{ padding: 0, width: "240px" }}><input type="text" placeholder='Search...' onChange={(e) => setSearch(e.target.value)} /></div>, [])

    const columns = useMemo(() => [
        {
            name: "Order ID",
            selector: row => row.orderId,
            sortable: true,
            grow: 1,
        },

        {
            name: "Customer ID",
            selector: row => row.customerId,
            sortable: true,
            grow: 1,

        },

        {
            name: "Order Time",
            selector: row => new Date(row.orderTime).toISOString(),
            sortable: true,
            grow: 2,

        },

        {
            name: "Status",
            selector: row => row.status,
            sortable: true,
            grow: 1,

        },

        {
            name: "Product ID",
            selector: row => row.productName,
            sortable: true,
            grow: 2,

        },


        {
            name: "Type",
            selector: row => row.type,
            sortable: true,
            grow: 1,

        },

        {
            name: "Qty",
            selector: row => row.quantity,
            sortable: true,
            grow: 1,

        },

        {
            name: "Period",
            selector: row => row.length,
            sortable: true,
            grow: 1,

        },

        {
            name: "Total",
            selector: row => row.total,
            sortable: true,
            grow: 1,

        },

        {
            name: "Intent",
            selector: row => row.paymentId,
            sortable: true,
            grow: 2,

        },

        {
            name: "Auto-Renew",
            selector: row => row.ecomOrderId,
            sortable: true,
            grow: 1,

        },

    ],
        []
    )

    const data = !search ? orders : orders.filter(e => Object.values?.(e)?.some(e => {
        if (typeof e === "string") {
            return e.includes(search)
        } else {
            return e == search
        }
    }))

    return <>
        <Head>
            <title>Porter Admin - Orders</title>
        </Head>

        <AdminNavBar />

        <div className={Styles.container}>
            <div className={Styles.Main}>
                <DataTable
                    title={"Orders"}
                    columns={columns}
                    data={data?.map(order => ({ ...order, id: order.orderId }))}
                    pagination={true}
                    theme={'porter'}
                    customStyles={adminTableStyles}
                    actions={[searchField, refreshButton]}
                />
            </div>
        </div>

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

    const orders = await prisma.order.findMany({
        orderBy: {
            orderTime: "desc"
        },
        take: 5000
    })

    return {
        props: {
            orders: [...orders?.map((order) => ({ ...order, orderTime: +order.orderTime, dispatchTime: +order.dispatchTime, expiry: +order.expiry }))]
        }
    }
}