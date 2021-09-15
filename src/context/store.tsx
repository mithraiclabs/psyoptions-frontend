import React, { cloneElement } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';

import { ConnectionProvider } from './ConnectionContext';
import { OwnedTokenAccountsProvider } from './OwnedTokenAccounts';
import { WalletProvider } from './WalletContext';
import { NotificationsProvider } from './NotificationsContext';
import { OptionsMarketsProvider } from './OptionsMarketsContext';
import { SerumProvider } from './SerumContext';
import { OptionsChainProvider } from './OptionsChainContext';
import { AssetListProvider } from './AssetListContext';
import { SolanaMetaProvider } from './SolanaMetaContext';
import { PasswordProvider } from './PasswordContext';
import theme from '../utils/theme';
import { SerumOrderbooksProvider } from './SerumOrderbookContext';
import { SPLTokenMintsProvider } from './SPLTokenMintsContext';
import { SerumOpenOrdersProvider } from './SerumOpenOrdersContext';
import { ExpirationDateProvider } from './ExpirationDateContext';
import { GraphQLProvider } from './GraphQLProvider';
import { SimpleUIFormProvider } from './SimpleUIContext';

const _providers = [
  // eslint-disable-next-line react/no-children-prop
  <ThemeProvider theme={theme} children={<div />} />,
  <ConnectionProvider />,
  <GraphQLProvider />,
  <NotificationsProvider />,
  <SolanaMetaProvider />,
  <AssetListProvider />,
  <WalletProvider />,
  <OwnedTokenAccountsProvider />,
  <OptionsMarketsProvider />,
  <SPLTokenMintsProvider />,
  <OptionsChainProvider />,
  <SerumProvider />,
  <SerumOrderbooksProvider />,
  <SerumOpenOrdersProvider />,
  <PasswordProvider />,
  <ExpirationDateProvider />,
  <SimpleUIFormProvider />,
];

// flatten context providers for simpler app component tree

const ProviderComposer = ({ providers, children }) =>
  providers.reduceRight(
    (kids, parent) => cloneElement(parent, { children: kids }),
    children,
  );

const Store: React.FC = ({ children }) => (
  <ProviderComposer providers={_providers}>{children}</ProviderComposer>
);

export default Store;
