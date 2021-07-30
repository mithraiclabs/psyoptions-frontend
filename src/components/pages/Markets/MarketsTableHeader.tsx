import React from 'react'
import Box from '@material-ui/core/Box'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { ColumnDisplaySelector } from './ColumnDisplaySelector'

import { THeadCell, TCellStrike, StyledTooltip } from './styles'

export const MarketsTableHeader: React.FC<{
  uAssetSymbol: string
  qAssetSymbol: string
  showIV: boolean
  showPriceChange: boolean
  showVolume: boolean
  showOI: boolean
  setShowIV: (bool: boolean) => void
  setShowPriceChange: (bool: boolean) => void
  setShowVolume: (bool: boolean) => void
  setShowOI: (bool: boolean) => void
  currentColumnsCount: number
  setColumnsCount: (num: number) => void
}> = React.memo(({ 
  uAssetSymbol,
  qAssetSymbol,
  showIV,
  showPriceChange,
  showVolume,
  showOI,
  setShowIV,
  setShowPriceChange,
  setShowVolume,
  setShowOI,
  currentColumnsCount,
  setColumnsCount,
 }) => {
  const colWidth = (1 / currentColumnsCount) * 100

  return (
    <TableHead>
      <TableRow>
        <THeadCell
          colSpan={Math.floor(currentColumnsCount / 2)}
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
        <TCellStrike 
          colSpan={1}
          align='center'
        >
          <ColumnDisplaySelector 
            showIV={showIV}
            showPriceChange={showPriceChange}
            showVolume={showVolume}
            showOI={showOI}
            setShowIV={setShowIV}
            setShowPriceChange={setShowPriceChange}
            setShowVolume={setShowVolume}
            setShowOI={setShowOI}
            currentColumnsCount={currentColumnsCount}
            setColumnsCount={setColumnsCount}
          />
        </TCellStrike>
        <THeadCell
          colSpan={Math.floor(currentColumnsCount / 2)}
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

        {
          showIV && (
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
          )
        }
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
        {
          showIV && (
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
          )
        }
        {
          showPriceChange && (
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
          )
        }
        {
          showVolume && (
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
          )
        }
        {
          showOI && (
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
          )
        }

        <TCellStrike align="center">
          <StyledTooltip
            placement="top"
            title={
              <Box
                p={1}
              >{`The price of the underlying asset (${uAssetSymbol}) at which the option will be exercised`}</Box>
            }
          >
            <Box display="inline">Strike</Box>
          </StyledTooltip>
        </TCellStrike>

        {
          showIV && (
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
          )
        }
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
        {
          showIV && (
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
          )
        }
        {
          showPriceChange && (
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
          )
        }
        {
          showVolume && (
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
          )
        }
        {
          showOI && (
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
          )
        }
        <THeadCell align="right" style={{ paddingRight: '16px' }}>
          Action
        </THeadCell>
      </TableRow>
    </TableHead>
  )
})
