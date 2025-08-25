import { toast } from "react-toastify"

export function toastLoader (loadingMessage) {
    const loadingToast = toast.loading(loadingMessage)
    const toastSuccess = (message) => {
        toast.update(loadingToast, {
            render: message,
            type: "success",
            isLoading: false,
            autoClose: 10000,
        })
    }

    const toastError = (message) => {
        toast.update(loadingToast, {
            render: message,
            type: "error",
            isLoading: false,
            autoClose: 10000,
        })
    }


    const toastInfo = (message) => {
        toast.update(loadingToast, {
            render: message,
            type: "info",
            isLoading: false,
            autoClose: 10000,
        })
    }

    return {
        toastSuccess,
        toastError,
        toastInfo
    }
}