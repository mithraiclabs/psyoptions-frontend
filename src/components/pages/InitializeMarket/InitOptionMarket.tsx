import React, { useMemo, useState } from 'react';
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
import { BigNumber } from 'bignumber.js';
import { BN } from 'bn.js';
import moment from 'moment';
import { useInitializeSerumMarket } from '../../../hooks/Serum/useInitializeSerumMarket';
import useAssetList from '../../../hooks/useAssetList';
import useConnection from '../../../hooks/useConnection';
import { useInitializeMarket } from '../../../hooks/useInitializeMarkets';
import useNotifications from '../../../hooks/useNotifications';
import { useOptionMarket } from '../../../hooks/useOptionMarket';
import useWallet from '../../../hooks/useWallet';
import { convertStrikeToAmountsPer } from '../../../utils/strikeConversions';
import ConnectButton from '../../ConnectButton';
import SelectAsset from '../../SelectAsset';
import { StyledTooltip } from '../Markets/styles';
import theme from '../../../utils/theme';
import { useInitializedMarkets } from '../../../hooks/LocalStorage';
import { useCheckIfMarketExists } from '../../../hooks/PsyOptionsAPI/useCheckIfMarketExists';

const darkBorder = `1px solid ${theme.palette.background.main}`;

export const InitOptionMarket: React.VFC = () => {
  const { pushNotification } = useNotifications();
  const { connected } = useWallet();
  const initializeMarkets = useInitializeMarket();
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

  const parsedBasePrice = parseFloat(
    basePrice && basePrice.replace(/^\./, '0.'),
  );
  let strikePrice: BigNumber;
  if (parsedBasePrice) {
    strikePrice = new BigNumber(parsedBasePrice);
  }

  const _amountPerContract = new BigNumber(size).multipliedBy(
    new BigNumber(10).pow(new BigNumber(uAsset?.decimals)),
  );
  let _quoteAmountPerContract;
  if (strikePrice) {
    _quoteAmountPerContract = convertStrikeToAmountsPer(
      strikePrice,
      _amountPerContract,
      uAsset,
      qAsset,
    );
  }
  const canInitialize = !!useOptionMarket({
    date: selectorDate.unix(),
    uAssetSymbol: uAsset?.tokenSymbol,
    qAssetSymbol: qAsset?.tokenSymbol,
    size,
    amountPerContract: _amountPerContract,
    quoteAmountPerContract: _quoteAmountPerContract,
  });

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

      // TODO check if option market already exists
      const exists = await checkIfMarketExists({
        expirationUnixTimestamp: expiration,
        quoteAmountPerContract: quoteAmountPerContractU64,
        quoteAssetMintKey: new PublicKey(qa.mintAddress),
        underlyingAmountPerContract: amountPerContractU64,
        underlyingAssetMintKey: new PublicKey(ua.mintAddress),
      });

      if (exists) {
        setLoading(false);
        return;
      }

      const initializedMarket = await initializeMarkets({
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

      const serumMarkets: Record<string, string> = {};
      if (initSerumMarket) {
        // TODO check if serum market already exists
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
          serumMarkets[initializedMarket.optionMarketKey.toString()] =
            serumMarketKey.toString();
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
                serumMarketAddress:
                  serumMarkets[initializedMarket.optionMarketKey.toString()],
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
              <FormControlLabel value="puts" control={<Radio />} label="Puts" />
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
        ) : canInitialize && assetsSelected && parametersValid ? (
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
            <Box py={1}>
              {assetsSelected && parametersValid
                ? `Market Already Exists`
                : 'Enter Valid Parameters to Initialize Market'}
            </Box>
          </Button>
        )}
      </Box>
    </Paper>
  );
};
