import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { useSerumContext } from '../../context/SerumContext';
import { ChainRow } from '../../types';

export type TrackerMarketData = {
  price: number;
  change24h: number;
  volBase24h: string;
};

const queryMessage = (
  serumAddress: string,
) => `market(address:"${serumAddress}") {
    address
    isPermissioned
    stats{
      price
      change24h
      volBase24h
    }
  }`;

const batchQueryMessage = (serumAddresses: string[]) => {
  const msg = serumAddresses.reduce(
    (acc, cur, index) => `${acc}market_${index}: ${queryMessage(cur)}\n`,
    '',
  );
  if (msg.length) {
    return `{${msg}}`;
  }
  return `{market(address:"fsdafas") {
    address
    isPermissioned
    stats{
      price
      change24h
      vol24h
    }
  }}`;
};

export const useChainMarketData = (
  chain: ChainRow[] | undefined,
): Record<string, TrackerMarketData> => {
  const { serumMarkets } = useSerumContext();
  const serumMarketAddresses = useMemo(
    () =>
      chain?.reduce((acc, chainRow) => {
        const callMarketMeta =
          serumMarkets[chainRow?.call?.serumMarketKey?.toString() ?? ''];
        const putMarketMeta =
          serumMarkets[chainRow?.put?.serumMarketKey?.toString() ?? ''];
        if (callMarketMeta?.serumMarket?.address) {
          acc.push(callMarketMeta.serumMarket.address.toString());
        }
        if (putMarketMeta?.serumMarket?.address) {
          acc.push(putMarketMeta.serumMarket.address.toString());
        }
        return acc;
      }, [] as string[]) ?? [],
    [chain, serumMarkets],
  );

  const batchQueryMsg = batchQueryMessage(serumMarketAddresses);
  const pause = batchQueryMsg.length <= 2;

  const [res, reexecuteQuery] = useQuery({
    query: batchQueryMsg,
    pause,
  });

  const data: Record<string, TrackerMarketData> = {};
  if (!res.fetching && res.data) {
    serumMarketAddresses.forEach((address, index) => {
      const stats = res.data[`market_${index}`]?.stats;
      if (stats) {
        data[address] = stats;
      }
    });
  }

  return data;
};
