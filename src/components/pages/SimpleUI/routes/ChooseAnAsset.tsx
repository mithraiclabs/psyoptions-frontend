import React, { useState, useEffect, memo } from 'react'
import axios from 'axios'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import { useTheme } from '@material-ui/core/styles'
import useAssetList from '../../../../hooks/useAssetList'

const fetchPrice = async ({ uAssetSymbol, qAssetSymbol }) => {
  try {
    const resp = await axios.get(
      `https://serum-api.bonfida.com/orderbooks/${uAssetSymbol}${qAssetSymbol}`,
    )
    const highestBid = resp?.data?.data?.bids[0]?.price
    const lowestAsk = resp?.data?.data?.asks[0]?.price
    if (highestBid && lowestAsk) {
      return (highestBid + lowestAsk) / 2
    }
  } catch (err) {
    console.error(err)
  }
  return 0
}

const ChooseAnAsset = () => {
  const theme = useTheme()
  const { supportedAssets } = useAssetList()
  const [prices, setPrices] = useState({})
  const assetWhitelist = ['SOL', 'BTC', 'ETH']

  const assets = supportedAssets.filter((asset) =>
    assetWhitelist.includes(asset.tokenSymbol),
  )

  useEffect(() => {
    const fetchAllPrices = async () => {
      if (assets?.length && Object.keys(prices).length === 0) {
        const newPrices = {}
        await Promise.all(
          assets.map(async (asset) => {
            newPrices[asset.tokenSymbol] = await fetchPrice({
              uAssetSymbol: asset.tokenSymbol,
              qAssetSymbol: 'USDC',
            })
          }),
        )
        setPrices(newPrices as any)
      }
    }

    fetchAllPrices()
  }, [assets, prices])

  return (
    <Box width="100%" p={2}>
      {assets.map((asset) => {
        return (
          <Button
            fullWidth
            style={{
              margin: '8px 0',
              padding: '0',
              border: `1px solid`,
              borderImage: `linear-gradient(91.37deg, #42203B 0%, rgba(139, 234, 255, 0.5) 100%)`,
              borderRadius: '4px',
            }}
          >
            <Box
              width="100%"
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              p={1}
              color={theme?.palette?.primary?.light}
            >
              <Box display="flex" flexDirection="row" alignItems="center">
                <Box p={1}>
                  <Avatar
                    src={asset.icon}
                    alt={asset.tokenName}
                    style={{
                      backgroundColor: theme?.palette?.primary?.main,
                    }}
                  />
                </Box>
                <Box p={1}>{asset.tokenSymbol}</Box>
              </Box>
              <Box p={1}>
                {prices[asset.tokenSymbol] && `$${prices[asset.tokenSymbol]}`}
              </Box>
            </Box>
          </Button>
        )
      })}
    </Box>
  )
}

export default memo(ChooseAnAsset)
