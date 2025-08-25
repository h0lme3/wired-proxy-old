import { useEffect } from 'react'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'

import "../public/website/css/bootstrap.min.css"
import "../public/website/css/porter-theme.css"


import '../styles/globals.scss'

import { SessionProvider } from "next-auth/react"
import { toast, ToastContainer } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import '../styles/toastify.overrides.scss'

import { createTheme } from "react-data-table-component"

createTheme('porter', {
  text: {
    primary: "#fff",
    secondary: "#939AAA"
  },
  background: {
    default: "#252A34"
  },
  divider: {
    default: "#373B46"
  },
  context: {
    background: "#252A34",
    text: "#fff"
  }
}, 'dark')

function MyApp ({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    const handleStart = (url) => {
      console.log(`Loading: ${url}`)
      NProgress.start()
    }
    const handleStop = () => {
      NProgress.done()
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleStop)
    router.events.on('routeChangeError', handleStop)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router])

  return <>
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
    <ToastContainer
      autoClose={10000}
      pauseOnHover={false}
      pauseOnFocusLoss={false}
      hideProgressBar={false}
      closeOnClick={true}
      theme={"dark"}
      position={toast.POSITION.BOTTOM_CENTER}
      style={{
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: 600,
        fontSize: '12px'
      }}
    />
    <a href="https://discord.gg/WDmy7EmRZu" target='_blank' rel='noreferrer' className='floating-support'>
      <img src='/website/images/discord-logo.png' alt='Join our Discord for support' />
    </a>
  </>
}

export default MyApp
