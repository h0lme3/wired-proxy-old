import { Component } from 'react'
import Image from 'next/image'

import Styles from "./info.module.scss"
import day from 'dayjs'


export default class Info extends Component {

    constructor(props) {
        super(props)
    }

    render() {

        const { orders } = this.props
        const activeOrders = orders.filter(order => order.status === "ACTIVE")
        const ispProxiesSum = activeOrders.filter(order => !order?.product?.productResi && !order?.product?.productAccount && !order?.product?.productServer && (order?.product?.productPool && !["PORTER_VIP"].includes(order?.product?.productPool)) && !isNaN(order.quantity)).reduce((a, b) => a + +b.quantity, 0)
        const resiDataSum = activeOrders.filter(order => order?.product?.productResi).reduce((a, b) => a + +b?.quantity?.replace(" GB", ""), 0)

    
        return (
            <div className={Styles.container}>
                <div className={Styles.date}>
                    { day().format("dddd MMM DD").toUpperCase()}
                </div>
                <div className={Styles.orders}>

                    <Image src={"/active-orders.svg"} width={"61px"} height={"61px"} />
                    <span className={Styles.value}> { activeOrders.length } </span>
                    <span className={Styles.name}> Active Orders </span>

                </div>
                <div className={Styles.proxies}>
                    <Image src={"/isp-proxies.svg"} width={"61px"} height={"61px"} />
                    <span className={Styles.value}> { ispProxiesSum } </span>
                    <span className={Styles.name}> ISP Proxies </span>
                </div>
                <div className={Styles.resiData}>
                    <Image src={"/resi-data.svg"} width={"61px"} height={"61px"} />
                    <span className={Styles.value}> {resiDataSum.toFixed(1)} GB </span>
                    <span className={Styles.name}> Resi Data </span>
                </div>
                <div className={Styles.line}> </div>
            </div>
        )
    }
}
