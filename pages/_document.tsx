
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import { URL } from 'url'
import { processEnv } from '@lib/processEnv'
import { GA_TRACKING_ID } from "../lib/gtag";
import CookieConsent, { Cookies } from "react-cookie-consent";

const isProduction = process.env.NODE_ENV === "production";

export default class MyDocument extends Document {

  static async getInitialProps(ctx: DocumentContext) {
    return await super.getInitialProps(ctx)
  }

  render() {
    const { pageProps } = this.props.__NEXT_DATA__.props
    const { cmsData, settings }  = pageProps || { cmsData: null, settings: null }
    const { settings: cmsSettings , bodyClass } = cmsData || { settings: null, bodyClass: '' }
    const { lang } = settings || cmsSettings || { lang: 'en' }

    return (
      <Html {...{lang, className: 'casper' }}>
        <Head>
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link
            rel="alternate"
            type="application/rss+xml"
            title="Keep-Current RSS Feed"
            href={`${new URL('rss.xml', processEnv.siteUrl).href}`}
          />

          {/* enable analytics script only for production */}
          {isProduction && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              />
              <script
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
              />
            </>
          )}
          
        </Head>
        <body {...{className: bodyClass}}>
          <script
            dangerouslySetInnerHTML={{
              __html: `
            (function(){
                window.isDark = localStorage.getItem('dark');
                if ( window.isDark === 'dark' ) {
                  document.body.classList.add('dark')
                } else if( window.isDark === undefined && window.matchMedia('(prefers-color-scheme: dark)').matches === true ){
                  document.body.classList.add('dark')
                }
            })()
          `,
            }}
          />
          <CookieConsent
  location="bottom"
  buttonText="I understand"
  cookieName="cookieConcentCookie"
  style={{ background: "#333333" }}
  buttonStyle={{ color: "#eee", fontSize: "1rem" }}
>
  We are using 3rd party cookies to track pages popularity, as well as to store your concent choice... 
</CookieConsent>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
