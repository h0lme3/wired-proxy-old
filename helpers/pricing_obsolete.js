
const OBSOLETE_ispOptions = [
    {
        code: "a-us",
        name: "ISP USA",
        identifer: "ISP_A"
    },
    {
        code: "a-eu",
        name: "ISP EU",
        identifer: "ISP_EU"
    },
    {
        code: "b-us",
        name: "B USA",
        identifer: "ISP_B"
    },
    {
        code: "veve-us",
        name: "VeVe US",
        identifer: "VEVE_US"
    },
    {
        code: "veve-eu",
        name: "VeVe EU",
        identifer: "VEVE_EU"
    },
    {
        code: "veve-au",
        name: "VeVe AU",
        identifer: "VEVE_AU"
    },
]

function OBSOLETE_captchaPricing () {
    
    const periods = [30, 60, 90]
    const multipliers = {
        "30": 1,
        "60": 1.8,
        "90": 2.65
    }
    const values = [5, 10, 25, 50]
    const prices = {
        '5': 7.5,
        '10': 14,
        '25': 32.5,
        '50': 60
    }

    return {
        periods,
        multipliers,
        values,
        prices
    }

}

function OBSOLETE_evolvePricing () {

    const values = [2, 5, 10]
    const prices = {
        '2': 38,
        '5': 87.5,
        '10': 150
    }

    return { 
        values,
        prices
    }

}

function OBSOLETE_ispPricing () {

    const periods = [7, 30]
    const values = [10, 25, 50, 100]

    const multipliers = {
        '7': 0.6,
        '30': 1,
    }

    const options = {
        a: {
            type: "a",
            description: "Cream of the crop ISPs. These work across nearly all websites with maximum performance.",
            prices: {
                '10': 30,
                '25': 70,
                '50': 135,
                '100': 250
            },
        },
        b: {
            type: "b",
            description: "Equally fast, best suited for sites other than Footsites.",
            prices: {
                '10': 24,
                '25': 56,
                '50': 108,
                '100': 200
            }
        },
        veve: {
            type: "veve",
            description: "Premium VeVe ISPs",
            prices: {
                '10': 30,
                '25': 70,
                '50': 135,
                '100': 250
            }
        }
    }

    return {
        periods,
        values,
        multipliers,
        options
    }

}

function OBSOLETE_getCaptchaPricing({ country, period, quantity }) {

    if (period > 2 || quantity > 3 || quantity < 0 || period < 0)
        return { failed: true }

    const { periods, multipliers, values, prices } = captchaPricing()

    const quantityVal = values[quantity]
    const periodVal = periods[period]
    const priceVal = prices[quantityVal] * multipliers[periodVal]
    return {
        selectedPeriod: period,
        period: periodVal,
        quantity: quantityVal,
        selectedQty: quantity,
        maxQuantity: values.length - 1,
        price: priceVal
    }
}


function OBSOLETE_getEvolvePricing({ quantity }) {

    if (quantity > 2 || quantity < 0)
        return { failed: true }

    const { values, prices } = evolvePricing()

    const quantityVal = values[quantity]
    const priceVal = prices[quantityVal]

    return {
        selectedPeriod: 0,
        period: 60,
        quantity: quantityVal,
        selectedQty: quantity,
        maxQuantity: values.length - 1,
        price: priceVal
    }
}

function OBSOLETE_getIspPricing ({ option, quantity, period }) {

    if (!option || !option.includes('-') || quantity > 3 || period >  2 || quantity < 0 || period < 0)
        return { failed: true }
    
    const [type, location] = option.split('-')

    const { values, periods, multipliers, options } = ispPricing()
   
    if (!options[type])
        return { failed: true }

    const quantityVal = values[quantity]
    const periodVal = periods[period]
    const priceVal = multipliers[periodVal] * options[type].prices[quantityVal]
    
    return {
        selectedPeriod: period,
        period: periodVal,
        quantity: quantityVal,
        selectedQty: quantity,
        maxQuantity: values.length - 1,
        price: priceVal,
        description: options[type].description,
        option: option,
    }
}


const OBSOLETE_checkOutPricing = {

    EVOLVE_RESIDENTIAL: {
        defaultPeriod: 60,
        periods: {
            60: 1,
        },
        ranges: [
            { min: 2, max: 5, multiplier: 19 },
            { min: 5, max: 10, multiplier: 17.5 },
            { min: 10, max: 100, multiplier: 15 },
        ],
        min: 10,
        max: 99
    },


    CAPTCHA: {
        defaultPeriod: 30,
        periods: {
            30: 1,
            60: 1.8,
            90: 2.65
        },
        ranges: [
            { min: 5, max: 10, multiplier: 1.5 },
            { min: 10, max: 25, multiplier: 1.4 },
            { min: 25, max: 50, multiplier: 1.3 },
            { min: 50, max: 1000, multiplier: 1.2 },
        ],
        min: 5,
        max: 999
    },

    VEVE_AU: {
        defaultPeriod: 30,
        periods: { 
            7: 0.6,
            30: 1 
        },
        ranges: [
            { min: 10, max: 25, multiplier: 3 },
            { min: 25, max: 50, multiplier: 2.8 },
            { min: 50, max: 100, multiplier: 2.7 },
            { min: 100, max: 1000, multiplier: 2.5 },
        ],
        min: 10,
        max: 999,
    },

    VEVE_EU: {
        defaultPeriod: 30,
        periods: { 
            7: 0.6,
            30: 1 
        },
        ranges: [
            { min: 10, max: 25, multiplier: 3 },
            { min: 25, max: 50, multiplier: 2.8 },
            { min: 50, max: 100, multiplier: 2.7 },
            { min: 100, max: 1000, multiplier: 2.5 },
        ],
        min: 10,
        max: 999,
    },

    VEVE_US: {
        defaultPeriod: 30,
        periods: { 
            7: 0.6,
            30: 1 
        },
        ranges: [
            { min: 10, max: 25, multiplier: 3 },
            { min: 25, max: 50, multiplier: 2.8 },
            { min: 50, max: 100, multiplier: 2.7 },
            { min: 100, max: 1000, multiplier: 2.5 },
        ],
        min: 10,
        max: 999,
    },

    ISP_A: {
        defaultPeriod: 30,
        periods: { 
            7: 0.6,
            30: 1 
        },
        ranges: [
            { min: 10, max: 25, multiplier: 3 },
            { min: 25, max: 50, multiplier: 2.8 },
            { min: 50, max: 100, multiplier: 2.7 },
            { min: 100, max: 1000, multiplier: 2.5 },
        ],
        min: 10,
        max: 999,
    },

    ISP_B: {
        defaultPeriod: 30,
        periods: { 
            7: 0.6,
            30: 1 
        },
        ranges: [
            { min: 10, max: 25, multiplier: 2.4 },
            { min: 25, max: 50, multiplier: 2.24 },
            { min: 50, max: 100, multiplier: 2.16 },
            { min: 100, max: 1000, multiplier: 2 },
        ],
        min: 10,
        max: 999,
    },
    DAILY: {
        defaultPeriod: 1,
        periods: { 
            1: 1,
        },
        ranges: [
            { min: 10, max: 25, multiplier: 1.5 },
            { min: 25, max: 50, multiplier: 1.25 },
            { min: 50, max: 100, multiplier: 1.15 },
            { min: 100, max: 1000, multiplier: 1.10 },
        ],
        min: 10,
        max: 999,
    }
}


function OBSOLETE_getCheckOutPrice(type, period, quantity) {

    const range = checkOutPricing?.[type]?.ranges?.find(r => quantity < r.max && quantity >= r.min)
    if (!range)
        return 0

    const multiplier = checkOutPricing?.[type]?.periods[period]
    const price = ( quantity * range.multiplier ) * multiplier
    if (isNaN(price))
        return 0

    return price
}

