import { useCallback, useContext } from 'react';
import BigNumber from 'bignumber.js';

import useOptionsMarkets from './useOptionsMarkets';
import { OptionsChainContext } from '../context/OptionsChainContext';
import useAssetList from './useAssetList';
import useNotifications from './useNotifications';
import { ChainRow, OptionMarket } from '../types';
import { useNormalizedContractSize } from './useNormalizedContractSize';

const callOrPutTemplate = {
  key: '',
  bid: '',
  ask: '',
  change: '',
  volume: '',
  openInterest: '',
  size: '',
  initialized: false,
};

/**
 * @deprecated
 */
const useOptionsChain = () => {
  const { pushNotification } = useNotifications();
  const { marketsByUiKey, marketsLoading } = useOptionsMarkets();
  const { uAsset, qAsset } = useAssetList();
  const contractSize = useNormalizedContractSize();
  const { chains, setChains } = useContext(OptionsChainContext);

  /**
   * Builds an options chain and set it in the OptionsChainContext
   * This is synchronous but expects markets to be loaded
   *
   * @param {number} dateTimestamp - Expiration as unix timestamp in seconds
   */
  const buildOptionsChain = useCallback(
    (dateTimestamp: number) => {
      try {
        if (marketsLoading) return;

        if (
          !uAsset?.tokenSymbol ||
          !qAsset?.tokenSymbol ||
          !dateTimestamp ||
          !marketsByUiKey ||
          Object.keys(marketsByUiKey).length < 1
        ) {
          setChains([]);
          return;
        }

        const callKeyPart = `${dateTimestamp}-${uAsset.tokenSymbol}-${qAsset.tokenSymbol}`;
        const putKeyPart = `${dateTimestamp}-${qAsset.tokenSymbol}-${uAsset.tokenSymbol}`;

        const callPutMap = (
          k: string,
        ): OptionMarket & {
          fraction: string;
          reciprocalFraction: string;
        } => {
          const amt = marketsByUiKey[k].amountPerContract.toString();
          const qAmt = marketsByUiKey[k].quoteAmountPerContract.toString();
          return {
            fraction: `${amt}/${qAmt}`,
            reciprocalFraction: `${qAmt}/${amt}`,
            ...marketsByUiKey[k],
          };
        };

        const calls = Object.keys(marketsByUiKey)
          .filter((k) => k.match(callKeyPart))
          .map(callPutMap);
        const puts = Object.keys(marketsByUiKey)
          .filter((k) => k.match(putKeyPart))
          .map(callPutMap);

        const strikeFractions = Array.from(
          new Set([
            ...calls.map((m) => m.fraction),
            ...puts.map((m) => m.reciprocalFraction),
          ]),
        );

        const rows: ChainRow[] = [];

        strikeFractions.forEach((fraction) => {
          const sizes: Set<string> = new Set();
          const [amt, qAmt] = fraction.split('/');
          const strike = new BigNumber(qAmt).div(new BigNumber(amt));

          const matchingCalls = calls.filter((c) => {
            if (c.fraction === fraction) {
              sizes.add(c.size);
              return true;
            }
            return false;
          });

          const matchingPuts = puts.filter((p) => {
            if (p.reciprocalFraction === fraction) {
              sizes.add(p.quoteAmountPerContract.toString());
              return true;
            }
            return false;
          });

          Array.from(sizes)
            .filter((size) => size === `${contractSize}`)
            .forEach(async (size) => {
              const call = matchingCalls.find((c) => c.size === size);
              const put = matchingPuts.find(
                (p) => p.quoteAmountPerContract.toString() === size,
              );

              const row = {
                strike,
                size,
                call: call
                  ? {
                      ...callOrPutTemplate,
                      ...call,
                      initialized: true,
                    }
                  : callOrPutTemplate,
                put: put
                  ? {
                      ...callOrPutTemplate,
                      ...put,
                      initialized: true,
                    }
                  : callOrPutTemplate,
                key: `${callKeyPart}-${size}-${strike}`,
              };

              rows.push(row);
            });
        });

        rows.sort((a, b) => a.strike.minus(b.strike).toNumber());
        setChains(rows);
      } catch (err) {
        pushNotification({
          severity: 'error',
          message: `${err}`,
        });
        setChains([]);
      }
    },
    [
      contractSize,
      marketsLoading,
      uAsset?.tokenSymbol,
      qAsset?.tokenSymbol,
      marketsByUiKey,
      setChains,
      pushNotification,
    ],
  );

  return {
    chains,
    buildOptionsChain,
  };
};

export default useOptionsChain;
