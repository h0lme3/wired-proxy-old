import { Component } from 'react'
import Styles from "./orders.module.scss"
import ResiOrder from './resiorder'
import IspOrder from './isporder'
import { toast } from 'react-toastify'
import { eventTypes, sendEvent } from '../../helpers/sendEvent'

function paginate (a, i, s = 8) {
    return {
        data: a.slice((i * s) - s, i * s),
        max: Math.ceil(a.length / s)
    }
}

export default class Orders extends Component {

    constructor (props) {
        super(props)
        this.state = {
            expanded: null,
            page: 1,
        }
    }


    setExpanded = (expanded) => {
        this.setState({ expanded })
    }

    page = (val) => (e) => {
        this.setState((prev) => ({ expanded: null, page: prev.page + val }))
    }

    downloadallISPs = (e) => {

        const { orders, } = this.props
        const ispOrders = orders?.filter(e => !e?.product?.productResi && !e?.product?.productAccount && !e?.product?.productServer && e.status === 'ACTIVE')

        if (!ispOrders)
            return toast.error(`You don't have any active ISP orders at the moment.`)

        const proxyList = []

        for (const order of ispOrders) {
            if (!(order?.proxies instanceof Array))
                continue


            for (let proxy of order?.proxies) {
                proxyList.push(`${proxy.ipAddress}:${proxy.port}:${proxy.username}:${proxy.password}`)
            }
        }


        if (!proxyList.length)
            return toast.error(`There are no proxies assigned to your ISP orders yet.`)


        const a = document.createElement('a')
        a.download = 'proxylist.txt'
        a.href = URL.createObjectURL(new Blob([proxyList.join('\r\n')]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()


        toast.success(`Downloaded your proxies list!`)
        sendEvent(eventTypes[4], ["ALL-ORDERS", Math.round((+new Date) / 60000)])

        return
    }


    render () {

        const { expanded, page } = this.state
        const { orders, setCheckOutData, setServerData, setCredData } = this.props

        const paginated = paginate(orders, page)

        return (
            <div className={Styles.Container}>

                <div className={Styles.TitleContainer}>
                    <span>Orders</span>
                    <div>
                        <button onClick={this.downloadallISPs} className={Styles.DownloadAllButton} style={{
                            display: !orders?.filter(e => !e?.product?.productResi && !e?.product?.productAccount && !e?.product?.productServer && e.status === 'ACTIVE').length ? "none" : "flex"
                        }}>
                            <p>
                                Download All ISPs
                            </p>
                        </button>
                        <button onClick={this.page(-1)} disabled={page <= 1}>
                            <p>
                                Prev
                            </p>
                        </button>
                        <span>{page}/{paginated.max}</span>
                        <button onClick={this.page(1)} disabled={page >= paginated.max}>
                            <p>
                                Next
                            </p>
                        </button>
                    </div>

                </div>

                <div className={Styles.Table}>

                    <div className={Styles.Header}>
                        <div className={Styles.OrderNo}>ORDER #</div>
                        <div className={Styles.ProductName}>PRODUCT NAME</div>
                        <div className={Styles.Qty}>QTY</div>
                        <div className={Styles.Total}>TOTAL</div>
                        <div className={Styles.OrderDate}>ORDER DATE</div>
                        <div className={Styles.ActiveTime}>ACTIVE TIME</div>
                        <div className={Styles.AutoRenew}>AUTO-RENEW</div>
                        <div className={Styles.Status}>STATUS</div>
                    </div>


                    {paginated.data.map((order, key) => {

                        const toRender = order?.product?.productResi ? (
                            <ResiOrder {...{ key, order, expanded, internalId: key, setExpanded: this.setExpanded, setCheckOutData, }} />
                        ) : (
                            <IspOrder {...{ key: order?.orderId ?? key, order, expanded, internalId: key, setExpanded: this.setExpanded, setCheckOutData, setServerData, setCredData }} />
                        )

                        return (
                            toRender
                        )

                    })}
                </div>

            </div>
        )
    }
}


