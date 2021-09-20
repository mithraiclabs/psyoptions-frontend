import React, { memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { useTheme } from '@material-ui/core/styles';
import useSerum from '../../../../hooks/useSerum';
import { OrderbookData, useSerumOrderbooks } from '../../../../context/SerumOrderbookContext';
import { calculateStrikePrecision } from '../../../../utils/getStrikePrices';
import { SerumMarketAndProgramId, ChainRow } from 'src/types';
import useOptionsChain from '../../../../hooks/useOptionsChain';
import {
  useUpdateForm,
  useFormState,
} from '../../../../context/SimpleUIContext';
import { SimpleUIPage } from '../SimpeUIPage';

const ChooseStrikeButton = ({ strike, bid, ask, selected, onClick }) => {
  const theme = useTheme();

  return (
    <Button
      fullWidth
      style={{
        padding: 0,
        border: selected
          ? `1px solid ${theme.palette.primary.light}`
          : `1px solid rgba(139, 234, 255, 0)`,
        boxShadow: selected ? `inset 0 0 20px rgba(139, 234, 255, 0.25)` : '',
        background: 'rgba(255, 255, 255, 0.05)',
      }}
      onClick={onClick}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        textAlign="left"
        p={1}
        color={theme?.palette?.primary?.light}
        fontSize={'16px'}
      >
        <Box paddingLeft={1}>
          <h4 style={{ margin: 0 }}>{`$${strike}`}</h4>
        </Box>
        <Box
          width="100%"
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          p={1}
        >
          <Box>{bid ? `Bid: $${bid}`: 'Bid: None'}</Box>
          <Box>{ask ? `Ask: $${ask}`: 'Ask: None'}</Box>
        </Box>
      </Box>
    </Button>
  );
};

type StrikeButtonData = {
  strike: string;
  bid: number | null;
  ask: number | null;
};

const ChooseStrike = () => {
  const { tokenSymbol, direction, expirationUnixTimestamp } = useFormState();
  const updateForm = useUpdateForm();
  const history = useHistory();
  const { chains } = useOptionsChain();
  const { serumMarkets, fetchMultipleSerumMarkets } = useSerum();
  const [orderbooks] = useSerumOrderbooks();
  const [selectedStrike, setSelectedStrike] = useState('');
  const [filteredChains, setFilteredChains] = useState([] as ChainRow[]);
  const [strikeButtonData, setStrikeButtonData] = useState([] as StrikeButtonData[]);
  const [precision, setPrecision] = useState(2);

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp) {
      history.replace('/simple/choose-asset');
    }

    // If previous form state did exist, we need to load the markets on mount
  }, [tokenSymbol, direction, history, expirationUnixTimestamp]);

  useEffect(() => {
    // depending on direction user chose, only show calls or puts accordingly
    const filtered: ChainRow[] = chains.filter(chain => {
      if (chain.call.key && direction === "up")
        return true;
      if (chain.put.key && direction === "down")
        return true;
      return false;
    });

    if (filtered[0]?.strike) {
      setPrecision(calculateStrikePrecision(chains[0].strike));
    }

    setFilteredChains(filtered);
  }, [chains, direction]);

  // #TODO: eventually, when adding contract size input
  // useEffect(() => {
  //   buildOptionsChain(date.unix(), contractSize);
  // }, [buildOptionsChain, contractSize, date]);

  const handleMakeSelection = (strike: string) => {
    if (!selectedStrike) {
      setSelectedStrike(strike);
      updateForm('strike', strike);

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/confirm');
      }, 500);
    }
  }

  // Load serum markets when the options chain changes
  // Only if they don't already exist for the matching call/put
  useEffect(() => {
    const serumKeys: SerumMarketAndProgramId[] = [];
    filteredChains.forEach(chain => {
      if (
        chain.call.key && chain.call.serumMarketKey &&
        !serumMarkets[chain.call.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.call.serumMarketKey,
          serumProgramId: chain.call.serumProgramId,
        });
      }
      if (
        chain.put.key && chain.put.serumMarketKey &&
        !serumMarkets[chain.put.serumMarketKey.toString()]
      ) {
        serumKeys.push({
          serumMarketKey: chain.put.serumMarketKey,
          serumProgramId: chain.put.serumProgramId,
        });
      }
    });

    if (serumKeys.length) {
      fetchMultipleSerumMarkets(serumKeys);
    }
  }, [filteredChains, fetchMultipleSerumMarkets, serumMarkets]);

  // Map filtered chains to a Strike + Bid + Ask
  useEffect(() => {
    const buttonData: StrikeButtonData[] = filteredChains.map(chain => {
      let highestBid: number | null = null;
      let lowestAsk: number | null = null;
      let orderbook: OrderbookData | null;

      chain.call.key ? orderbook = orderbooks[chain.call.serumMarketKey?.toString()] :
        orderbook = orderbooks[chain.put.serumMarketKey?.toString()];
      highestBid = orderbook?.bids[0]?.price;
      lowestAsk = orderbook?.asks[0]?.price;

      return {
        strike: chain.strike.toFixed(precision),
        bid: highestBid,
        ask: lowestAsk,
      };
    });

    setStrikeButtonData(buttonData);
  }, [filteredChains, orderbooks, precision]);

  return (
    <SimpleUIPage title={`Strike Price`}>
      <Box
        width="100%"
        px={2}
        py={1}
        flexDirection="column"
        display="flex"
        justifyContent="center"
      >
        {/* #TODO: come back and choose middle 3 strikes? */}
        {strikeButtonData.slice(0, 3).map((s) => (
          <Box my={1} key={s.strike}>
            <ChooseStrikeButton
              strike={s.strike}
              bid={s.bid}
              ask={s.ask}
              onClick={() => handleMakeSelection(s.strike)}
              selected={selectedStrike === s.strike}
            />
          </Box>
        ))}
      </Box>
    </SimpleUIPage>
  )
}

export default memo(ChooseStrike);
