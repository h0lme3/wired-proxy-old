export function evaluatePricing(pricingData) {
    
    try {
        const data = JSON.parse(pricingData)
        return data
    } catch (error) {
        return {failed: true}
    }
}

export function getPricing(data, quantity, period) {
    try {
        const range = data?.ranges?.find(r => quantity <= r.max && quantity >= r.min)
        if (!range) 
            return 0
        
        const multiplier = data?.periods?.[period]
        const price = ( quantity * range?.multiplier ) * multiplier
        if (isNaN(price)) 
            return 0
        
        return price

    } catch (error) {
        console.error(error)
    }
    
    return 0
}

