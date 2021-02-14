import { Box, Paper, Button, Chip, Avatar } from '@material-ui/core'
import React from 'react'
import theme from '../../utils/theme'
import Page from './Page'
import useWallet from '../../hooks/useWallet'
import Done from '@material-ui/icons/Done'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'

const darkBorder = `1px solid ${theme.palette.background.main}`

const Mint = () => {
  const { connect, connected, loading } = useWallet()

  // TBD: Should we store these user input in the component state?
  // Probably, because we aren't really using these anywhere else
  const {
    uAsset = '', // SPL token account address
    qAsset = '', // SPL token account address
    strikePrice = 123, // Int
    size = 100, // Int
  } = {}

  // TODO: check if connected wallet has enough of uAsset
  // TODO: set canMint to true if all conditions are met (selected all assets, has UA funds, etc)
  const canMint = false

  // TODO: set disabled message depending on status (didn't fill out form, not enough uAsset, etc.)
  const disabledMessage = 'Select Assets To Mint'

  const handleMint = () => {
    // TODO: make "useTransactionInstructions" hook that sends out transactions here
    // Then call the mint one here
  }

  return (
    <Page>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        height="100%"
        minHeight="500px"
        pb={4}
      >
        {/* <h2 mt={0}>Mint Contract</h2> */}
        <Paper
          style={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Box>
            <Box p={2} textAlign="center">
              <h2 style={{ margin: '10px 0 0' }}>Contract Settings</h2>
            </Box>
            <Box p={2} borderBottom={darkBorder}>
              Expires On:
              <Box display="flex" flexWrap="wrap">
                {/* TODO: make this a separate component and makes dates a mapped array */}
                <Chip
                  clickable
                  size="small"
                  label="Mar 1 2021"
                  color="primary"
                  onDelete={() => {}}
                  deleteIcon={<Done />}
                  style={{
                    marginTop: theme.spacing(2),
                    marginRight: theme.spacing(2),
                  }}
                />
                <Chip
                  clickable
                  size="small"
                  color="primary"
                  variant="outlined"
                  label="Mar 7 2021"
                  style={{
                    marginTop: theme.spacing(2),
                    marginRight: theme.spacing(2),
                  }}
                />
                <Chip
                  clickable
                  size="small"
                  color="primary"
                  variant="outlined"
                  label="Mar 14 2021"
                  style={{
                    marginTop: theme.spacing(2),
                    marginRight: theme.spacing(2),
                  }}
                />
              </Box>
            </Box>
            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                Underlying Asset:
                <Box mt={2}>
                  {/* TODO: Move to separate "asset selector" component */}
                  <Chip
                    label="Choose Asset"
                    clickable
                    color="primary"
                    variant="outlined"
                    avatar={
                      uAsset ? (
                        <Avatar
                          src="uasset-icon.png"
                          alt="Uasset-name"
                          style={{
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                      ) : null
                    }
                    onClick={() => {}}
                    onDelete={() => {}}
                    deleteIcon={<KeyboardArrowDown />}
                  />
                </Box>
              </Box>
              <Box width={'50%'} p={2}>
                Size: 100 (UA symbol)
              </Box>
            </Box>
            <Box display="flex" borderBottom={darkBorder}>
              <Box width={'50%'} p={2}>
                Quote Asset:
                <Box mt={2}>
                  {/* TODO: Move to separate "asset selector" component */}
                  <Chip
                    label="Choose Asset"
                    clickable
                    color="primary"
                    variant="outlined"
                    avatar={
                      qAsset ? (
                        <Avatar
                          src="qasset-icon.png"
                          alt="qasset-name"
                          style={{
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                      ) : null
                    }
                    onClick={() => {}}
                    onDelete={() => {}}
                    deleteIcon={<KeyboardArrowDown />}
                  />
                </Box>
              </Box>
              <Box width={'50%'} p={2} borderRight={darkBorder}>
                Strike Price: TBD how to populate this
              </Box>
            </Box>
            <Box p={2}>
              {!connected && (
                <Button
                  fullWidth
                  variant={'outlined'}
                  color="primary"
                  onClick={connect}
                >
                  <Box py={1}>Connect Wallet To Mint</Box>
                </Button>
              )}
              {connected && (
                <Button
                  fullWidth
                  variant={'outlined'}
                  color="primary"
                  disabled={!canMint}
                  onClick={canMint ? handleMint : null}
                >
                  <Box py={1}>Mint (100 SOL @ 10.52 USD/SOL)</Box>
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Page>
  )
}

export default Mint
