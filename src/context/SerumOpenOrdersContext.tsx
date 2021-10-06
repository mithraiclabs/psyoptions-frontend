import { OpenOrders } from '@mithraic-labs/serum';
import React, { createContext, useContext, useState } from 'react';

export type SerumOpenOrders = Record<string, OpenOrders[]>;
type SerumOpenOrdersContext = {
  openOrdersBySerumMarket: SerumOpenOrders;
  setOpenOrdersBySerumMarket: React.Dispatch<React.SetStateAction<SerumOpenOrders>>;
};

const SerumOpenOrdersContext = createContext<SerumOpenOrdersContext>({
  openOrdersBySerumMarket: {},
  setOpenOrdersBySerumMarket: () => {},
});

export const SerumOpenOrdersProvider: React.FC = ({ children }) => {
  const [openOrdersBySerumMarket, setOpenOrdersBySerumMarket] = useState<SerumOpenOrders>({});

  return (
    <SerumOpenOrdersContext.Provider
      value={{
        openOrdersBySerumMarket,
        setOpenOrdersBySerumMarket
      }}>
      {children}
    </SerumOpenOrdersContext.Provider>
  );
};

export const useSerumOpenOrders = (): SerumOpenOrdersContext =>
  useContext(SerumOpenOrdersContext);
