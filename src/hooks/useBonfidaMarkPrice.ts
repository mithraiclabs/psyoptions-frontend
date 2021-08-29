import axios from 'axios';
import { useEffect, useState } from 'react';
import useNotifications from './useNotifications';

export const useBonfidaMarkPrice = ({
  uAssetSymbol,
  qAssetSymbol,
}: {
  uAssetSymbol: string;
  qAssetSymbol: string;
}) => {
  const [markPrice, setMarkPrice] = useState(0);
  const { pushNotification } = useNotifications();

  useEffect(() => {
    setMarkPrice(0);
    let timer;
    if (uAssetSymbol && qAssetSymbol) {
      const fetchPrice = async () => {
        try {
          const resp = await axios.get(
            `https://serum-api.bonfida.com/orderbooks/${uAssetSymbol}${qAssetSymbol}`,
          );
          const highestBid = resp?.data?.data?.bids[0]?.price;
          const lowestAsk = resp?.data?.data?.asks[0]?.price;
          if (highestBid && lowestAsk) {
            setMarkPrice((highestBid + lowestAsk) / 2);
          } else {
            setMarkPrice(0);
          }
        } catch (err) {
          // Stop polling on failure to prevent error messages from popping up repeatedly
          clearInterval(timer);
          setMarkPrice(0);
          pushNotification({
            severity: 'error',
            message: `Couldn't load market price for ${uAssetSymbol}`,
          });
          console.error({
            ...err,
          });
        }
      };

      if (timer) {
        clearInterval(timer);
      }

      timer = setInterval(fetchPrice, 10000);
      fetchPrice();
    }

    return () => {
      clearInterval(timer);
    };
  }, [uAssetSymbol, qAssetSymbol, pushNotification]);

  return markPrice;
};
