import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import {
  getOptionByKey,
  OptionMarketWithKey,
} from '@mithraic-labs/psy-american';
import Button from '@material-ui/core/Button';
import { PublicKey } from '@solana/web3.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useAmericanPsyOptionsProgram } from '../../hooks/useAmericanPsyOptionsProgram';
import Page from '../../components/pages/Page';
import { PlusMinusIntegerInput } from '../../components/PlusMinusIntegerInput';
import { useConnectedWallet } from "@saberhq/use-solana";
import GokiButton from '../../components/GokiButton';
import theme from '../../utils/theme';
import { useMintOptions } from '../../hooks/PsyOptionsAPI/useMintOptions';
import { MintInfo } from '../../components/Mint/MintInfo';
import { MintParamInput } from '../../components/Mint/MintParamInput';

/**
 * Page to allow users to mint options that have been initialized.
 *
 * TODO allow user to input parameters instead of option key
 */
const Mint: React.VFC = () => {
  const program = useAmericanPsyOptionsProgram();
  const wallet = useConnectedWallet();
  const mintOptions = useMintOptions();
  const [optionMarketAddress, setOptionMarketAddress] = useState('');
  const [quantity, setQuantity] = useState<number | null>(1);
  const [option, setOption] = useState<OptionMarketWithKey | null>(null);
  const [validKey, setValidKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const validInput = !!(option && quantity);
  const onTextChange = useCallback((e) => {
    setOptionMarketAddress(e.target.value);
    setOption(null);
  }, []);
  const handleMint = useCallback(async () => {
    if (!option || !quantity) {
      return;
    }
    setLoading(true);
    await mintOptions(option, quantity);
    setLoading(false);
  }, [mintOptions, option, quantity]);

  useEffect(() => {
    if (!program || !optionMarketAddress) {
      return;
    }
    let key: PublicKey | null = null;
    try {
      key = new PublicKey(optionMarketAddress);
    } catch (err) {
      setValidKey(false);
      console.log(err);
      return;
    }
    setValidKey(true);
    (async () => {
      const _option = await getOptionByKey(program, key);
      setOption(_option);
    })();
  }, [optionMarketAddress, program]);

  return (
    <Page>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={[0, 0, 4]}
      >
        <Paper
          style={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Box pb={2} display="flex" flexDirection="column">
            <Box p={2} textAlign="center">
              <h2 style={{ margin: '10px 0 0' }}>Mint Options</h2>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              mb={2}
              mx={2}
            >
              <Box mb={1}>
                Enter the public key for the option or enter the params below to
                derive the address.
              </Box>
              <TextField
                label="Option public key (optionMarketKey)"
                variant="filled"
                onChange={onTextChange}
                value={optionMarketAddress}
                style={{
                  width: '100%',
                }}
              />
              {!validKey && optionMarketAddress && (
                <span style={{ color: theme.palette.error.main }}>
                  Invalid address
                </span>
              )}
            </Box>
            <MintParamInput onUpdateDerivedAddress={setOptionMarketAddress} />
            <Box m={2}>
              Quantity
              <PlusMinusIntegerInput
                min={1}
                onChange={setQuantity}
                value={quantity}
              />
            </Box>
            <Box m={2}>
              <MintInfo option={option} size={quantity} />
            </Box>
            <Box mt={3} mx={2} zIndex={1} alignSelf="center">
              {loading ? (
                <Box display="flex" justifyContent="center" p={1}>
                  <CircularProgress />
                </Box>
              ) : !wallet?.connected ? (
                <GokiButton />
              ) : validInput ? (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={handleMint}
                >
                  <Box py={1}>Mint</Box>
                </Button>
              ) : (
                <Button fullWidth variant="outlined" color="primary" disabled>
                  <Box py={1}>
                    Must input valid Option key and quantity to mint
                  </Box>
                </Button>
              )}
            </Box>
            {validKey && optionMarketAddress && !option && (
              <Box mx={2}>
                <span style={{ color: theme.palette.error.main }}>
                  No Option found at the entered address
                </span>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Page>
  );
};

export default Mint;
