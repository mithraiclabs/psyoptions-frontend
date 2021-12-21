import Box from '@material-ui/core/Box';
import React, { useCallback, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useSettleFunds, useUnsettledFundsForMarket } from '../../hooks/Serum';
import TxButton from '../TxButton';
import { useRecoilValue } from 'recoil';
import { quoteMint } from '../../recoil';
import { useTokenMintInfo } from '../../hooks/useTokenMintInfo';
import { useTokenByMint } from '../../hooks/useNetworkTokens';
import { PublicKey } from '@solana/web3.js';

/**
 * UI for showing the user their unsettled funds for an single option market.
 */
export const UnsettledFunds: React.VFC<{
  serumMarketAddress: string;
  optionKey: PublicKey | undefined;
}> = ({ optionKey, serumMarketAddress }) => {
  const _quoteMint = useRecoilValue(quoteMint);
  const quoteMintInfo = useTokenMintInfo(_quoteMint);
  const quoteAsset = useTokenByMint(_quoteMint ?? '');
  const unsettledFunds = useUnsettledFundsForMarket(serumMarketAddress);
  const { settleFunds } = useSettleFunds(serumMarketAddress, optionKey);
  const [loading, setLoading] = useState(false);
  const _settleFunds = useCallback(async () => {
    setLoading(true);
    await settleFunds();
    setLoading(false);
  }, [settleFunds]);

  if (
    unsettledFunds.baseFree.toNumber() <= 0 &&
    unsettledFunds.quoteFree.toNumber() <= 0
  ) {
    // no need to show the unsetlled funds when the user has none
    return null;
  }

  const valueUnsettled = new BigNumber(unsettledFunds.quoteFree.toString());
  return (
    <Box justifyContent="flex-end" textAlign="center" width="100%">
      Unsettled Funds
      <Box display="flex" flex="1" justifyContent="space-between" my={2}>
        <Box>Options: {unsettledFunds.baseFree.toString()}</Box>
        <Box>
          {quoteAsset?.symbol ?? _quoteMint?.toString()}:{' '}
          {valueUnsettled
            .dividedBy(10 ** (quoteMintInfo?.decimals ?? 0))
            .toString()}
        </Box>
      </Box>
      <TxButton
        color="primary"
        onClick={_settleFunds}
        variant="outlined"
        loading={loading}
      >
        {loading ? 'Settling Funds' : 'Settle Funds'}
      </TxButton>
    </Box>
  );
};
