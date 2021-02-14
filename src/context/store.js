import { cloneElement } from 'react'
import { ConnectionProvider } from './ConnectionContext'
import { WalletProvider } from './WalletContext'

const providers = [ConnectionProvider, WalletProvider]

const ProviderComposer = ({ providers, children }) =>
  providers.reduceRight(
    (kids, parent) => cloneElement(parent, { children: kids }),
    children
  )

const Store = ({ children }) => (
  <ProviderComposer providers={providers}>{children}</ProviderComposer>
)

export default Store
