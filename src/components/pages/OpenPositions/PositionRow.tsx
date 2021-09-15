import React, { useCallback, useState } from 'react';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import BigNumber from 'bignumber.js';

import ExerciseDialog from './ExerciseDialog';
import useAssetList from '../../../hooks/useAssetList';
import {
  formatExpirationTimestamp,
  formatExpirationTimestampDate,
} from '../../../utils/format';
import { OptionMarket, OptionType, TokenAccount } from '../../../types';
import { usePrices } from '../../../context/PricesContext';

const useStyles = makeStyles({
  dropdownOpen: {
    transform: 'rotate(-180deg)',
  },
  dropdownClosed: {
    transform: 'rotate(0)',
  },
});

const PositionRow: React.VFC<{
  row: {
    accounts: TokenAccount[];
    assetPair: string;
    expiration: number;
    market: OptionMarket;
    size: number;
    strikePrice: string;
    qAssetSymbol: string;
    qAssetMintAddress: string;
    uAssetSymbol: string;
    uAssetMintAddress: string;
    amountPerContract: BigNumber;
    quoteAmountPerContract: BigNumber;
  };
}> = ({ row }) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const { supportedAssets } = useAssetList();
  const theme = useTheme();
  const { prices } = usePrices();
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);

  const nowInSeconds = Date.now() / 1000;
  const expired = row.expiration <= nowInSeconds;

  let optionType: OptionType;
  if (row?.uAssetSymbol) {
    optionType = row?.uAssetSymbol?.match(/^USD/)
      ? OptionType.PUT
      : OptionType.CALL;
  }

  const price =
    optionType === OptionType.CALL
      ? prices[row?.uAssetSymbol]
      : prices[row?.qAssetSymbol];

  const strike =
    optionType === OptionType.PUT
      ? row.amountPerContract.dividedBy(row.quoteAmountPerContract).toString()
      : row.market.strike.toString(10);

  const contractSize =
    optionType === OptionType.CALL
      ? row.amountPerContract.toString()
      : row.quoteAmountPerContract.toString();

  const onRowClick = () => {
    if (row.accounts.length > 1) {
      setVisible((vis) => !vis);
    }
  };

  const openExerciseDialog = useCallback(() => {
    setExerciseDialogOpen(true)
  }, [])

  const uAssetSymbol =
    optionType === 'put' ? row?.qAssetSymbol : row?.uAssetSymbol;

  const qAssetSymbol =
    optionType === 'put' ? row?.uAssetSymbol : row?.qAssetSymbol;

  const uAssetImage = supportedAssets.find(
    (asset) =>
      asset?.mintAddress ===
      (optionType === 'put' ? row?.qAssetMintAddress : row?.uAssetMintAddress),
  )?.icon;

  return (
    <>
      <ExerciseDialog
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        positionSize={row.size}
        uAssetSymbol={uAssetSymbol}
        uAssetMintAddress={row?.uAssetMintAddress}
        qAssetSymbol={qAssetSymbol}
        qAssetMintAddress={row?.qAssetMintAddress}
        optionType={optionType}
        contractSize={contractSize}
        strike={strike}
        expiration={formatExpirationTimestampDate(row.expiration)}
        price={price}
        market={row.market}
      />
      <Box
        onClick={onRowClick}
        role="checkbox"
        tabIndex={-1}
        key={row.market.optionMintKey.toString()}
        display="flex"
        flexDirection="row"
        alignItems="center"
        p={1}
      >
        <Box
          p={1}
          pl={2}
          width="12%"
          display="flex"
          flexDirection="row"
          alignItems="center"
        >
          <Avatar style={{ width: 24, height: 24 }} src={uAssetImage}>
            {uAssetSymbol.slice(0, 1)}
          </Avatar>
          <Box pl={1}>{uAssetSymbol}</Box>
        </Box>
        <Box p={1} width="8%">
          {optionType}
        </Box>
        <Box p={1} width="10%">
          {strike}
        </Box>
        <Box p={1} width="10%">
          {price ? `$${price.toFixed(2)}` : '-'}
        </Box>
        <Box p={1} width="10%">
          {contractSize}
        </Box>
        <Box p={1} width="10%">
          {row.size}
        </Box>
        <Box p={1} width="16%">
          {formatExpirationTimestamp(row.expiration)}
        </Box>
        <Box p={1} width="9%">{`+$0.00`}</Box>
        <Box p={1} width="10%">
          {expired && <Box color={theme.palette.error.main}>Expired</Box>}
          {!expired && (
            <Box>
              <Button
                color="primary"
                variant="outlined"
                onClick={openExerciseDialog}
              >
                Exercise
              </Button>
            </Box>
          )}
        </Box>
        <Box width="5%" p={1} pr={2}>
          {row.accounts.length > 1 && (
            <KeyboardArrowDown
              className={
                visible ? classes.dropdownOpen : classes.dropdownClosed
              }
            />
          )}
        </Box>
      </Box>
      <Box key={`${row.market.optionMintKey}Collapsible`}>
        <Collapse in={visible} timeout="auto" unmountOnExit>
          <Box>
            {row.accounts.map((account) => (
              <Box
                key={`${account?.pubKey}`}
                display="flex"
                flexDirection="row"
                alignItems="center"
                p={1}
              >
                <Box p={1} pl={2} width="12%" />
                <Box p={1} width="8%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%" />
                <Box p={1} width="10%">
                  {contractSize}
                </Box>
                <Box p={1} width="10%">
                  {account.amount}
                </Box>
                <Box p={1} width="16%" />
                <Box p={1} width="9%">{`+$0.00`}</Box>
                <Box p={1} width="10%">
                  {expired && (
                    <Box color={theme.palette.error.main}>Expired</Box>
                  )}
                  {!expired && (
                    <Box>
                      <Button
                        color="primary"
                        variant="outlined"
                        onClick={openExerciseDialog}
                      >
                        Exercise
                      </Button>
                    </Box>
                  )}
                </Box>
                <Box width="5%" p={1} pr={2} />
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </>
  );
};

export default React.memo(PositionRow);
