import { useState } from 'react'
import Head from 'next/head'
import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent'
import { GA_TRACKING_ID } from '../lib/gtag'

const isProduction = process.env.NODE_ENV === 'production'
const cookieConcent = getCookieConsentValue();

export const GoogleAnalytics = () => {
  if(!isProduction) {
    return <></>
  }

  const gaURL = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  const [concent, setConcent] = useState(cookieConcent);

  return (
    <>
      {/* enable analytics script only for production */}
      <Head>
        {concent === 'true' && (<script src={gaURL}></script>)}
        {concent === 'true' && (<script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GA_TRACKING_ID}');` }}></script>)}
      </Head>

      <CookieConsent
        location="bottom"
        enableDeclineButton={true}
        buttonText="I Understand"
        style={{ background: '#333333' }}
        buttonStyle={{ backgroundColor: '#ff5d52', color: '#eee', fontSize: '16px', fontWeight: 'bold' }}
        onAccept={() => {setConcent('true');}}
      >
        We are using 3rd party cookies to track content popularity, as well as storing this concent choice so we don't annoy you... By using the site, you concent to these cookies.{' '}
        <a href="/privacy">Learn more</a>
      </CookieConsent>
    </>
  )
}
