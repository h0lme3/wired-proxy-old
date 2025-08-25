import Styles from "./hamburger.module.scss"

import { Component } from 'react'


export default class Hamburger extends Component {

    constructor(props) {
      super(props)
    }

    render() {
        
        const { toggleMenu, menuActive } = this.props
        const hamburgerStyles = [Styles.container, menuActive ? Styles.active : undefined].join(' ')

        return (
            <div className={hamburgerStyles} onClick={toggleMenu}>
                <span className={Styles.piece}></span>
                <span className={Styles.piece}></span>
                <span className={Styles.piece}></span>
            </div>
        )
    }
}

