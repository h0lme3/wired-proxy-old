import { Component } from 'react'
import Image from 'next/image'

import Styles from "./resiinfo.module.scss"

import { CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import day from 'dayjs'


export default class Info extends Component {

    constructor(props) {
        super(props)
    }


    render() {
        const { selectedPlan: { activeBandwidth, usage, expiry, orderTime } } = this.props

        const activeDays = day(expiry).diff(+new Date, "days")
        const maxDays = day(expiry).diff(orderTime, "days")

        return (
            <div className={Styles.container}>
                <div className={Styles.limit}>
                    <Image src={"/resi-data-purple.svg"} width={"61px"} height={"61px"} />
                    <span className={Styles.value}> { activeBandwidth.toFixed(1) } </span>
                    <span className={Styles.name}> Plan GB </span>
                </div>

                <div className={Styles.usage}>

                    <div className={Styles.progressBar}>
                        <CircularProgressbar
                            value={usage}
                            maxValue={activeBandwidth}
                            strokeWidth={14}
                            styles={{
                                trail: {
                                    stroke: "#252A34"
                                },
                                path: {
                                    stroke: "#ff5600"
                                }
                            }}
                        />
                    </div>


                    <span className={Styles.value}> { (activeBandwidth - usage).toFixed(2) } </span>
                    <span className={Styles.name}> GB Available </span>
                </div>

                <div className={Styles.time}>
                    <div className={Styles.progressBar}>
                        <CircularProgressbar
                            value={activeDays}
                            maxValue={maxDays}
                            strokeWidth={14}
                            styles={{
                                trail: {
                                    stroke: "#252A34"
                                },
                                path: {
                                    stroke: "#939AAA"
                                }
                            }}
                        />
                    </div>
                    <span className={Styles.value}> { activeDays < 0 ? "-" : activeDays } </span>
                    <span className={Styles.name}> Days Left </span>
                </div>

            </div>
        )
    }
}
