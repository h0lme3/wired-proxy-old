export const eventTypes = [
    "LOGIN_ATTEMPT",
    "LOGIN",
    "LOGIN_AS_ADMIN",
    "GENERATE_PROXIES",
    "VIEW_LIST",
    "VIEW_ACCOUNTS",
    "PASSWORD_REQUEST",
    "PASSWORD_COMPLETE",
    "PASSWORD_RESET",
    "CLICK_REGISTERED"
]

export async function sendEvent (type, meta) {
    try {
        const res = await fetch("/api/events", {

            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                meta
            })

        }).then(res => res.json())

        return res?.ok

    } catch (error) {
        console.error(error)
    }

    return false
}