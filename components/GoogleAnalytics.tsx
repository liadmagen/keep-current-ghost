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
        {concent === 'true' && (<script dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${GA_TRACKING_ID}');
        console.log('lets go!');
        ` }}></script>)}
      </Head>

      <CookieConsent
        location="bottom"
        enableDeclineButton={true}
        buttonText="I agree"
        style={{ background: '#333333' }}
        buttonStyle={{ backgroundColor: '#99AA38', color: '#eee', fontSize: '16px', fontWeight: 'bold' }}
        onAccept={() => {setConcent('true');}}
      >
        We are using 3rd party cookies to track content popularity, as well as storing your concent to this annoying message, so you won't see it again... By agreeing, you permit these cookies.{' '}
        <a href="/privacy">Learn more</a>
      </CookieConsent>
    </>
  )
}
