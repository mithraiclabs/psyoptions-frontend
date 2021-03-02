import React, { cloneElement } from 'react'
import { ThemeProvider } from '@material-ui/core/styles'
import PropTypes from 'prop-types'

import { ConnectionProvider } from './ConnectionContext'
import { OwnedTokenAccountsProvider } from './OwnedTokenAccounts'
import { WalletProvider } from './WalletContext'
import { NotificationsProvider } from './NotificationsContext'
import { OptionsMarketsProvider } from './OptionsMarketsContext'
import { AssetListProvider } from './AssetListContext'
import theme from '../utils/theme'

const _providers = [
  // eslint-disable-next-line react/no-children-prop
  <ThemeProvider theme={theme} children={<div />} />,
  <NotificationsProvider />,
  <ConnectionProvider />,
  <AssetListProvider />,
  <WalletProvider />,
  <OwnedTokenAccountsProvider />,
  <OptionsMarketsProvider />,
]

// flatten context providers for simpler app component tree

const ProviderComposer = ({ providers, children }) =>
  providers.reduceRight(
    (kids, parent) => cloneElement(parent, { children: kids }),
    children,
  )

const Store = ({ children }) => (
  <ProviderComposer providers={_providers}>{children}</ProviderComposer>
)

Store.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Store
