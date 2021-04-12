import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { PublicKey } from '@solana/web3.js'

import Page from './Page'

import logo from '../../../assets/psyoptions-logo-light.png'
import theme from '../../utils/theme'
import useOptionsMarkets from '../../hooks/useOptionsMarkets'
import useOpenPositions from '../../hooks/useOpenPositions'
import WalletStatus from '../WalletStatus'
import useConnection from '../../hooks/useConnection'

const useStyles = makeStyles({
  logoH1: {
    margin: 0,
    textTransform: 'none',
    textShadow: 'none',
    background: `linear-gradient(269.9deg, ${theme.palette.warning.main} 0.1%, ${theme.palette.success.main} 50.52%, ${theme.palette.primary.main} 97.89%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: 'inherit',
  },
  landingCard: {
    borderRadius: '4px',
    border: `1px solid ${theme.palette.primary.main}`,
  },
})

const pageBg =
  'linear-gradient(0deg, rgba(66, 32, 59, 1) 0%, rgba(27, 26, 45, 1) 35%, rgba(16, 16, 23, 1) 70%)'

const LandingCard = ({ title = '', text = '', button = '' } = {}) => {
  const { landingCard } = useStyles()

  return (
    <Box
      px={2}
      pb={4}
      pt={1}
      m={1}
      width={['300px']}
      height={['266px']}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      className={landingCard}
    >
      <Box
        p={2}
        flexGrow={1}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <h1 style={{ margin: '0', fontSize: '60px' }}>{title}</h1>
        <Box style={{ fontSize: '22px' }} textAlign="center">
          {text || '0'}
        </Box>
      </Box>
      {button}
    </Box>
  )
}

const Landing = () => {
  const history = useHistory()
  const { connection } = useConnection()
  const { markets } = useOptionsMarkets()
  const positions = useOpenPositions()
  const { logoH1 } = useStyles()
  const { landingCard } = useStyles()

  const [numberOfTokens, setNumberOfTokens] = useState()

  const getNumberOfTokensMinted = async () => {
    if (!numberOfTokens ?? Object.keys(markets).length > 0) {
      const results = await Promise.allSettled(
        Object.values(markets).map(async (market) => {
          const result = await connection.getTokenSupply(
            new PublicKey(market.optionMintAddress),
          )
          return result.value
        }),
      )

      const tokenSupply = results
        .filter((res) => res.status !== 'rejected')
        .reduce((sum, res) => sum + (res.value?.uiAmount || 0), 0)

      if (tokenSupply > 0) {
        setNumberOfTokens(`${tokenSupply.toFixed(0)}`)
      }
    }
  }

  useEffect(() => {
    getNumberOfTokensMinted()
  }, [markets]) // eslint-disable-line

  return (
    <Page background={pageBg}>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={4}
      >
        <Box
          display="flex"
          flexDirection={['column', 'column', 'row']}
          alignItems="center"
          justifyContent="center"
          mt={2}
          p={3}
        >
          <img width="95px" height="95px" src={logo} alt="PsyOptions Logo" />
          <Box px={[1, 1, 3]} fontSize={['48px', '48px', '60px', '72px']}>
            <h1 className={logoH1}>PsyOptions</h1>
          </Box>
        </Box>
        <Box
          display="flex"
          flexDirection={['column', 'column', 'column', 'row']}
          alignItems="center"
          justifyContent="center"
          p={2}
        >
          <Box display="flex" flexDirection={['column', 'row', 'row']}>
            <LandingCard
              title={`${Object.keys(markets).length}`}
              text={`options market${
                Object.keys(markets).length === 1 ? '' : 's'
              } created`}
              button={
                <Button
                  color="primary"
                  variant="outlined"
                  style={{ whiteSpace: 'nowrap' }}
                  href="/markets"
                  onClick={(e) => {
                    e.preventDefault()
                    history.push('/markets')
                  }}
                >
                  View Markets
                </Button>
              }
            />
            <LandingCard
              title={numberOfTokens || '0'}
              text={`options contract${
                numberOfTokens === 1 ? '' : 's'
              } in circulation`}
              button={
                <Button
                  color="primary"
                  variant="outlined"
                  style={{ whiteSpace: 'nowrap' }}
                  href="/markets"
                  onClick={(e) => {
                    e.preventDefault()
                    history.push('/mint')
                  }}
                >
                  Mint Options
                </Button>
              }
            />
          </Box>
          <Box display="flex" flexDirection={['column', 'row', 'row']}>
            <LandingCard
              title={`${Object.keys(positions).length}`}
              text={`open position${
                Object.keys(positions).length === 1 ? '' : 's'
              } in wallet`}
              button={<WalletStatus />}
            />
            <Box
              px={2}
              pt={1}
              pb={4}
              m={1}
              width={['300px']}
              height={['266px']}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="space-between"
              className={landingCard}
            >
              <Box
                flexGrow={1}
                display="flex"
                flexDirection="column"
                justifyContent="center"
              >
                <h2
                  style={{
                    textTransform: 'none',
                    textAlign: 'center',
                    fontSize: '36px',
                  }}
                >
                  Learn PsyOptions
                </h2>
              </Box>
              <Button
                color="primary"
                variant="outlined"
                style={{ whiteSpace: 'nowrap' }}
                href="https://docs.psyoptions.io"
                target="_blank"
              >
                Read Docs
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Page>
  )
}

export default Landing
