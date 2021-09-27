import React, { memo, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import useFilteredOptionsChain from '../../../../../hooks/useFilteredOptionsChain';
import {
  useUpdateForm,
  useFormState,
} from '../../../../../context/SimpleUIContext';
import ChooseStrikeButton from './ChooseStrikeButton';
import { SimpleUIPage } from '../../SimpeUIPage';

type StrikeButtonData = {
  strike: string;
  bid: number | null;
  ask: number | null;
};

const ChooseStrike = () => {
  const { tokenSymbol, direction, expirationUnixTimestamp } = useFormState();
  const updateForm = useUpdateForm();
  const history = useHistory();
  const { lowestAskHighestBidPerStrike, setDirection } = useFilteredOptionsChain();
  const [selectedStrike, setSelectedStrike] = useState('');
  const [strikeButtonData, setStrikeButtonData] = useState([] as StrikeButtonData[]);

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction || !expirationUnixTimestamp) {
      history.replace('/simple/choose-asset');
    }

    // If previous form state did exist, we need to load the markets on mount
  }, [tokenSymbol, direction, history, expirationUnixTimestamp]);

  useEffect(() => {
    setDirection(direction);
  }, [direction, setDirection]);

  // #TODO: eventually, when adding contract size input
  // useEffect(() => {
  //   buildOptionsChain(date.unix(), contractSize);
  // }, [buildOptionsChain, contractSize, date]);

  const handleMakeSelection = (strike: string) => {
    if (!selectedStrike) {
      setSelectedStrike(strike);
      updateForm('strike', Number(strike));

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/order-settings');
      }, 500);
    }
  }

  // Map filtered chains to a Strike + Bid + Ask
  useEffect(() => {
    const buttonData: StrikeButtonData[] = Object.keys(lowestAskHighestBidPerStrike).map(strike => {
      const bidAndAskForStrike = lowestAskHighestBidPerStrike[strike];

      return {
        strike,
        bid: bidAndAskForStrike?.bid,
        ask: bidAndAskForStrike?.ask,
      };
    });

    // if put, then strikes need to flip so higher strike shows at top (because we have that Low/High risk scale)
    setStrikeButtonData(direction === 'down' ? buttonData.reverse() : buttonData);
  }, [lowestAskHighestBidPerStrike, direction]);

  return (
    <SimpleUIPage title={`Strike Price`}>
      <Box
        display='flex'
        flexDirection='row'
        width='100%'
      >
        {strikeButtonData.length > 1 && <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          textAlign='center'
          padding='42.5px 0 42.5px 16px'
        >
          <div style={{
            fontWeight: 700,
            color: '#8BEAFF',
            fontSize: 10
          }}>Low risk High cost</div>
          <div style={{
            height: '100%',
            width: 4,
            background: 'linear-gradient(180deg, #51F39C 0%, #E36491 100%)',
            borderRadius: 100,
            margin: '8px 0 8px 0',
          }}/>
          <div style={{
            fontWeight: 700,
            color: '#8BEAFF',
            fontSize: 10
          }}>High risk Low cost</div>
        </Box>}
        <Box
          width='100%'
          px={2}
          py={1}
          flexDirection='column'
          display='flex'
          justifyContent='center'
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
                disabled={false}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </SimpleUIPage>
  )
}

export default memo(ChooseStrike);
