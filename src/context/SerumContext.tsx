import React, { useState, createContext, useContext } from 'react';
import { LocalSerumMarket } from '../types';

export type SerumContextType = {
  serumMarkets: Record<string, LocalSerumMarket>;
  setSerumMarkets: React.Dispatch<
    React.SetStateAction<Record<string, LocalSerumMarket>>
  >;
};

const SerumContext = createContext<SerumContextType>({
  serumMarkets: {},
  setSerumMarkets: () => {},
});

export const useSerumContext = (): SerumContextType => useContext(SerumContext);

const initSerumMarkets: Record<string, LocalSerumMarket> = {};

const SerumProvider: React.FC = ({ children }) => {
  const [serumMarkets, setSerumMarkets] = useState(initSerumMarkets);

  return (
    <SerumContext.Provider
      value={{
        serumMarkets,
        setSerumMarkets,
      }}
    >
      {children}
    </SerumContext.Provider>
  );
};

export { SerumContext, SerumProvider };
