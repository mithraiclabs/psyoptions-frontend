import React, { createContext, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import useAssetList from '../hooks/useAssetList';

type PricesContext = {
  prices: Record<string, number>;
};

const PricesContext = createContext<PricesContext>({
  prices: {},
});

const PricesProvider: React.FC = ({ children }) => {
  const { supportedAssets, assetListLoading } = useAssetList();
  const [prices, setPrices] = useState({});
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    let timer;

    if (!assetListLoading) {
      const fetchPrices = async () => {
        const newPrices = {};
        const newFailed: string[] = [];

        await Promise.allSettled(
          supportedAssets.map(async (asset) => {
            if (
              asset?.tokenSymbol === 'USDC' ||
              failed.includes(asset?.tokenSymbol)
            )
              return;

            // TODO - find a different API besides bonfida that can be batched
            try {
              const resp = await axios.get(
                `https://serum-api.bonfida.com/orderbooks/${asset?.tokenSymbol}USDC`,
              );
              const highestBid = resp?.data?.data?.bids[0]?.price;
              const lowestAsk = resp?.data?.data?.asks[0]?.price;
              if (highestBid && lowestAsk) {
                newPrices[asset?.tokenSymbol] = (highestBid + lowestAsk) / 2;
              } else {
                newPrices[asset?.tokenSymbol] = 0;
              }
            } catch (err) {
              newPrices[asset?.tokenSymbol] = 0;
              console.error(
                `Couldn't load market price for ${asset?.tokenSymbol}`,
                err,
              );
              newFailed.push(asset?.tokenSymbol);
            }
          }),
        );
        setPrices((oldPrices) => ({ ...oldPrices, ...newPrices }));
        if (newFailed.length > 0) {
          setFailed((oldFailed) => [...oldFailed, ...newFailed]);
        }
      };

      if (timer) {
        clearInterval(timer);
      }

      timer = setInterval(fetchPrices, 10000);
      fetchPrices();
    }

    return () => {
      clearInterval(timer);
    };
  }, [assetListLoading, supportedAssets, failed]);

  const value = {
    prices,
  };

  return (
    <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
  );
};

const usePrices = () => useContext(PricesContext);

export { PricesContext, PricesProvider, usePrices };
