import { Component } from 'react'
import Image from 'next/image'

import Styles from "./resiplans.module.scss"
import ProgressBar from '@ramonak/react-progress-bar'
import day from 'dayjs'


export default class ResiPlans extends Component {

    constructor(props) {
        super(props)
    }


    render() {
        const { resiPlans, changePlan, selectedPlan: { status, orderId, quantity, activeBandwidth, usage, expiry, orderTime }, title } = this.props 
        const activeDays = day(expiry).diff(+new Date, "days")
        const maxDays = day(expiry).diff(orderTime, "days")

        
        return (
            <div className={Styles.container}>
                <div className={Styles.topHeader}>
                    <p>{title} Data Usage</p>
                    <div className={Styles.planSelector}>
                        <label>Plan: </label>
                        <select onChange={changePlan}>
                            { resiPlans.map((plan, idx) => <option key={idx} value={plan.orderId}>#{plan.orderId}</option> )}
                        </select>
                    </div>
                </div>
                <div className={Styles.planCard}>
                    <div className={Styles.planHeader}>
                        <p className={Styles.planTitle}>Plan #{orderId}</p>
                        <div className={status === 'ACTIVE' ? Styles.ChipGreen : Styles.ChipRed}>
                            <p> {status} </p>
                        </div>
                    </div>
                    <div className={Styles.planInfo}>
                        <div>
                            <Image src={"/order-logo.svg"} width={"23px"} height={"23px"} />
                            <p className={Styles.planOrderId}>Order ID: <span>{orderId}</span></p>
                        </div>

                        <p>Bandwidth: <span>{activeBandwidth.toFixed(1)} GB</span></p>
                        <p>Purchase Date: <span>{day(orderTime).format("YYYY-MM-DD")}</span></p>
                    </div>

                    <div className={Styles.progressBars}>
                        <div className={Styles.usageProgress}>
                            <p>{(activeBandwidth - usage).toFixed(1)} of {activeBandwidth.toFixed(1)} GB Remaining</p>
                            <ProgressBar completed={usage} maxCompleted={activeBandwidth} bgColor={"#ff5600"} baseBgColor={"#313644"} height={"5px"} borderRadius={"44px"} isLabelVisible={false} width={"100%"} />
                        </div>

                        <div className={Styles.timeProgress}>
                            <p>{activeDays < 0 ? "-" : activeDays} days Remaining</p>
                            <ProgressBar completed={maxDays - activeDays} maxCompleted={maxDays} bgColor={"#939AAA"} baseBgColor={"#313644"} height={"5px"} borderRadius={"44px"} isLabelVisible={false} width={"100%"} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
