import React, { useState } from 'react';
import { Box, IconButton, TableHead, TableRow } from '@material-ui/core';
import { ColumnDisplaySelector } from './ColumnDisplaySelector';
import InfoOutlined from '@material-ui/icons/InfoOutlined';
import { useRecoilValue } from 'recoil';
import { THeadCell, TCellStrike, StyledTooltip } from './styles';
import { quoteMint, underlyingMint } from '../../recoil';
import { useTokenByMint } from '../../hooks/useNetworkTokens';

export const MarketsTableHeader: React.FC<{
  showIV: boolean;
  showPriceChange: boolean;
  showVolume: boolean;
  showOI: boolean;
  showLastPrice: boolean;
  setShowIV: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPriceChange: React.Dispatch<React.SetStateAction<boolean>>;
  setShowVolume: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOI: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLastPrice: React.Dispatch<React.SetStateAction<boolean>>;
  currentColumnsCount: number;
  setColumnsCount: (num: number) => void;
}> = ({
  showIV,
  showPriceChange,
  showVolume,
  showOI,
  showLastPrice,
  setShowIV,
  setShowPriceChange,
  setShowVolume,
  setShowOI,
  setShowLastPrice,
  currentColumnsCount,
  setColumnsCount,
}) => {
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _quoteMint = useRecoilValue(quoteMint);
  const underlyingAsset = useTokenByMint(_underlyingMint ?? '');
  const quoteAsset = useTokenByMint(_quoteMint ?? '');
  const [showCallsTooltip, setShowCallsTooltip] = useState(false);
  const [showPutsTooltip, setShowPutsTooltip] = useState(false);
  const colWidth = (1 / currentColumnsCount) * 100;
  const underlyingAssetSymbol =
    underlyingAsset?.symbol ?? _underlyingMint?.toString() ?? '';
  const quoteAssetSymbol = quoteAsset?.symbol ?? _quoteMint?.toString() ?? '';

  return (
    <TableHead>
      <TableRow>
        <THeadCell
          colSpan={Math.floor(currentColumnsCount / 2)}
          style={{ borderTop: 'none', padding: '8px 20px' }}
        >
          <Box display="flex" flexDirection="row" alignItems="center">
            <h3 style={{ margin: '0 5px 0 0' }}>
              {underlyingAssetSymbol} Calls
            </h3>
            <StyledTooltip
              disableTouchListener
              open={showCallsTooltip}
              onOpen={() => setShowCallsTooltip(true)}
              onClose={() => setShowCallsTooltip(false)}
              title={
                <Box px={1}>
                  <Box py={1}>
                    Call options allow the buyer to swap the quote asset (
                    {quoteAssetSymbol}) for the underlying asset (
                    {underlyingAssetSymbol}) at the given strike price, at any
                    time before the expiration.
                  </Box>
                  <Box py={1}>What this means for the buyer and seller:</Box>
                  <Box py={1}>
                    Buyer: Makes a profit when the price of the underlying asset
                    goes above the strike plus the price they paid for the call
                    option
                  </Box>
                  <Box py={1}>
                    Seller: Makes a profit as long as the price stays below the
                    strike plus the amount they sold the call option for
                  </Box>
                </Box>
              }
            >
              <IconButton
                color="inherit"
                onClick={() => setShowCallsTooltip(!showCallsTooltip)}
              >
                <InfoOutlined />
              </IconButton>
            </StyledTooltip>
          </Box>
        </THeadCell>
        <TCellStrike colSpan={1} align="center">
          <ColumnDisplaySelector
            showIV={showIV}
            showPriceChange={showPriceChange}
            showVolume={showVolume}
            showOI={showOI}
            showLastPrice={showLastPrice}
            setShowIV={setShowIV}
            setShowPriceChange={setShowPriceChange}
            setShowVolume={setShowVolume}
            setShowOI={setShowOI}
            setShowLastPrice={setShowLastPrice}
            currentColumnsCount={currentColumnsCount}
            setColumnsCount={setColumnsCount}
          />
        </TCellStrike>
        <THeadCell
          colSpan={Math.floor(currentColumnsCount / 2)}
          style={{ borderTop: 'none', padding: '8px 20px' }}
        >
          <Box display="flex" flexDirection="row" alignItems="center">
            <h3 style={{ margin: '0 5px 0 0' }}>
              {underlyingAssetSymbol} Puts
            </h3>
            <StyledTooltip
              disableTouchListener
              open={showPutsTooltip}
              onOpen={() => setShowPutsTooltip(true)}
              onClose={() => setShowPutsTooltip(false)}
              title={
                <Box px={1}>
                  <Box py={1}>
                    Put options allow the buyer to swap the underlying asset (
                    {underlyingAssetSymbol}) for the quote asset (
                    {quoteAssetSymbol}) at the given strike price, at any time
                    before the expiration.
                  </Box>
                  <Box py={1}>What this means for the buyer and seller:</Box>
                  <Box py={1}>
                    Buyer: Makes a profit when the price of the underlying asset
                    goes below the strike price minus the price they paid for
                    the put option
                  </Box>
                  <Box py={1}>
                    Seller: Makes a profit as long as the price stays above the
                    strike minus the amount they sold the put option for
                  </Box>
                </Box>
              }
            >
              <IconButton
                color="inherit"
                onClick={() => setShowPutsTooltip(!showPutsTooltip)}
              >
                <InfoOutlined />
              </IconButton>
            </StyledTooltip>
          </Box>
        </THeadCell>
      </TableRow>
      <TableRow>
        <THeadCell align="left" style={{ paddingLeft: '16px' }}>
          Action
        </THeadCell>

        {showIV && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>
                  {`Implied volatility is the market's forecast of a likely movement in an underlying asset's price. This uses the highest bid as the price when calculating implied volatility`}
                </Box>
              }
            >
              <Box display="inline">IVB</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        <THeadCell align="left" width={`${colWidth}%`}>
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The highest price willing to be paid for the call option on the order book`}</Box>
            }
          >
            <Box display="inline">Bid</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="left" width={`${colWidth}%`}>
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The lowest price to sell the call option on the order book`}</Box>
            }
          >
            <Box display="inline">Ask</Box>
          </StyledTooltip>
        </THeadCell>
        {showIV && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>
                  {`Implied volatility is the market's forecast of a likely movement in an underlying asset's price. This uses the lowest ask as the price when calculating implied volatility`}
                </Box>
              }
            >
              <Box display="inline">IVA</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showLastPrice && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={<Box p={1}>{`The price of the last matched order`}</Box>}
            >
              <Box display="inline">Last Price</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showPriceChange && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box
                  p={1}
                >{`Percentage of price change of the call option over the last 24 hours`}</Box>
              }
            >
              <Box display="inline">Change</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showVolume && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box
                  p={1}
                >{`Number of option contracts traded in the last 24 hours on the call option`}</Box>
              }
            >
              <Box display="inline">Volume</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showOI && (
          <THeadCell align="left" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>{`Number of circulating call option contracts`}</Box>
              }
            >
              <Box display="inline">Open</Box>
            </StyledTooltip>
          </THeadCell>
        )}

        <TCellStrike align="center">
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The price of the underlying asset (${underlyingAssetSymbol}) at which the option will be exercised`}</Box>
            }
          >
            <Box display="inline">Strike</Box>
          </StyledTooltip>
        </TCellStrike>

        {showIV && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>
                  {`Implied volatility is the market's forecast of a likely movement in an underlying asset's price. This uses the highest bid as the price when calculating implied volatility`}
                </Box>
              }
            >
              <Box display="inline">IVB</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        <THeadCell align="right" width={`${colWidth}%`}>
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The highest price willing to be paid for the put option on the order book`}</Box>
            }
          >
            <Box display="inline">Bid</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="right" width={`${colWidth}%`}>
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The lowest price to sell the put option on the order book book`}</Box>
            }
          >
            <Box display="inline">Ask</Box>
          </StyledTooltip>
        </THeadCell>
        {showIV && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>
                  {`Implied volatility is the market's forecast of a likely movement in an underlying asset's price. This uses the lowest ask as the price when calculating implied volatility`}
                </Box>
              }
            >
              <Box display="inline">IVA</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showLastPrice && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={<Box p={1}>{`The price of the last matched order`}</Box>}
            >
              <Box display="inline">Last Price</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showPriceChange && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box
                  p={1}
                >{`Percentage of price change of the put option over the last 24 hours`}</Box>
              }
            >
              <Box display="inline">Change</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showVolume && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box
                  p={1}
                >{`Number of option contracts traded in the last 24 hours on the put option`}</Box>
              }
            >
              <Box display="inline">Volume</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        {showOI && (
          <THeadCell align="right" width={`${colWidth}%`}>
            <StyledTooltip
              placement="top"
              title={
                <Box p={1}>{`Number of circulating put option contracts`}</Box>
              }
            >
              <Box display="inline">Open</Box>
            </StyledTooltip>
          </THeadCell>
        )}
        <THeadCell align="right" style={{ paddingRight: '16px' }}>
          Action
        </THeadCell>
      </TableRow>
    </TableHead>
  );
};
