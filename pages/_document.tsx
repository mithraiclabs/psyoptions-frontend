import React from 'react';
import { ServerStyleSheets } from '@material-ui/core/styles';
import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import theme from '../src/utils/theme';

const baseCss = `
  * {
    box-sizing: border-box;
  }

  html, body, #__next {
    width: 100%;
    min-height: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${theme.palette.background.main};
    color: ${theme.palette.text.primary};
    font-family: ${theme.typography.fontFamily};
    font-size: 1rem;
    letter-spacing: 0.2;
    font-weight: 500;
  }
  
  h1, h2, h3 {
    font-weight: 400;
    text-transform: uppercase;
    font-family: Goldman, sans-serif;
    font-size: 3.25rem;
    color: ${theme.palette.primary.light};
    text-shadow: ${(theme as any).glow};
  }
  h2 {
    font-size: 1.5rem;
  }
  h3 {
    font-size: 1.25rem;
  }
  h4, h5 {
    color: ${theme.palette.primary.light};
    text-shadow: ${(theme as any).glow};
    text-transform: uppercase;
    font-size: 1.25rem;
  }
  h5 {
    font-size: 1.2rem;
  }

  a {
    color: ${theme.palette.primary.main};
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
`;

class Document extends NextDocument {
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <link rel="icon" type="image/png" href="/psyoptions-logo-small.png" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Goldman:wght@400&display=swap"
            rel="stylesheet"
          />
          {/* Manrope */}
          <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
          <style>{baseCss}</style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
Document.getInitialProps = async (ctx) => {
  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await NextDocument.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement(),
    ],
  };
};

export default Document;
