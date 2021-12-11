import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import { deriveOptionKeyFromParams } from '@mithraic-labs/psy-american';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useAmericanPsyOptionsProgram } from '../../hooks/useAmericanPsyOptionsProgram';
import { useDecimalsForMint } from '../../hooks/useDecimalsForMint';
import useNotifications from '../../hooks/useNotifications';
import { OptionType } from '../../types';
import { getDateWithDefaultTime } from '../../utils/dates';
import theme from '../../utils/theme';
import { ExpirationInput } from '../Inputs/ExpirationInput';
import { SelectAssetOrEnterMint } from '../SelectAssetOrEnterMint';

const darkBorder = `1px solid ${theme.palette.background.main}`;

export const MintParamInput: React.VFC<{
  onUpdateDerivedAddress: (key: string) => void;
}> = ({ onUpdateDerivedAddress }) => {
  const program = useAmericanPsyOptionsProgram();
  const { pushErrorNotification } = useNotifications();
  const [expiration, setExpiration] = useState(getDateWithDefaultTime());
  const [underlyingMint, setUnderlyingMint] = useState<PublicKey | null>(null);
  const [quoteMint, setQuoteMint] = useState<PublicKey | null>(null);
  const underlyingDecimals = useDecimalsForMint(underlyingMint ?? '');
  const quoteDecimals = useDecimalsForMint(quoteMint ?? '');
  const [optionType, setOptionType] = useState(OptionType.CALL);
  const [size, setSize] = useState('');
  const [strike, setStrike] = useState('');
  const handleSelectedDateChange = (date: Date | null) => {
    setExpiration(getDateWithDefaultTime(date));
  };

  useEffect(() => {
    if (!program) {
      return;
    }
    if (underlyingMint && quoteMint && size && strike && expiration) {
      const expirationTimestamp = expiration.unix();
      const sizeBigNum = new BigNumber(size);
      const strikeBigNum = new BigNumber(strike);
      (async () => {
        try {
          let optionUnderlyingDecimals = underlyingDecimals;
          let optionQuoteDecimals = quoteDecimals;
          let underlyingAmountPerContract = sizeBigNum;
          let quoteAmountPerContract = strikeBigNum.multipliedBy(sizeBigNum);
          if (optionType === OptionType.PUT) {
            optionUnderlyingDecimals = quoteDecimals;
            optionQuoteDecimals = underlyingDecimals;
            underlyingAmountPerContract = strikeBigNum.multipliedBy(sizeBigNum);
            quoteAmountPerContract = sizeBigNum;
          }
          const underlyingAmountPerContractBN = new BN(
            underlyingAmountPerContract
              .multipliedBy(new BigNumber(10).pow(optionUnderlyingDecimals))
              .toString(),
          );
          const quoteAmountPerContractBN = new BN(
            quoteAmountPerContract
              .multipliedBy(new BigNumber(10).pow(optionQuoteDecimals))
              .toString(),
          );
          const [optionKey] = await deriveOptionKeyFromParams({
            programId: program.programId,
            underlyingMint,
            quoteMint,
            underlyingAmountPerContract: underlyingAmountPerContractBN,
            quoteAmountPerContract: quoteAmountPerContractBN,
            expirationUnixTimestamp: new BN(expirationTimestamp),
          });
          onUpdateDerivedAddress(optionKey.toString());
        } catch (err) {
          pushErrorNotification(err);
        }
      })();
    }
    // when all inputs are there, derive the option mint address
  }, [
    expiration,
    onUpdateDerivedAddress,
    optionType,
    program,
    pushErrorNotification,
    quoteDecimals,
    quoteMint,
    size,
    strike,
    underlyingDecimals,
    underlyingMint,
  ]);

  return (
    <Box borderTop={darkBorder}>
      <Box mx={2} mt={2}>
        (Optional) enter the parameters to derive the option address.
      </Box>
      <ExpirationInput onChange={handleSelectedDateChange} value={expiration} />
      <Box display="flex" justifyContent="center">
        <FormControl component="fieldset">
          <RadioGroup
            value={optionType}
            onChange={(e) => setOptionType(e.target.value as OptionType)}
            row
          >
            <FormControlLabel
              value={OptionType.CALL}
              control={<Radio />}
              label="Call"
            />
            <FormControlLabel
              value={OptionType.PUT}
              control={<Radio />}
              label="Put"
            />
          </RadioGroup>
        </FormControl>
      </Box>
      <Box display="flex" borderBottom={darkBorder} borderTop={darkBorder}>
        <Box width="50%" p={2} borderRight={darkBorder}>
          Underlying Asset:
          <Box mt={2}>
            <SelectAssetOrEnterMint
              mint={underlyingMint}
              onSelectAsset={setUnderlyingMint}
            />
          </Box>
        </Box>
        <Box width="50%" p={2}>
          Quote Asset:
          <Box mt={2}>
            <SelectAssetOrEnterMint
              mint={quoteMint}
              onSelectAsset={setQuoteMint}
            />
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
            helperText={
              size && Number.isNaN(parseFloat(size)) ? 'Must be a number' : null
            }
          />
        </Box>
        <Box width="50%" p={2}>
          <Box pb={2}>
            <TextField
              value={strike}
              label="Strike Price"
              variant="filled"
              onChange={(e) => setStrike(e.target.value)}
              helperText={
                strike && Number.isNaN(parseFloat(strike))
                  ? 'Must be a number'
                  : null
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
