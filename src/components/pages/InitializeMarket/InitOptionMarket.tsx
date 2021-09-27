import React, { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import DateFnsUtils from '@date-io/date-fns';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import { KeyboardDatePicker } from '@material-ui/pickers/DatePicker';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import MuiPickersUtilsProvider from '@material-ui/pickers/MuiPickersUtilsProvider';
import Radio from '@material-ui/core/Radio';
import { OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { BigNumber } from 'bignumber.js';
import { BN } from 'bn.js';
import moment from 'moment';
import { useInitializeSerumMarket } from '../../../hooks/Serum/useInitializeSerumMarket';
import useAssetList from '../../../hooks/useAssetList';
import useConnection from '../../../hooks/useConnection';
import { useInitializeMarket } from '../../../hooks/useInitializeMarket';
import useNotifications from '../../../hooks/useNotifications';
import useWallet from '../../../hooks/useWallet';
import ConnectButton from '../../ConnectButton';
import SelectAsset from '../../SelectAsset';
import { StyledTooltip } from '../Markets/styles';
import theme from '../../../utils/theme';
import { useInitializedMarkets } from '../../../context/LocalStorage';
import { useCheckIfMarketExists } from '../../../hooks/PsyOptionsAPI/useCheckIfMarketExists';
import { MarketExistsDialog } from './MarketExistsDialog';

const darkBorder = `1px solid ${theme.palette.background.main}`;

export const InitOptionMarket: React.VFC = () => {
  const { pushNotification } = useNotifications();
  const { connected } = useWallet();
  const initializeMarket = useInitializeMarket();
  const { dexProgramId, endpoint } = useConnection();
  const initializeSerumMarket = useInitializeSerumMarket();
  const [basePrice, setBasePrice] = useState('0');
  const [selectorDate, setSelectorDate] = useState(moment.utc().endOf('day'));
  const { uAsset, qAsset, setUAsset } = useAssetList();
  const [initSerumMarket, setInitSerumMarket] = useState(false);
  const [size, setSize] = useState('1');
  const [loading, setLoading] = useState(false);
  const [callOrPut, setCallOrPut] = useState<'calls' | 'puts'>('calls');
  const [, setInitializedMarketMeta] = useInitializedMarkets();
  const checkIfMarketExists = useCheckIfMarketExists();
  const [existingMarket, setExistingMarket] =
    useState<OptionMarketWithKey | null>(null);

  const dismissExistingMarketDialog = useCallback(
    () => setExistingMarket(null),
    [],
  );

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  );
  let strikePrice: BigNumber;
  if (parsedBasePrice) {
    strikePrice = new BigNumber(parsedBasePrice);
  }

  const assetsSelected = uAsset && qAsset;
  const parametersValid = size && !Number.isNaN(size) && !!strikePrice;

  const handleChangeBasePrice = (e) => {
    const input = e.target.value || '';
    setBasePrice(input);
  };

  const handleSelectedDateChange = (date: Date | null) => {
    setSelectorDate(moment.utc(date).endOf('day'));
  };

  const handleChangeCallPut = (e) => {
    setCallOrPut(e.target.value);
  };

  const handleInitialize = async () => {
    try {
      setLoading(true);
      const expiration = selectorDate.unix();
      const ua = callOrPut === 'calls' ? uAsset : qAsset;
      const qa = callOrPut === 'calls' ? qAsset : uAsset;

      let amountsPerContract: BigNumber;
      let quoteAmountPerContract: BigNumber;

      if (callOrPut === 'calls') {
        amountsPerContract = new BigNumber(size);
        quoteAmountPerContract = strikePrice.multipliedBy(size);
      } else {
        amountsPerContract = strikePrice.multipliedBy(size);
        quoteAmountPerContract = new BigNumber(size);
      }

      const amountPerContractU64 = amountsPerContract
        .multipliedBy(new BigNumber(10).pow(ua.decimals))
        .toNumber();
      const quoteAmountPerContractU64 = quoteAmountPerContract
        .multipliedBy(new BigNumber(10).pow(qa.decimals))
        .toNumber();

      const _existingMarket = await checkIfMarketExists({
        expirationUnixTimestamp: new BN(expiration),
        quoteAmountPerContract: new BN(quoteAmountPerContractU64),
        quoteAssetMintKey: new PublicKey(qa.mintAddress),
        underlyingAmountPerContract: new BN(amountPerContractU64),
        underlyingAssetMintKey: new PublicKey(ua.mintAddress),
      });

      if (_existingMarket) {
        setExistingMarket(_existingMarket);
        setLoading(false);
        return;
      }

      const initializedMarket = await initializeMarket({
        amountPerContract: amountsPerContract,
        quoteAmountPerContract,
        uAssetSymbol: ua.tokenSymbol,
        qAssetSymbol: qa.tokenSymbol,
        uAssetMint: ua.mintAddress,
        qAssetMint: qa.mintAddress,
        uAssetDecimals: ua.decimals,
        qAssetDecimals: qa.decimals,
        expiration,
      });

      if (!initializedMarket) {
        // user cancelled transaction
        setLoading(false);
        return;
      }

      let serumMarketAddress: string;
      if (initSerumMarket) {
        let tickSize = 0.0001;
        if (
          (callOrPut === 'calls' && qa.tokenSymbol.match(/^USD/)) ||
          (callOrPut === 'puts' && ua.tokenSymbol.match(/^USD/))
        ) {
          tickSize = 0.01;
        }

        // This will likely be USDC or USDT but could be other things in some cases
        const quoteLotSize = new BN(
          tickSize * 10 ** (callOrPut === 'calls' ? qa.decimals : ua.decimals),
        );

        const initSerumResp = await initializeSerumMarket({
          optionMarketKey: initializedMarket.pubkey,
          baseMintKey: initializedMarket.optionMintKey,
          // This needs to be the USDC, so flip the quote asset vs underlying asset
          quoteMintKey:
            callOrPut === 'calls'
              ? initializedMarket.quoteAssetMintKey
              : initializedMarket.underlyingAssetMintKey,
          quoteLotSize,
        });
        if (initSerumResp) {
          const [serumMarketKey] = initSerumResp;
          serumMarketAddress = serumMarketKey.toString();
        }
      }

      setLoading(false);
      setInitializedMarketMeta((prevMarketsMetaArr) => {
        const marketsMeta = {
          expiration: initializedMarket.expiration,
          optionMarketAddress: initializedMarket.optionMarketKey.toString(),
          optionContractMintAddress: initializedMarket.optionMintKey.toString(),
          optionWriterTokenMintAddress:
            initializedMarket.writerTokenMintKey.toString(),
          quoteAssetMint: initializedMarket.quoteAssetMintKey.toString(),
          quoteAssetPoolAddress: initializedMarket.quoteAssetPoolKey.toString(),
          underlyingAssetMint:
            initializedMarket.underlyingAssetMintKey.toString(),
          underlyingAssetPoolAddress:
            initializedMarket.underlyingAssetPoolKey.toString(),
          underlyingAssetPerContract: initializedMarket.amountPerContract
            .multipliedBy(new BigNumber(10).pow(ua.decimals))
            .toString(),
          quoteAssetPerContract: initializedMarket.quoteAmountPerContract
            .multipliedBy(new BigNumber(10).pow(qa.decimals))
            .toString(),
          ...(initSerumMarket
            ? {
                serumMarketAddress,
                serumProgramId: dexProgramId.toString(),
              }
            : {}),
          psyOptionsProgramId: endpoint.programId,
        };
        return [...prevMarketsMetaArr, marketsMeta];
      });
    } catch (err) {
      setLoading(false);
      // TODO: display some meaningful error state to user
      console.error(err);
      pushNotification({
        severity: 'error',
        message: `${err}`,
      });
    }
  };

  return (
    <>
      <Paper
        style={{
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <Box p={2} textAlign="center">
          <h2 style={{ margin: '10px 0 0' }}>Initialize New Market</h2>
        </Box>

        <Box p={2} borderBottom={darkBorder} display="flex" alignItems="center">
          Expires On:
          <Box
            display="flex"
            flexWrap="wrap"
            flexDirection="row"
            alignItems="center"
          >
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDatePicker
                autoOk
                disablePast
                variant="inline"
                format="MM/dd/yyyy"
                inputVariant="filled"
                id="date-picker-inline"
                label="MM/DD/YYYY"
                value={selectorDate}
                onChange={handleSelectedDateChange}
                KeyboardButtonProps={{
                  'aria-label': 'change date',
                }}
                style={{ marginLeft: theme.spacing(4) }}
              />
            </MuiPickersUtilsProvider>
            <StyledTooltip
              title={
                <Box p={1}>
                  All expirations occur at 23:59:59 UTC on any selected date.
                </Box>
              }
            >
              <Box p={2}>
                <HelpOutlineIcon />
              </Box>
            </StyledTooltip>
          </Box>
        </Box>

        <Box display="flex" borderBottom={darkBorder}>
          <Box width="50%" p={2} borderRight={darkBorder}>
            Underlying Asset:
            <Box mt={2}>
              <SelectAsset
                selectedAsset={uAsset}
                onSelectAsset={(asset) => {
                  setUAsset(asset);
                }}
              />
            </Box>
          </Box>

          <Box width="50%" p={2}>
            Quote Asset:
            <Box mt={2}>
              <SelectAsset selectedAsset={qAsset} disabled />
            </Box>
          </Box>
        </Box>

        <Box display="flex" borderBottom={darkBorder}>
          <Box width="50%" p={2} borderRight={darkBorder}>
            <TextField
              value={size}
              label="Contract Size"
              variant="filled"
              onChange={(e) => setSize(e.target.value)}
              helperText={Number.isNaN(size) ? 'Must be a number' : null}
            />
          </Box>
          <Box width="50%" p={2}>
            <Box pb={2}>
              <TextField
                value={basePrice}
                label="Strike Price"
                variant="filled"
                onChange={handleChangeBasePrice}
                helperText={
                  Number.isNaN(parsedBasePrice) ? 'Must be a number' : null
                }
              />
            </Box>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" borderBottom={darkBorder}>
          <Box width="50%" p={2}>
            <FormControl component="fieldset">
              <RadioGroup value={callOrPut} onChange={handleChangeCallPut} row>
                <FormControlLabel
                  value="calls"
                  control={<Radio />}
                  label="Calls"
                />
                <FormControlLabel
                  value="puts"
                  control={<Radio />}
                  label="Puts"
                />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box width="50%" p={2}>
            {callOrPut === 'calls'
              ? 'Initialize calls for market'
              : 'Initialize puts for market'}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" borderBottom={darkBorder}>
          <Box width="50%" p={2}>
            Initalize Serum Market
          </Box>
          <Box width="50%" p={2}>
            <FormControl component="fieldset">
              <Checkbox
                color="primary"
                checked={initSerumMarket}
                onChange={(e) => setInitSerumMarket(e.target.checked)}
              />
            </FormControl>
          </Box>
        </Box>

        <Box p={2}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={1}>
              <CircularProgress />
            </Box>
          ) : assetsSelected && parametersValid ? (
            <>
              {!connected ? (
                <ConnectButton fullWidth>
                  <Box py={1}>Connect Wallet To Initialize</Box>
                </ConnectButton>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={handleInitialize}
                >
                  <Box py={1}>Initialize Market</Box>
                </Button>
              )}
            </>
          ) : (
            <Button fullWidth variant="outlined" color="primary" disabled>
              <Box py={1}>Enter Valid Parameters to Initialize Market</Box>
            </Button>
          )}
        </Box>
      </Paper>
      <MarketExistsDialog
        dismiss={dismissExistingMarketDialog}
        optionMarket={existingMarket}
      />
    </>
  );
};
