import React from 'react'
import Box from '@material-ui/core/Box'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import { THeadCell, TCellStrike, StyledTooltip } from './styles'

export const MarketsTableHeader: React.FC<{
  uAssetSymbol: string
  qAssetSymbol: string
}> = React.memo(({ uAssetSymbol, qAssetSymbol }) => {
  return (
    <TableHead>
      <TableRow>
        <THeadCell
          colSpan={8}
          style={{ borderTop: 'none', padding: '16px 20px' }}
        >
          <h3 style={{ margin: 0 }}>
            <StyledTooltip
              title={
                <Box px={1}>
                  <Box py={1}>
                    Call options allow the buyer to swap the quote asset (
                    {qAssetSymbol}) for the underlying asset ({uAssetSymbol}) at
                    the given strike price, at any time before the expiration.
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
              <Box display="inline">{uAssetSymbol} Calls</Box>
            </StyledTooltip>
          </h3>
        </THeadCell>
        <TCellStrike colSpan={1} />
        <THeadCell
          colSpan={8}
          style={{ borderTop: 'none', padding: '16px 20px' }}
        >
          <h3 style={{ margin: 0 }}>
            <StyledTooltip
              title={
                <Box px={1}>
                  <Box py={1}>
                    Put options allow the buyer to swap the underlying asset (
                    {uAssetSymbol}) for the quote asset ({qAssetSymbol}) at the
                    given strike price, at any time before the expiration.
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
              <Box display="inline">{uAssetSymbol} Puts</Box>
            </StyledTooltip>
          </h3>
        </THeadCell>
      </TableRow>
      <TableRow>
        <THeadCell align="left" style={{ paddingLeft: '16px' }}>
          Action
        </THeadCell>

        <THeadCell align="left" width={'70px'}>
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>
                <Box pb={1}>Implied volatility of the bid price.</Box>
                <Box>
                  {`Implied volatility is the market's forecast of a likely
                  movement in an underlying asset's price`}
                </Box>
              </Box>
            }
          >
            <Box display="inline">IV</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="left" width={'90px'}>
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
        <THeadCell align="left" width={'90px'}>
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The lowest price to sell the call option on the order book book`}</Box>
            }
          >
            <Box display="inline">Ask</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="left" width={'70px'}>
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>
                <Box pb={1}>Implied volatility of the ask price</Box>
                <Box>
                  {`Implied volatility is the market's forecast of a likely
                  movement in an underlying asset's price`}
                </Box>
              </Box>
            }
          >
            <Box display="inline">IV</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="left">
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
        <THeadCell align="left">
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
        <THeadCell align="left">
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>{`Number of circulating call option contracts`}</Box>
            }
          >
            <Box display="inline">Open</Box>
          </StyledTooltip>
        </THeadCell>

        <TCellStrike align="center">
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The price of the underlying asset (${uAssetSymbol}) at which the option can be exercised`}</Box>
            }
          >
            <Box display="inline">Strike</Box>
          </StyledTooltip>
        </TCellStrike>

        <THeadCell align="right" width={'70px'}>
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>
                <Box pb={1}>Implied volatility of the bid price.</Box>
                <Box>
                  {`Implied volatility is the market's forecast of a likely
                  movement in an underlying asset's price`}
                </Box>
              </Box>
            }
          >
            <Box display="inline">IV</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="right" width={'90px'}>
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
        <THeadCell align="right" width={'90px'}>
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
        <THeadCell align="right" width={'70px'}>
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>
                <Box pb={1}>Implied volatility of the ask price.</Box>
                <Box>
                  {`Implied volatility is the market's forecast of a likely
                  movement in an underlying asset's price`}
                </Box>
              </Box>
            }
          >
            <Box display="inline">IV</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="right">
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
        <THeadCell align="right">
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
        <THeadCell align="right">
          <StyledTooltip
            placement="top"
            title={
              <Box p={1}>{`Number of circulating put option contracts`}</Box>
            }
          >
            <Box display="inline">Open</Box>
          </StyledTooltip>
        </THeadCell>
        <THeadCell align="right" style={{ paddingRight: '16px' }}>
          Action
        </THeadCell>
      </TableRow>
    </TableHead>
  )
})
