import React from 'react'
import theme from '../../utils/theme'
import favicon from '../../../assets/psyoptions-logo-secondary.png'

const baseCss = `
  * {
    box-sizing: border-box;
  }

  html, body, #app {
    width: 100%;
    min-height: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${theme.palette.background.main};
    color: ${theme.palette.primary.main};
    font-family: JetBrains Mono, monospace;
  }
  
  h1, h2, h3 {
    font-weight: 400;
    text-transform: uppercase;
    font-family: Goldman, sans-serif;
    font-size: 3.25rem;
    color: ${theme.palette.primary.light};
    text-shadow: ${theme.glow};
  }
  h2 {
    font-size: 1.5rem;
  }
  h3 {
    font-size: 1.25rem;
  }
  h4, h5 {
    color: ${theme.palette.primary.light};
    text-transform: uppercase;
    font-size: 1.25rem;
  }
  h5 {
    font-size: 1.2rem;
  }

  * {
    scrollbar-color: ${theme.palette.border.main} transparent;
  }
  *::-webkit-scrollbar {
    width: 10px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background-color: ${theme.palette.border.main};
    border: 1px solid ${theme.palette.background.main};
    border-radius: 12px;
  }
`

const Template = ({
  jsBundle,
  title,
  description,
  cssString,
  htmlString = '',
  env = {},
}) => (
  <html lang="en">
    <head>
      <title>{title || ''}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta description={description || ''} />
      <link rel="icon" type="image/png" href={favicon} />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Goldman:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300&family=Major+Mono+Display&display=swap"
        rel="stylesheet"
      />
      <style>{baseCss}</style>
      <style>{cssString}</style>
    </head>
    <body>
      <div id="app" dangerouslySetInnerHTML={{ __html: htmlString }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.process = {
            env: ${JSON.stringify(env)}
          };`,
        }}
      />
      <script src={`/${jsBundle}`} />
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-MDM6MQ5HPL"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-MDM6MQ5HPL');`,
        }}
      />
    </body>
  </html>
)

export default Template
