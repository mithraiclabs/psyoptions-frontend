import React, { useState, useCallback } from 'react';
import TableRow from '@material-ui/core/TableRow';
import moment from 'moment';
import BigNumber from 'bignumber.js';

import { PublicKey } from '@solana/web3.js';
import useSerum from '../../hooks/useSerum';
import {
  useSubscribeOpenOrders,
  useSettleFunds,
  useUnsettledFundsForMarket,
} from '../../hooks/Serum';

import { TCell } from './UnsettledBalancesStyles';
import { OptionType, UnsettledRow as UnsettledRowProps } from '../../types';
import TxButton from '../TxButton';
import { useOptionMarketByKey } from '../../hooks/PsyOptionsAPI/useOptionMarketByKey';

const Empty = ({ children }) => (
  <span style={{ opacity: '0.3' }}>{children}</span>
);

const UnsettledRow = ({
  optionMarketUiKey,
  serumMarketKey,
  type,
  expiration,
  uAssetSymbol,
  qAssetSymbol,
  strikePrice,
  contractSize,
  unsettledFunds,
  settleFunds,
  qAssetDecimals,
}: {
  optionMarketUiKey: string;
  serumMarketKey: PublicKey;
  type: OptionType;
  expiration: number;
  uAssetSymbol: string;
  qAssetSymbol: string;
  strikePrice: string;
  contractSize: string;
  unsettledFunds: any;
  settleFunds: any;
  qAssetDecimals: number;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSettleFunds = useCallback(async () => {
    setLoading(true);
    await settleFunds();
    setLoading(false);
  }, [settleFunds]);

  const tokensUnsettled = new BigNumber(unsettledFunds.quoteFree.toString());

  const unsettledAssets = () => {
    if (tokensUnsettled.dividedBy(10 ** qAssetDecimals).toString() === '0') {
      return <Empty>{'-'}</Empty>;
    }
    return `${tokensUnsettled.dividedBy(10 ** qAssetDecimals).toString()}
      ${' '}${type === 'put' ? uAssetSymbol : qAssetSymbol}`;
  };

  return (
    <TableRow hover key={`tr-unsettled-${serumMarketKey}`}>
      <TCell>{type}</TCell>
      <TCell>{`${qAssetSymbol}/${uAssetSymbol}`}</TCell>
      <TCell>
        {`${moment.utc(expiration * 1000).format('LL')} 23:59:59 UTC`}
      </TCell>
      <TCell>{strikePrice}</TCell>
      <TCell>{`${contractSize} ${uAssetSymbol}`}</TCell>
      <TCell>{unsettledFunds.baseFree.toString()}</TCell>
      <TCell>{unsettledAssets()}</TCell>
      <TCell align="right">
        <TxButton
          variant="outlined"
          color="primary"
          onClick={() => handleSettleFunds()}
          loading={loading}
        >
          {loading ? 'Settling Funds' : 'Settle Funds'}
        </TxButton>
      </TCell>
    </TableRow>
  );
};

// Render all unsettled balances for a given market as table rows
const UnsettledBalancesRow: React.FC<
  UnsettledRowProps & { optionMarketUiKey: string }
> = ({
  expiration,
  optionMarketUiKey,
  size: contractSize,
  type,
  qAssetSymbol,
  uAssetSymbol,
  serumMarketKey,
  strikePrice,
  qAssetDecimals,
}) => {
  const optionMarket = useOptionMarketByKey(optionMarketUiKey);
  const { serumMarkets } = useSerum();
  const serumMarketAddress = serumMarketKey.toString();
  const { serumMarket } = serumMarkets[serumMarketAddress] || {};
  const { settleFunds } = useSettleFunds(serumMarketAddress, optionMarket);
  const unsettledFunds = useUnsettledFundsForMarket(
    serumMarketAddress,
    optionMarketUiKey,
  );

  useSubscribeOpenOrders(serumMarketAddress);

  if (
    !serumMarket ||
    (unsettledFunds.baseFree.toNumber() <= 0 &&
      unsettledFunds.quoteFree.toNumber() <= 0)
  ) {
    return null;
  }

  return (
    <UnsettledRow
      optionMarketUiKey={optionMarketUiKey}
      serumMarketKey={serumMarketKey}
      type={type}
      expiration={expiration}
      uAssetSymbol={uAssetSymbol}
      qAssetSymbol={qAssetSymbol}
      strikePrice={strikePrice}
      contractSize={contractSize}
      unsettledFunds={unsettledFunds}
      settleFunds={settleFunds}
      qAssetDecimals={qAssetDecimals}
    />
  );
};

export default React.memo(UnsettledBalancesRow);
