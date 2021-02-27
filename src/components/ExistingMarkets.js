import React, { useState } from 'react'
import { Box, Paper, Button, Chip } from '@material-ui/core'
import Done from '@material-ui/icons/Done'
import { AddBoxRounded } from '@material-ui/icons'
import theme from '../utils/theme'
import useOptionsMarkets from '../hooks/useOptionsMarkets'
import Select from './Select'

const darkBorder = `1px solid ${theme.palette.background.main}`

const ExistingMarkets = ({ date }) => {
  const { markets } = useOptionsMarkets()

  const pairKeys = Object.keys(markets[date] || {})
  const [selectedPairKey, setSelectedPairKey] = useState(pairKeys[0] || '')
  const pairData = markets[date]?.[selectedPairKey] || {}
  const sizeKeys = Object.keys(pairData?.sizes || {})
  const pairSizeData = pairData?.sizes || {}

  return (
    <Box>
      <Box p={3}>
        <h2 style={{ margin: 0 }}>Existing Markets</h2>
      </Box>
      <Box p={3} pt={0}>
        <Select
          label="Asset Pair"
          value={selectedPairKey}
          onChange={(e) => setSelectedPairKey(e.target.value)}
          disabled={pairKeys.length === 0}
          options={pairKeys}
          style={{
            width: '200px',
          }}
        />
      </Box>
      <Box>
        {/* {sizeKeys.map((sk) => {
          const prices = Object.keys(pairSizeData[sk])
          console.log(prices)
          return prices.map((price) => (
            <Box px={3} py={1}>
              Assets: {selectedPairKey} - size: {sk} - strike price: {price}
            </Box>
          ))
        })} */}
      </Box>
    </Box>
  )
}

export default ExistingMarkets
