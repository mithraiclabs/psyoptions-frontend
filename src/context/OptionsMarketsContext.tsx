import React, { useState, createContext } from 'react';

import { OptionMarket } from '../types';

const OptionsMarketsContext = createContext<{
  marketsByUiKey: Record<string, OptionMarket>;
  setMarkets: React.Dispatch<
    React.SetStateAction<Record<string, OptionMarket>>
  >;
  marketsBySerumKey: Record<string, OptionMarket>;
  setMarketsBySerumKey: React.Dispatch<
    React.SetStateAction<Record<string, OptionMarket>>
  >;
  marketsLoading: boolean;
  setMarketsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  marketsByUiKey: {},
  setMarkets: null,
  marketsBySerumKey: {},
  setMarketsBySerumKey: null,
  marketsLoading: false,
  setMarketsLoading: null,
});

const OptionsMarketsProvider: React.FC = ({ children }) => {
  const [marketsByUiKey, setMarkets] = useState<Record<string, OptionMarket>>({});
  const [marketsBySerumKey, setMarketsBySerumKey] = useState<Record<string, OptionMarket>>({});
  const [marketsLoading, setMarketsLoading] = useState(false);

  return (
    <OptionsMarketsContext.Provider
      value={{
        marketsByUiKey,
        setMarkets,
        marketsBySerumKey,
        setMarketsBySerumKey,
        marketsLoading,
        setMarketsLoading,
      }}
    >
      {children}
    </OptionsMarketsContext.Provider>
  );
};

export { OptionsMarketsContext, OptionsMarketsProvider };
