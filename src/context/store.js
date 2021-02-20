import React, { cloneElement } from 'react'
import { ThemeProvider } from '@material-ui/core/styles'

import { ConnectionProvider } from './ConnectionContext'
import { WalletProvider } from './WalletContext'
import theme from '../utils/theme'

const providers = [
  <ThemeProvider theme={theme} children={<div />} />,
  <ConnectionProvider />,
  <WalletProvider />,
]

// flatten context providers for simpler app component tree

const ProviderComposer = ({ providers, children }) =>
  providers.reduceRight(
    (kids, parent) => cloneElement(parent, { children: kids }),
    children
  )

const Store = ({ children }) => (
  <ProviderComposer providers={providers}>{children}</ProviderComposer>
)

export default Store
