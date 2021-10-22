import React, { cloneElement } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';

import { ConnectionProvider } from './ConnectionContext';
import { OwnedTokenAccountsProvider } from './OwnedTokenAccounts';
import { WalletInfoProvider } from './WalletInfoContext';
import { WalletKitProvider } from "@gokiprotocol/walletkit";
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
import { ScreenSizeProvider } from './ScreenSizeContext';

const _providers: React.ReactElement[] = [
  // eslint-disable-next-line react/no-children-prop
  <ThemeProvider key="ThemeProvider" theme={theme} children={<div />} />,
  <ConnectionProvider key="ConnectionProvider" />,
  <GraphQLProvider key="GraphQLProvider" />,
  <NotificationsProvider key="NotificationsProvider" />,
  <SolanaMetaProvider key="SolanaMetaProvider" />,
  <AssetListProvider key="AssetListProvider" />,
  // eslint-disable-next-line react/no-children-prop
  <WalletKitProvider
    key="WalletKitProvider"
    defaultNetwork="mainnet-beta"
    app={{
      name: "PsyOptions",
    }}
  />,
  <WalletInfoProvider key="WalletInfoProvider" />,
  <OwnedTokenAccountsProvider key="OwnedTokenAccountsProvider" />,
  <OptionsMarketsProvider key="OptionsMarketsProvider" />,
  <SPLTokenMintsProvider key="SPLTokenMintsProvider" />,
  <OptionsChainProvider key="OptionsChainProvider" />,
  <SerumProvider key="SerumProvider" />,
  <SerumOrderbooksProvider key="SerumOrderbooksProvider" />,
  <SerumOpenOrdersProvider key="SerumOpenOrdersProvider" />,
  <PasswordProvider key="PasswordProvider" />,
  <ExpirationDateProvider key="ExpirationDateProvider" />,
  <ScreenSizeProvider key="ScreenSizeProvider" />,
  <SimpleUIFormProvider key="SimpleUIFormProvider" />,
];

// flatten context providers for simpler app component tree

const ProviderComposer: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[];
}> = ({ providers, children }) =>
  providers.reduceRight(
    (kids, parent) => cloneElement(parent, { children: kids }),
    children,
  );

const Store: React.FC = ({ children }) => (
  <ProviderComposer providers={_providers}>{children}</ProviderComposer>
);

export default Store;
