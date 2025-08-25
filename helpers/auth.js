import crypto from "crypto"

export function generateSalt (len=8, charsLength=61) {
    return [...new Array(len)].map((_) => ("0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"[Math.floor(Math.random() * charsLength)])).join("") 
}

function hashPasswordWithSalt (password, storedSalt) {
    try {
        
        const globalSalt = process.env.SALT
        const HMAC = crypto.createHmac('sha256', storedSalt)
        const hash = HMAC.update(password + globalSalt).digest("hex")
        return hash

    } catch (error) {
        console.error (error)
    }

    return false
}

export function generatePasswordHash (password) {
    try {

        const storedSalt = generateSalt()
        const hash = hashPasswordWithSalt(password, storedSalt)
        return `sha256$${storedSalt}$${hash}` 

    } catch (error) {
        console.error (error)
    }

    return false
}

export function verifyPassword (storedHash, password) {
    try {
        
        const [ algo, salt, hash ] = storedHash.split('$')
        const compare = hash === hashPasswordWithSalt(password, salt)
        if (compare)
            return true

    } catch (error) {
        console.error (error)
    }

    return false
}

