import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  makeStyles,
} from '@material-ui/core';
import { StyledTooltip } from '../Markets/styles';
import InfoOutlined from '@material-ui/icons/InfoOutlined';
import { useConnectedWallet } from "@saberhq/use-solana";
import GokiButton from '../GokiButton';
import UnsettledBalancesRow from './UnsettledBalancesRow';
import { TCell, THeadCell } from '../StyledComponents/Table/TableStyles';
import { OptionType } from '../../types';
import { useSerumOpenOrders } from '../../context/SerumOpenOrdersContext';
import useAssetList from '../../hooks/useAssetList';
import useScreenSize from '../../hooks/useScreenSize';
import CSS from 'csstype';

const useStyles = makeStyles((theme) => ({
  headCell: {
    borderTop: 'none',
    padding: '8px 20px',
  },
  walletButtonCell: {
    textAlign: "-webkit-center" as CSS.Property.TextAlign,
  }
}));

const UnsettledBalancesTable = () => {
  const classes = useStyles();
  const wallet = useConnectedWallet();
  const { optionMarketsForOpenOrders } = useSerumOpenOrders();
  const { qAsset } = useAssetList();
  const { formFactor } = useScreenSize();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Box style={{ zIndex: 1 }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <THeadCell
                colSpan={9}
                className={classes.headCell}
              >
                <Box display="flex" flexDirection="row" alignItems="center">
                  <h3 style={{ margin: "0 5px 0 0" }}>Unsettled Funds</h3>
                  <StyledTooltip
                    disableTouchListener
                    open={showTooltip}
                    onOpen={() => setShowTooltip(true)}
                    onClose={() => setShowTooltip(false)}
                    title={
                      <Box px={1}>
                        <Box py={1}>
                          Smart contracts on Solana cannot take assets from a user's
                          wallet on a whim. For example, if you place a limit order
                          on Serum, and that limit order gets filled Serum cannot just
                          reach into your wallet and pull out the required tokens to
                          fill the order. So Serum must create vaults that hold your
                          tokens as soon as you place an order. 
                        </Box>
                        <Box py={1}>
                          So no matter what, when you place an order you transfer the
                          amount of assets required for that order to the Serum
                          protocol's vault for your wallet and the serum market.
                          If your order doesn't get filled and you cancel the order
                          than you have to settled the original tokens (SettleFunds)
                          back to your wallet from the vault owned by Serum. 
                        </Box>
                        <Box py={1}>
                          If your order gets filled, Serum takes the tokens you put up
                          for the order and swaps it with the other users' tokens they
                          put up on the other end of the trade, and places them in a
                          vault. Now you have to settle the swapped tokens to from the
                          vault account to your wallet.
                        </Box>
                      </Box>
                    }
                  >
                    <IconButton color="inherit" onClick={() => setShowTooltip(!showTooltip)}>
                      <InfoOutlined />
                    </IconButton>
                  </StyledTooltip>
                </Box>
              </THeadCell>
            </TableRow>
            <TableRow>
              { formFactor === 'desktop' ?
              <>
                <THeadCell>Option Type</THeadCell>
                <THeadCell>Asset Pair</THeadCell>
                <THeadCell>Expiration</THeadCell>
                <THeadCell>Strike Price</THeadCell>
                <THeadCell>Contract Size</THeadCell>
                <THeadCell>Options</THeadCell>
                <THeadCell>Assets</THeadCell>
                <THeadCell align="right">Action</THeadCell>
              </> :
              <>
                <THeadCell>Asset</THeadCell>
                <THeadCell>Expiration</THeadCell>
                <THeadCell>Funds</THeadCell>
                <THeadCell align="right">Action</THeadCell>
              </>}
            </TableRow>
          </TableHead>
          <TableBody>
            {!wallet?.connected ? (
              <TableRow>
                <TCell align="center" colSpan={10} className={classes.walletButtonCell}>
                  <Box p={1}>
                    <GokiButton />
                  </Box>
                </TCell>
              </TableRow>
            ) : (
              optionMarketsForOpenOrders.map((optionMarket) => (
                (optionMarket.serumMarketKey && qAsset) ?
                <UnsettledBalancesRow
                  expiration={optionMarket.expiration}
                  contractSize={optionMarket.qAssetSymbol === "USDC" ? optionMarket.size : optionMarket.quoteAmountPerContract.toString()}
                  // #TODO: change later, should have option type here
                  type={optionMarket.qAssetSymbol === "USDC" ? OptionType.CALL : OptionType.PUT}
                  qAssetSymbol={optionMarket.qAssetSymbol}
                  uAssetSymbol={optionMarket.uAssetSymbol}
                  serumMarketKey={optionMarket.serumMarketKey}
                  strikePrice={optionMarket.qAssetSymbol === "USDC" ? optionMarket.strike.toString() :
                    optionMarket.amountPerContract.dividedBy(optionMarket.quoteAmountPerContract).toString()}
                  qAssetDecimals={qAsset.decimals}
                  key={`${optionMarket.serumMarketKey.toString()}-unsettled`}
                /> : null
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(UnsettledBalancesTable);
