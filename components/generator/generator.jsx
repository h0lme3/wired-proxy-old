import Slider from 'rc-slider'
import { Component } from 'react'

import Styles from "./generator.module.scss"
import 'rc-slider/assets/index.css'
import { toast } from 'react-toastify'
import { StateList, asiaList, countriesList, countriesList2, euCountries, evolveCountriesList, specialEuList } from '../../helpers/constants'
import { generateSalt } from '../../helpers/auth'
import { eventTypes, sendEvent } from '../../helpers/sendEvent'
import { resiCities } from '../../helpers/resi_constants'
import { Parser } from 'json2csv'
import { netNutCountryData } from '../../helpers/netnut_constants'

const euCountriesOptions = ['DE', 'AT', 'GB', 'FR', 'ES', 'NL', 'IT', 'SE', 'DK', 'NO', 'PL']

const sliderStyles = {
    railStyle: {
        backgroundColor: '#393F4F',
        height: '3px',
        borderRadius: '26px'
    },
    trackStyle: {
        backgroundColor: '#ff5600',
        height: '3px',
        borderRadius: '26px'
    },
    handleStyle: {
        borderColor: '#FFFFFF',
        background: '#FFFFFF',
        height: '11px',
        width: '11px',
        opacity: '1'
    }
}

function convertToCamelCase (str) {
    return str.replace(/_([a-z])/g, (match, letter) => ` ${letter.toUpperCase()}`)
}

function convertCityFormat (city) {
    const stringWithSpaces = city.replace(/_/g, ' ')
    const camelCaseCity = convertToCamelCase(stringWithSpaces)
    return camelCaseCity.charAt(0).toUpperCase() + camelCaseCity.slice(1)
}

const countryCodeToName = Object.fromEntries(
    Object.entries(countriesList2).map(([name, code]) => [code, name])
)


function generateNetNutProxies (quantity, country, username, password, proxyType, sessionTime, city) {

    const specialPools = {
        "uk": "resiuk",
        "gb": "resiuk",
        "us": "resius",
        "de": "reside",
        "ca": "resica",
    }

    const isSpecialServer = Object.keys(specialPools).includes(country?.toLowerCase())
    const proxyList = []

    for (let i = 0; i < quantity; i++) {
        const session = Math.random().toString().substring(2, 10)
        const random = Math.random()

        let domain
        let countryCode = country?.toLowerCase()

        if (!isSpecialServer) {
            if (random < 0.5)
                domain = "nn4.wiredproxies.com"
            else {
                domain = "nn3.wiredproxies.com"
            }
        } else {
            countryCode = specialPools[country?.toLowerCase()]
            if (random < 0.7) {
                domain = "nn2.wiredproxies.com"
            } else {
                domain = "nn1.wiredproxies.com"
            }
        }

        if (proxyType == "sticky") {
            proxyList.push(`${domain}:5959:${username}-cc-${countryCode}-sid-${session}:${password}`)
        } else {
            proxyList.push(`${domain}:5959:${username}-cc-${countryCode}:${password}`)
        }
    }

    return proxyList
}


function generatePacketStreamProxies (quantity, country, username, password, proxyType, sessionTime, city) {
    const proxyList = []

    for (let i = 0; i < quantity; i++) {

        const session = generateSalt(12)
        const cc = country === "Random" ? '' : country === "EU" ? `_country-${euCountriesOptions[Math.floor(Math.random() * euCountriesOptions.length)]}` : `_country-${country}`

        if (proxyType == "sticky") {
            proxyList.push(`ps-pro.wiredproxies.com:31112:${username}:${password}${cc.toLowerCase()}_session-${session}`)
        } else {
            proxyList.push(`ps-pro.wiredproxies.com:31112:${username}:${password}${cc.toLowerCase()}`)
        }
    }

    return proxyList
}

function generatePacketStreamProxiesDirect (quantity, country, username, password, proxyType, sessionTime, city) {
    const proxyList = []

    for (let i = 0; i < quantity; i++) {

        const session = generateSalt(12)
        const cc = country === "Random" ? '' : country === "EU" ? `_country-${euCountriesOptions[Math.floor(Math.random() * euCountriesOptions.length)]}` : `_country-${country}`

        if (proxyType == "sticky") {
            proxyList.push(`ps2.wiredproxies.com:31112:${username}:${password}${cc.toLowerCase()}_session-${session}`)
        } else {
            proxyList.push(`ps2.wiredproxies.com:31112:${username}:${password}${cc.toLowerCase()}`)
        }
    }

    return proxyList
}



function generateSmartProxies (quantity, country, username, password, proxyType, sessionTime, city) {
    const proxyList = []
    const isEuCountry = specialEuList.includes(country)
    const isAsiaCountry = asiaList.includes(country)

    const domain = 'sp-pro.wiredproxies.com' //isEuCountry ? 'sp-eu.wiredproxies.com' : isAsiaCountry ? 'sp-as.wiredproxies.com' : 'sp.wiredproxies.com'

    for (let i = 0; i < quantity; i++) {
        const session = generateSalt(12)
        const cityVar = city ? `-city-${city}` : ''
        const countryVar = country === "EU" ? 'eu' : country === "Random" ? Object.values(countriesList)[Math.floor(Math.random() * Object.values(countriesList).length)] : country
        const sessionTimeVar = sessionTime ? `-sessionduration-${sessionTime}` : ''

        if (proxyType == "sticky") {
            proxyList.push(`${domain}:7000:user-${username}-country-${countryVar}${cityVar}-session-${session}${sessionTimeVar}:${password}`)
        } else {
            proxyList.push(`${domain}:7000:user-${username}-country-${countryVar}${cityVar}:${password}`)
        }
    }

    return proxyList
}

function generateIPRoyalProxies (quantity, country, username, password, proxyType, sessionTime, city, state) {
    const proxyList = []
    const isEuCountry = specialEuList.includes(country)
    const isAsiaCountry = asiaList.includes(country)

    const domain = 'ir-pro.wiredproxies.com' //isEuCountry || country === "EU" ? 'ir-eu.wiredproxies.com' : isAsiaCountry ? 'ir-as.wiredproxies.com' : 'ir.wiredproxies.com'

    for (let i = 0; i < quantity; i++) {
        const session = generateSalt(12)
        const cityVar = city ? `_city-${city.includes("new_york") ? "newyorkcity" : city.replace(/_/g, '')}` : ''
        const countryVar = country === "EU" ? 'eu' : country === "Random" ? Object.values(countriesList)[Math.floor(Math.random() * Object.values(countriesList).length)] : country
        const sessionTimeVar = sessionTime ? `_lifetime-${sessionTime >= 1440 ? sessionTime / 1440 : sessionTime >= 60 ? sessionTime / 60 : sessionTime}${sessionTime >= 1440 ? "d" : sessionTime >= 60 ? 'h' : 'm'}` : ''

        if (proxyType == "sticky") {
            proxyList.push(`${domain}:12321:${username}:${password}_country-${countryVar}${state ? `_state-${state}` : cityVar}_session-${session}${sessionTimeVar}`)
        } else {
            proxyList.push(`${domain}:12321:${username}:${password}_country-${countryVar}${state ? `_state-${state}` : cityVar}`)
        }
    }

    return proxyList
}

function generateOxylabsProxies (quantity, country, username, password, proxyType, sessionTime, city, state) {
    const proxyList = []
    const isEuCountry = specialEuList.includes(country)
    const isAsiaCountry = asiaList.includes(country)

    const domain = 'ol-pro.wiredproxies.com' // isEuCountry ? 'ol-eu.wiredproxies.com' : isAsiaCountry ? 'ol-as.wiredproxies.com' : 'ol.wiredproxies.com'
    for (let i = 0; i < quantity; i++) {
        const cityVar = city ? `-city-${city}` : ''
        const countryVar = country === "Random" ? Object.values(countriesList)[Math.floor(Math.random() * Object.values(countriesList).length)] : country
        const sessionTimeVar = sessionTime ? `-sesstime-${sessionTime}` : ''

        const session = generateSalt(12)
        if (proxyType == "sticky") {
            proxyList.push(`${domain}:7777:customer-${username}-cc-${countryVar}${state ? `-st-us_${state}` : cityVar}-sessid-${session}${sessionTimeVar}:${password}`)
        } else {
            proxyList.push(`${domain}:7777:customer-${username}-cc-${country}${state ? `-st-us_${state}` : cityVar}:${password}`)
        }
    }

    return proxyList
}

async function generateBrightDataProxies (quantity, country, orderId, proxyType, sessionTime, city) {

    const loader = toast.loading(`Generating BrightData proxies...`)

    try {

        const res = await fetch("/api/bd_generate", {

            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity, country, orderId, proxyType, city })

        }).then(res => res.json())

        if (!res?.ok)
            throw new Error(res?.message)

        toast.dismiss(loader)
        return res.proxyList

    } catch (error) {
        console.log(error)
        toast.error(`Couldn't generate BrightData proxies.`)
    }

    toast.dismiss(loader)
    return false
}

function generateEvolveProxies (quantity, country, username, password, proxyType, sessionTime, city, state) {
    const isEuCountry = euCountries.includes(country.toUpperCase())
    const proxyList = []

    for (let i = 0; i < quantity; i++) {
        let server = 'evo-pro'

        const session = generateSalt(12)
        const r = Math.random()
        /*
                const serverType = isEuCountry || country === "EU" ? "eu" : "a"
        
                if (r < 0.25) {
                    server = `evo-pro-${serverType}1`
                } else if (r < 0.5) {
                    server = `evo-pro-${serverType}2`
                } else if (r < 0.75) {
                    server = `evo-pro-${serverType}3`
                } else {
                    server = `evo-pro-${serverType}4`
                }*/

        const cc = country === "Random" ? `` : `-country-${country}`
        let cityVar = city ? `-city-${city}` : ''
        const sessionTimeVar = sessionTime ? `-sessionduration-${sessionTime}` : ''

        if (cityVar.includes("new_york") && proxyType.includes("sport")) {
            cityVar = cityVar.replace("new_york", "newyorkcity")
        }

        const serverPort = (!proxyType.includes("sport")) ? "62345" : "62345"

        if (proxyType == "sticky" || proxyType === "sticky_sport") {
            proxyList.push(`${proxyType === "sticky_sport" ? server.includes('eu') ? "sport-eu" : 'sport' : server}.wiredproxies.com:${serverPort}:${username}${cc}${state ? `-state-${state.charAt(0).toUpperCase() + state.slice(1)}` : ""}${cityVar}-session-${session}${sessionTimeVar}:${password}`)
        } else {
            proxyList.push(`${proxyType === "rotating_sport" ? server.includes('eu') ? "sport-eu" : 'sport' : server}.wiredproxies.com:${serverPort}:${username}${cc}${state ? `-state-${state.charAt(0).toUpperCase() + state.slice(1)}` : ""}${cityVar}:${password}`)
        }

    }

    return proxyList
}

function generateEventProxies (quantity, country, username, password, proxyType, sessionTime, city, state) {
    const isEuCountry = euCountries.includes(country.toUpperCase())
    const proxyList = []
    const server = 'evo-pro' //isEuCountry || country === "EU" ? 'event-eu' : 'event'

    for (let i = 0; i < quantity; i++) {

        const session = generateSalt(12)
        const r = Math.random()

        const cc = country === "Random" ? `` : `-country-${country}`
        let cityVar = city ? `-city-${city}` : ''
        const sessionTimeVar = sessionTime ? `-sessionduration-${sessionTime}` : ''

        if (cityVar.includes("new_york")) {
            cityVar = cityVar.replace("new_york", "newyorkcity")
        }

        if (proxyType == "sticky" || proxyType === "sticky_sport") {
            proxyList.push(`${proxyType === "sticky_sport" ? server == "event-eu" ? "sport-eu" : 'sport' : server}.wiredproxies.com:62345:${username}${cc}${state ? `-state-${state}` : ""}${cityVar}-session-${session}${sessionTimeVar}:${password}`)
        } else {
            proxyList.push(`${proxyType === "rotating_sport" ? server == "event-eu" ? "sport-eu" : 'sport' : server}.wiredproxies.com:62345:${username}${cc}${state ? `-state-${state}` : ""}${cityVar}:${password}`)
        }

    }

    return proxyList
}

export default class Generator extends Component {

    constructor (props) {
        super(props)
        this.state = {
            quantity: 10,
            country: props?.selectedPlan?.type === "EVOLVE_RESIDENTIAL" ? "us" : "US",
            city: "",
            state: "",
            sessionTime: 0,
            proxyType: "sticky",
            proxyList: []
        }
    }

    selectChange = (which) => (e) => {
        if (which === "country") {
            this.setState({ [which]: e.target.value, city: "", state: "" })
        } else {
            this.setState({ [which]: e.target.value })
        }
    }

    quantityChange = (quantity, e) => {
        this.setState({ quantity })
    }

    quantityInputChange = (e) => {

        if (!Number(e?.target?.value))
            return

        if (e?.target?.value == "")
            return this.setState({ quantity: 0 })

        if (Number(e?.target?.value) > 50000)
            return this.setState({ quantity: 50000 })

        this.setState({ quantity: Number(e?.target?.value) })
    }

    copyProxyList = async (e) => {

        if (!this.state.proxyList.length)
            return toast.error(`No proxies generated to copy.`)

        if (typeof navigator.clipboard == 'undefined')
            return toast.error(`Copying is not supported in this context, please download the list instead`)

        await navigator.clipboard.writeText(this.state.proxyList.join('\r\n'))
        toast.success(`Copied your proxy list to clipboard!`)
    }

    saveInsomaniacFile = (e) => {

        const proxies = this.state.proxyList
        if (!proxies?.length)
            return toast.error(`No proxies generated to save.`)

        const proxiesList = []
        for (let i = 0; i < proxies.length; i++) {
            const [ipAddress, port, username, password] = proxies[i].split(':').map(e => e.trim())
            proxiesList.push({ schema: "Proxy", name: `Proxy ${i}`, ipAddress, port, username, password })
        }

        //Name,Host,Port,Username,Password,Scheme

        const fields = [{
            label: "Name",
            value: "name",
        }, {
            label: "Host",
            value: 'ipAddress'
        }, {
            label: "Port",
            value: "port",
        }, {
            label: "Username",
            value: "username",
        }, {
            label: "Password",
            value: "password"
        }, {
            label: "Schema",
            value: "schema"
        }]

        const data = new Parser({ header: true, fields, quote: "" }).parse(proxiesList)

        const a = document.createElement('a')
        a.download = 'proxylist.csv'
        a.href = URL.createObjectURL(new Blob([data]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()

        toast.success(`Downloaded your proxy list!`)
    }

    saveProxyFile = (e) => {

        if (!this.state.proxyList.length) {
            return toast.error(`No proxies generated to save.`)
        }

        const a = document.createElement('a')
        a.download = 'proxylist.txt'
        a.href = URL.createObjectURL(new Blob([this.state.proxyList.join('\r\n')]))
        a.click()
        URL.revokeObjectURL(a.href)
        a.remove()
        toast.success(`Downloaded your proxy list!`)
    }


    generateProxies = async (e) => {

        const { quantity, country, proxyType, sessionTime, city, state } = this.state
        const { selectedPlan: { username, password, type, orderId } } = this.props

        if (!quantity || !country)
            return toast.error("Please choose quantity and select country to generate.")

        if (!username || !password || !orderId)
            return toast.error("Please select a plan to generate")

        if (!["sticky", "rotating", "sticky_sport", "rotating_sport"].includes(proxyType))
            return toast.error("Please choose a proxy type")

        let proxyList = []

        switch (type) {

            case "EVENT": {
                proxyList = generateEventProxies(quantity, country, username, password, proxyType, sessionTime, city, state)
                break
            }

            case "EVOLVE_RESIDENTIAL": {
                proxyList = generateEvolveProxies(quantity, country, username, password, proxyType, sessionTime, city, state)
                break
            }

            case "CR_OL": {
                proxyList = generateOxylabsProxies(quantity, country, username, password, proxyType, sessionTime, city, state)
                break
            }

            case "CR_SP": {
                proxyList = generateSmartProxies(quantity, country, username, password, proxyType, sessionTime, city)
                break
            }

            case "CR_PS": {
                proxyList = generatePacketStreamProxies(quantity, country, username, password, proxyType, sessionTime, city)
                break
            }

            case "PP_PS": {
                proxyList = generatePacketStreamProxiesDirect(quantity, country, username, password, proxyType, sessionTime, city)
                break
            }
            case "CR_NN": {
                proxyList = generateNetNutProxies(quantity, country, username, password, proxyType, sessionTime, city)
                break
            }

            case "CR_BD": {
                proxyList = await generateBrightDataProxies(quantity, country, orderId, proxyType, sessionTime, city)
                break
            }
            case "CR_IR": {
                proxyList = generateIPRoyalProxies(quantity, country, username, password, proxyType, sessionTime, city, state)
                break
            }

            default: {
                proxyList = false
            }
        }

        if (!proxyList)
            return toast.error(`Couldn't find a generator for this order type.`)

        this.setState({ proxyList }, () => {
            toast.success(`Generated your proxy list!`)
            sendEvent(eventTypes[3], [orderId, quantity, country])
        })
    }

    render () {

        const { country, city, sessionTime, quantity, proxyList, proxyType, state } = this.state
        const { title, selectedPlan: { type } } = this.props


        const isNetNut = (type === "EVENT" || type === "EVOLVE_RESIDENTIAL")
        const countries = isNetNut ? netNutCountryData : countriesList

        return (
            <div className={Styles.container}>

                <div className={Styles.card}>
                    <div className={Styles.cardHeader}>
                        <p className={Styles.cardTitle}>
                            Generate {title}
                        </p>

                        <div className={Styles.inputs}>

                            <div>
                                <label>Type</label>
                                <select value={proxyType} onChange={this.selectChange("proxyType")}>
                                    <option value={"sticky"}>Sticky</option>
                                    <option value={"rotating"}>Rotating</option>

                                </select>
                            </div>

                            <div>
                                <label>Country</label>
                                <select value={country} onChange={this.selectChange("country")}>
                                    <option value={"Pick"} disabled>Pick</option>
                                    <option value={"EU"}>Europe</option>
                                    <option value={"Random"}>Random</option>

                                    {isNetNut ?
                                        [...new Set(countries.map(o => o.Country))]
                                            .sort((a, b) => a.localeCompare(b))
                                            .map((code, k) => (
                                                <option key={k} value={code}>
                                                    {countryCodeToName[code] || code}
                                                </option>
                                            ))
                                        : Object.entries(countries).map((o, k) => <option key={k} value={o[1]}>{o[0]}</option>)}
                                </select>
                            </div>


                            {(isNetNut) || (!city && (type === "CR_IR" || type === "CR_OL") && country.toLowerCase() === "us") ? <div>
                                <label>State</label>
                                <select onChange={this.selectChange("state")}>
                                    <option value={""}>Random</option>

                                    {isNetNut ?
                                        [...new Set(
                                            netNutCountryData
                                                .filter(e => e.Country === country)
                                                .map(o => o.State)
                                        )]
                                            .sort((a, b) => a.localeCompare(b))
                                            .map((state, k) => <option key={k} value={state}>{state}</option>)
                                        : StateList
                                            .sort((a, b) => a.localeCompare(b))
                                            .map(obj => {
                                                const formattedState = convertCityFormat(obj)
                                                return {
                                                    value: obj,
                                                    name: formattedState
                                                }
                                            })
                                            .map((o, k) => <option key={k} value={o.value}>{o.name}</option>)}
                                </select>
                            </div> : null}


                            {isNetNut || (type !== "CR_BD" && !state) ? <div>
                                <label>City</label>
                                <select onChange={this.selectChange("city")}>
                                    <option value={""}>Random</option>
                                    {isNetNut ?
                                        country && state && [...new Set(
                                            netNutCountryData
                                                .filter(e => e.Country === country && e.State === state)
                                                .map(o => o.City)
                                        )]
                                            .sort((a, b) => a.localeCompare(b))
                                            .map((city, k) => <option key={k} value={city}>{city}</option>)

                                        : country && resiCities.filter(e => e.Country.toLowerCase() === country.toLowerCase()).sort((a, b) => a.City.localeCompare(b.City)).map(obj => {
                                            const formattedCity = convertCityFormat(obj.City)
                                            return {
                                                ...obj,
                                                name: formattedCity
                                            }
                                        }).map((o, k) => <option key={k} value={o.City}>{o.name}</option>)}
                                </select>
                            </div> : null}


                            {!proxyType.includes("rotating") && type !== "CR_BD" && type !== "CR_PS" ? <div>
                                <label>Session Time</label>
                                <select onChange={this.selectChange("sessionTime")} value={sessionTime}>
                                    {type === "CR_IR" ?
                                        <>
                                            <option key={0} value={0}>Default</option>
                                            <option key={1} value={10}>10 minutes</option>
                                            <option key={2} value={20}>20 minutes</option>
                                            <option key={3} value={30}>30 minutes</option>
                                            <option key={4} value={60}>1 hour</option>
                                            <option key={5} value={120}>2 hours</option>
                                            <option key={6} value={360}>6 hours</option>
                                            <option key={7} value={720}>12 hours</option>
                                            <option key={8} value={1440}>1 day</option>
                                            <option key={9} value={10080}>7 days</option>
                                        </>

                                        : [...Array.from({ length: 7 }, (_, i) => i * 5)].map((o, k) => <option key={k} value={o}>{!o ? 'Default' : `${o} minutes`}</option>)
                                    }
                                </select>
                            </div> : null}

                            { /*<div>
                                <label>Private Pool</label>
                                <select>
                                    <option value={"Auto"}>Auto</option>
                                </select>
                        </div> 


                            <div>
                                <label>Website</label>
                                <select>
                                    <option value={"General Use"}>General Use</option>
                                </select>
                            </div>
                            */ }
                        </div>

                        <div className={Styles.sliderSection}>
                            <div className={Styles.quantity}>
                                <p>
                                    Quantity
                                </p>

                                <input
                                    name={"quantity"}
                                    type={"text"}
                                    maxLength={9}
                                    onChange={this.quantityInputChange}
                                    value={quantity}
                                />
                            </div>
                            <div className={Styles.slider}>
                                <Slider min={10} max={10000} step={10} defaultValue={0} value={quantity} {...sliderStyles} onChange={this.quantityChange} />
                            </div>

                            <button className={Styles.generate} onClick={this.generateProxies}>
                                <p>
                                    Generate Proxies
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className={Styles.proxyList}>
                        <div className={Styles.listHeader}>
                            <p>Proxy List</p>
                            <div>
                                <a onClick={this.saveInsomaniacFile}>Save List (Insomniac)</a>
                                <a onClick={this.saveProxyFile}>Save List</a>
                                <a onClick={this.copyProxyList}>Copy List</a>
                            </div>
                        </div>

                        <div className={Styles.list}>
                            {proxyList.map((e, idx) => <p key={idx}>{e}</p>)}
                        </div>
                    </div>
                </div>

            </div>
        )
    }
}
