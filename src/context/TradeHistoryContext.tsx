import React, { createContext, useState, useContext } from 'react';
import { useSubscription } from 'urql';

import useWallet from '../hooks/useWallet';

const query = `
  subscription serumMarketHistory($walletAddress: String) {
    serum_events(
      where: {
        open_order_account: { owner: { _eq: $walletAddress } }
        type: { _eq: fill }
      }
    ) {
      account
      maker
      feeTier: fee_tier
      feeCost: fee_cost
      clientId: client_id
      orderId: order_id
      price
      serumMarketAddress: serum_market_address
      side
      size
      timestamp
    }
  }
`;

// TODO type the trades array
export type TradeInfo = {
  account: string;
  clientId: string;
  feeCost: number;
  feeTier: number;
  maker: boolean;
  orderId: string;
  price: number;
  serumMarketAddress: string;
  side: 'buy' | 'sell';
  size: 1;
  timestamp: string;
};

type TradeHistoryContext = {
  trades: TradeInfo[];
};

const TradeHistoryContext = createContext<TradeHistoryContext>({
  trades: [],
});

const TradeHistoryProvider: React.FC = ({ children }) => {
  const { pubKey, connected } = useWallet();
  const [trades, setTrades] = useState([]);

  const handleSubscription = (messages = [], response) => {
    setTrades([...trades, ...response?.serum_events]);
    // console.log('handleSubscription\n', { response, messages });
    return [...response?.serum_events];
  };

  const [res] = useSubscription(
    {
      query,
      pause: !connected,
      variables: {
        walletAddress: pubKey && pubKey.toString(),
      },
    },
    handleSubscription,
  );

  return (
    <TradeHistoryContext.Provider value={{ trades }}>
      {children}
    </TradeHistoryContext.Provider>
  );
};

export { TradeHistoryContext, TradeHistoryProvider };
