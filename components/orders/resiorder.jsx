import { Component } from 'react'
import Styles from "./resiorder.module.scss"
import Image from "next/image"
import { withRouter } from 'next/router'
import ProgressBar from "@ramonak/react-progress-bar"
import day from 'dayjs'
import { toast } from 'react-toastify'

export default withRouter(class ResiOrder extends Component {

    constructor(props) {
        super(props)
    }
    

    toggleOpen = () => {
        const { expanded, internalId, setExpanded } = this.props
        if (expanded === internalId) {
            setExpanded(null)
        } else {
            setExpanded(internalId)
        }
    }

    topUp = (e) => {

        const { setCheckOutData, order } = this.props

        if (!order?.product)
            return toast.error(`Can't top up a retired product order.`)

        if (order?.status != "ACTIVE")
            return toast.error(`Can't top up an order that is not active.`)

        const payload = {
            main: false,
            resi: true,
            isp: false,
            product: order.product,
            data: {
                quantity: order.quantity?.replace(" GB", ""),
            }
        }

        setCheckOutData(payload)
    }   

    render() {

 

        const { order: { orderId, productName, quantity, total, orderTime, expiry, status, activeBandwidth, usage } } = this.props
        const { expanded, internalId } = this.props
        const { productTitle, } = this.props?.order?.product ?? {}

        const activeTimeDays = day(expiry).diff(+new Date, "days")
        const activeTime = (activeTimeDays > -1 ? activeTimeDays + ' days left' : '-' ) 

        const collapseOpen = expanded === internalId 
        const collapseStyles = [ Styles.Collapse, collapseOpen ? Styles.Show : null ].join(' ')

        const statusDisplay = !["ACTIVE", "EXPIRED", "COMPLETE"].includes(status) ? "PENDING" : status
        const remainingBandwidth = (activeBandwidth - usage).toFixed(2)
        return (

            <div className={Styles.Row}>
                <div className={Styles.Data}>
                    <div className={Styles.OrderNo}>
                        <Image src={"/order-logo.svg"} width={"23px"} height={"23px"} />
                        <p> {orderId} </p>
                    </div>
                    <div className={Styles.ProductName}> {productTitle || productName} </div>
                    <div className={Styles.Qty}> {quantity} </div>
                    <div className={Styles.Total}> {total} </div>
                    <div className={Styles.OrderDate}> {day(orderTime).format('YYYY-MM-DD')} </div>
                    <div className={Styles.ActiveTime}> {activeTime} </div>
                    <div className={Styles.Status}>

                        <div className={statusDisplay === 'ACTIVE' ? Styles.ChipGreen : status === "EXPIRED" || status === "COMPLETE" ? Styles.ChipRed : Styles.ChipOrange}>
                            <p> {statusDisplay} </p>
                        </div>

                        <div className={Styles.ExpandButton} onClick={this.toggleOpen}>
                            <p> {collapseOpen ? 'Less' : 'More'} </p>
                        </div>

                    </div>
                    <div className={Styles.AutoRenew}>
                        
                    </div>
                </div>

                <div className={collapseStyles}>
                    <div className={Styles.Usage}>
                        <p>{isNaN(remainingBandwidth) ? " -- " : remainingBandwidth} of {activeBandwidth} GB Remaining</p>
                        <ProgressBar completed={usage ?? 0} maxCompleted={activeBandwidth} bgColor={"#939AAA"} baseBgColor={"#313644"} height={"5px"} borderRadius={"44px"} isLabelVisible={false} width={"100%"} />
                    </div>

                    <div className={Styles.Actions}>
                        <div className={Styles.TopUpButton} onClick={this.topUp} >
                            <p> Top Up </p>
                        </div>
                        <div className={Styles.GenerateButton} onClick={() => this.props.router.push(`/residential/${productName}`)} >
                            <p> Generate </p>
                        </div>
                    </div>
                </div>

            </div>


        )
    }
})
