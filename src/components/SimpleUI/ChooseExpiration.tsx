import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { useTheme } from '@material-ui/core/styles';
import { BN } from '@project-serum/anchor';
import moment from 'moment';

import { useUpdateForm, useFormState } from '../../context/SimpleUIContext';
import { SimpleUIPage } from './SimpeUIPage';
import { useValidOptionExpirations } from '../../hooks/BeginnerUI/useValidOptionExpirations';

const ChooseDateButton: React.VFC<{
  expiration: BN;
  selected: boolean;
  onClick: () => void;
}> = ({ expiration, selected, onClick }) => {
  const theme = useTheme();
  const date = useMemo(
    () => moment.utc(expiration.toNumber() * 1000),
    [expiration],
  );

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
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        p={1}
        color={theme?.palette?.primary?.light}
        fontSize={'16px'}
      >
        <span>{date.format('MMMM Do YYYY')}</span>
        <span>{`${date.format('HH:mm:ss')} UTC`}</span>
      </Box>
    </Button>
  );
};

/**
 * Only show future expirations ASSET / USDC options that have at least 3 options
 */
const ChooseExpiration = () => {
  const { tokenSymbol, direction } = useFormState();
  const updateForm = useUpdateForm();
  const history = useHistory();
  const [selectedExpiration, setSelectedExpiration] = useState(0);
  const optionExpirations = useValidOptionExpirations();

  // If previous form state didn't exist, send user back to first page (choose asset)
  useEffect(() => {
    if (!tokenSymbol || !direction) {
      history.replace('/simple/choose-asset');
    }
  }, [tokenSymbol, direction, history]);

  const handleMakeSelection = (d: BN) => {
    if (!selectedExpiration) {
      setSelectedExpiration(d.toNumber());
      updateForm('expirationUnixTimestamp', d.toNumber());

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/choose-strike');
      }, 500);
    }
  };

  return (
    <SimpleUIPage title={`On or before this date`}>
      <Box
        width="100%"
        px={2}
        py={1}
        flexDirection="column"
        display="flex"
        justifyContent="center"
      >
        {optionExpirations.map((expiration) => (
          <Box my={1} key={expiration.toString()}>
            <ChooseDateButton
              expiration={expiration}
              onClick={() => handleMakeSelection(expiration)}
              selected={selectedExpiration === expiration.toNumber()}
            />
          </Box>
        ))}
      </Box>
    </SimpleUIPage>
  );
};

export default ChooseExpiration;
