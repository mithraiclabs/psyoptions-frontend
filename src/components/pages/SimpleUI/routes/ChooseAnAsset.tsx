import React, { memo, useCallback, useState } from 'react'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import { useTheme } from '@material-ui/core/styles'
import useAssetList from '../../../../hooks/useAssetList'
import { useBonfidaMarkPrice } from '../../../../hooks/useBonfidaMarkPrice'
import { useUpdateForm } from '../../../../context/SimpleUIContext'

const ChooseAssetButton = ({
  tokenSymbol,
  icon,
  tokenName,
  selected,
  onClick,
}) => {
  const theme = useTheme()

  const price = useBonfidaMarkPrice({
    uAssetSymbol: tokenSymbol,
    qAssetSymbol: 'USDC',
  })

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
        <Box display="flex" flexDirection="row" alignItems="center">
          <Box px={1}>
            <Avatar
              src={icon}
              alt={tokenName}
              style={{
                backgroundColor: 'transparent',
                width: '24px',
                height: '24px',
              }}
            >
              {tokenSymbol}
            </Avatar>
          </Box>
          <Box p={1}>{tokenSymbol}</Box>
        </Box>
        <Box p={1}>{(price && price > 0 && `$${price.toFixed(2)}`) || ''}</Box>
      </Box>
    </Button>
  )
}

const ChooseAnAsset = () => {
  const updateForm = useUpdateForm()
  const history = useHistory()
  const { supportedAssets } = useAssetList()
  const assetWhitelist = ['SOL', 'BTC', 'ETH']
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState('')

  const assets = supportedAssets.filter((asset) =>
    assetWhitelist.includes(asset.tokenSymbol),
  )

  const handleMakeSelection = ({ tokenSymbol }) => {
    if (!selectedTokenSymbol) {
      setSelectedTokenSymbol(tokenSymbol)
      updateForm('tokenSymbol', tokenSymbol)

      // TODO: animated transition between pages instead of a timeout
      setTimeout(() => {
        history.push('/simple/up-or-down')
      }, 500)
    }
  }

  return (
    <Box width="100%" px={2} py={1}>
      {assets.map((asset) => (
        <Box my={2} key={asset.tokenSymbol}>
          <ChooseAssetButton
            tokenSymbol={asset.tokenSymbol}
            icon={asset.icon}
            tokenName={asset.tokenName}
            selected={selectedTokenSymbol === asset.tokenSymbol}
            onClick={() => handleMakeSelection(asset)}
          />
        </Box>
      ))}
    </Box>
  )
}

export default memo(ChooseAnAsset)
