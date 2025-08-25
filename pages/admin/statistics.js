import AdminNavBar from "../../components/navbar/navbar.admin"
import { getSession } from "next-auth/react"
import Head from "next/head"
import { prisma } from "../../helpers/database"

import Styles from "../../styles/admin/AdminGeneric.module.scss"

import DataTable from "react-data-table-component"
import { adminTableStyles } from '../../helpers/constants'
import { useRouter } from 'next/router'

import { BiRefresh, } from "react-icons/bi"
import { useMemo } from "react"


export default function Stats ({ statistics, proxyStatistics, resi, serverStatistics, accountStatistics, onDemandStatistics }) {

    const router = useRouter()
    const refreshButton = useMemo(() => <BiRefresh key={0} title={"Refresh List"} style={{ cursor: "pointer", fontSize: "28px", }} onClick={() => router.replace(router.asPath)} />, [router])

    const resiUsageRow = { title: "Active Usage", ...resi.resiUsage }
    const resiLiabilityRow = { title: "Active Liability", ...resi.resiLiability }
    const resiOutstandingRow = { title: "Outstanding Data", ...resi.resiOutstanding }


    return (
        <>

            <Head>
                <title>Porter Admin - Statistics</title>
            </Head>

            <AdminNavBar />

            <div className={Styles.container}>
                <div className={Styles.Main}>
                    <DataTable
                        title={"General"}
                        columns={[
                            { name: "Statistic", selector: row => row.title, sortable: true, },
                            { name: "Value", selector: row => row.value, sortable: true, },
                        ]}
                        data={statistics?.map((e, idx) => ({ ...e, id: idx }))}
                        theme={'porter'}
                        customStyles={adminTableStyles}
                        actions={refreshButton}
                        dense
                    />

                    <div style={{ marginTop: "35px" }}>
                        <DataTable
                            title={"Residential"}
                            columns={[
                                { name: "Statistic", selector: row => row.title, sortable: true },
                                ...Object.keys(resi.resiUsage).map(key => ({ name: key, selector: row => row[key], sortable: true }))
                            ]}
                            data={[
                                resiUsageRow,
                                resiLiabilityRow,
                                resiOutstandingRow,
                            ]}
                            theme={'porter'}
                            customStyles={adminTableStyles}
                            actions={refreshButton}
                            dense
                        />
                    </div>

                    <div style={{ marginTop: "35px" }}>
                        <DataTable
                            title={"Proxy"}
                            columns={[
                                { name: "Category", selector: row => row.type, sortable: true, },
                                { name: "Active", selector: row => row.active, sortable: true, },
                                { name: "Available", selector: row => row.available, sortable: true, },
                                { name: "Sold", selector: row => row.sold, sortable: true, },
                                { name: "Expire 1 Day", selector: row => row.expiry1Day, sortable: true, },
                                { name: "Expire 3 Day", selector: row => row.expiry3Day, sortable: true, },
                                { name: "Expire 7 Day", selector: row => row.expiry7Day, sortable: true, },
                                { name: "Sold Last 30 Days", selector: row => row.soldLast30Day, sortable: true, },

                            ]}
                            data={proxyStatistics?.map((e, idx) => ({ ...e, id: idx }))}
                            theme={'porter'}
                            customStyles={adminTableStyles}
                            actions={refreshButton}
                            dense
                        />
                    </div>

                    <div style={{ marginTop: "35px" }}>
                        <DataTable
                            title={"Servers"}
                            columns={[
                                { name: "Type", selector: row => row.type, sortable: true, },
                                { name: "Active", selector: row => row.active, sortable: true, },
                                { name: "Expired", selector: row => row.expired, sortable: true, },
                                { name: "Requested", selector: row => row.requested, sortable: true, },
                                { name: "Sold Last 30 Days", selector: row => row.sold30, sortable: true, },

                            ]}
                            data={serverStatistics?.map((e, idx) => ({ ...e, id: idx }))}
                            theme={'porter'}
                            customStyles={adminTableStyles}
                            actions={refreshButton}
                            dense
                        />
                    </div>

                    <div style={{ marginTop: "35px" }}>
                        <DataTable
                            title={"Account"}
                            columns={[
                                { name: "Type", selector: row => row.type, sortable: true, },
                                { name: "Active", selector: row => row.active, sortable: true, },
                                { name: "Available", selector: row => row.available, sortable: true, },
                                { name: "Sold", selector: row => row.sold, sortable: true, },

                            ]}
                            data={accountStatistics?.map((e, idx) => ({ ...e, id: idx }))}
                            theme={'porter'}
                            customStyles={adminTableStyles}
                            actions={refreshButton}
                            dense
                        />
                    </div>

                    <div style={{ marginTop: "35px" }}>
                        <DataTable
                            title={"On Demand Pools"}
                            columns={[
                                { name: "Type", selector: row => row.type, sortable: true, },
                                { name: "Total", selector: row => row.total, sortable: true, },
                                { name: "Available", selector: row => row.available, sortable: true, },
                                { name: "In Use", selector: row => row.total - row.available, sortable: true, },

                            ]}
                            data={onDemandStatistics?.map((e, idx) => ({ ...e, id: idx }))}
                            theme={'porter'}
                            customStyles={adminTableStyles}
                            actions={refreshButton}
                            dense
                        />
                    </div>

                </div>
            </div>

        </>
    )

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

    const [totalOrders, activeOrders, waitingOrders, reviewOrders, failedOrders, queuedOrders] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
            where: {
                status: {
                    equals: "ACTIVE"
                },
            }
        }),
        prisma.order.count({
            where: {
                status: {
                    equals: "AWAITING_PROCESSING"
                }
            }
        }),
        prisma.order.count({
            where: {
                status: {
                    equals: "REVIEW"
                }
            }
        }),
        prisma.order.count({
            where: {
                status: {
                    contains: "ERROR"
                }
            }
        }),
        prisma.order.count({
            where: {
                status: {
                    equals: "WAITING_SEND"
                }
            }
        })
    ])

    const resiData = await prisma.residentialPlan.groupBy({
        by: ['type'],
        _sum: {
            activeBandwidth: true,
            usage: true,
        },
        where: {
            status: "ACTIVE"
        }
    })

    const resiUsage = {}
    const resiLiability = {}
    const resiOutstanding = {}

    for (let plan of resiData) {
        if (plan.type?.toLowerCase() === "oxy" || plan.type?.toLowerCase() === "sw")
            continue

        resiUsage[plan.type] = plan._sum.usage.toFixed(2)
        resiLiability[plan.type] = plan._sum.activeBandwidth.toFixed(2)
        resiOutstanding[plan.type] = (plan._sum.activeBandwidth - plan._sum.usage).toFixed(2)
    }

    const accounts = await prisma.account.findMany({
        select: {
            type: true,
            status: true,
        }
    })

    const accountTypes = await prisma.account.groupBy({
        by: [
            'type'
        ],
    })

    const accountStatistics = accountTypes.map(({ type }) => {
        const filtered = accounts.filter(e => e.type == type)
        const active = filtered.length
        const available = filtered.filter(e => ["AVAILABLE"].includes(e.status)).length
        const sold = active - available

        return { active, available, sold, type }
    })


    const proxies = await prisma.proxy.findMany({
        select: {
            currentEnd: true,
            type: true,
            status: true,
        }
    })

    const statisticTypes = await prisma.proxy.groupBy({
        by: [
            'type'
        ],
    })

    const proxyStatistics = statisticTypes.map(({ type }) => {
        const filtered = proxies.filter(e => e.type == type)
        const active = filtered.length
        const available = filtered.filter(e => ["AVAILABLE", "AWAITING_PROCESSING", "COOLING"].includes(e.status)).length
        const sold = active - available
        const expiry1Day = filtered.filter(e => e.currentEnd && +e.currentEnd < +new Date(Date.now() + (1 * 3600 * 1000 * 24))).length
        const expiry3Day = filtered.filter(e => e.currentEnd && +e.currentEnd < +new Date(Date.now() + (3 * 3600 * 1000 * 24))).length
        const expiry7Day = filtered.filter(e => e.currentEnd && +e.currentEnd < +new Date(Date.now() + (7 * 3600 * 1000 * 24))).length
        const soldLast30Day = " - "

        return { active, available, sold, expiry1Day, expiry3Day, expiry7Day, type, soldLast30Day }
    })

    const porterVipOrders = await prisma.order.findMany({
        select: {
            expiry: true,
            total: true,
            paymentId: true,
            orderTime: true,
        },
        where: {
            status: "ACTIVE",
            productName: "PORTER_VIP",
        }
    })

    const porterVipTrials = porterVipOrders.filter(({ total, paymentId }) => paymentId?.startsWith("in_") || total == 0)
    const porterVipPaid = porterVipOrders.filter(({ total, paymentId }) => paymentId?.startsWith("ch_") && total != 0)

    proxyStatistics.push({
        active: porterVipTrials.length,
        available: " - ",
        sold: " - ",
        expiry1Day: porterVipTrials.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (1 * 3600 * 1000 * 24))).length,
        expiry3Day: porterVipTrials.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (3 * 3600 * 1000 * 24))).length,
        expiry7Day: porterVipTrials.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (7 * 3600 * 1000 * 24))).length,
        soldLast30Day: porterVipTrials.filter(e => e.orderTime && +e.orderTime > +new Date(Date.now() - (30 * 3600 * 1000 * 24))).length,
        type: "Porter VIP Trial"
    })

    proxyStatistics.push({
        active: porterVipPaid.length,
        available: " - ",
        sold: " - ",
        expiry1Day: porterVipPaid.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (1 * 3600 * 1000 * 24))).length,
        expiry3Day: porterVipPaid.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (3 * 3600 * 1000 * 24))).length,
        expiry7Day: porterVipPaid.filter(e => e.expiry && +e.expiry < +new Date(Date.now() + (7 * 3600 * 1000 * 24))).length,
        soldLast30Day: porterVipPaid.filter(e => e.orderTime && +e.orderTime > +new Date(Date.now() - (30 * 3600 * 1000 * 24))).length,
        type: "Porter VIP Paid"
    })

    const serverTypes = await prisma.server.groupBy({
        by: [
            'type',
        ],
    })

    const servers = await prisma.server.findMany({
        select: {
            status: true,
            type: true,
            currentStart: true,
        }
    })

    const serverStatistics = serverTypes.map(({ type }) => {
        const filtered = servers.filter(e => e.type == type)
        return {
            type,
            active: filtered.filter(e => e.status === "ACTIVE").length,
            expired: filtered.filter(e => e.status === "EXPIRED").length,
            requested: filtered.filter(e => e.status === "REQUESTED").length,
            sold30: filtered.filter(e => +e.currentStart > +new Date(Date.now() - (30 * 3600 * 1000 * 24))).length,
        }
    })

    const b2bResponse = await fetch('http://54.226.20.95/api/on-demand/stock-levels', {
        method: 'GET',
        headers: {
            'X-API-KEY': 'fvogziaAsYQaYt9at98j8lCjnM1L61l84HIhkcswitxQO3P6pAOR/TEMCtYgtizMSVOJC7dFzUjEfPlB7Aj7sg==',
        },
    }).then(res => {
        if (!res.ok)
            return { ok: false }

        return res.json()
    })

    const groupedStatistics = {}

    for (let entry of Object.values(b2bResponse.subnets)) {
        const { subnet, type, total, available } = entry
        if (!groupedStatistics[type]) {
            groupedStatistics[type] = { total: 0, available: 0 }
        }
        groupedStatistics[type].total += parseInt(total)
        groupedStatistics[type].available += parseInt(available)
    }

    const onDemandStatistics = Object.entries(groupedStatistics).map(([type, { total, available }]) => ({
        type,
        total,
        available
    }))


    return {
        props: {
            statistics: [
                { title: "Total Orders", value: totalOrders, category: "Orders" },
                { title: "Active Orders", value: activeOrders, category: "Orders" },
                { title: "Waiting Orders", value: waitingOrders, category: "Orders" },
                { title: "Error State Orders", value: failedOrders, category: "Orders" },
                { title: "Queued Daily Orders", value: queuedOrders, category: "Orders" },
                { title: "Under Review Orders", value: reviewOrders, category: "Orders" },

            ],
            resi: {
                resiUsage,
                resiLiability,
                resiOutstanding
            },
            proxyStatistics,
            serverStatistics,
            accountStatistics,
            onDemandStatistics
        }
    }
}