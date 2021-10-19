/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { OptionMarket } from '@mithraic-labs/psy-american';
import { BN, ProgramAccount } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import _uniqby from 'lodash.uniqby';
import {
  atom,
  atomFamily,
  selector,
  useRecoilTransaction_UNSTABLE,
} from 'recoil';
import { getOptionsByMarketsPageParamsKey } from './utils';

/**
 * Store each option by PublicKey string.
 */
export const optionsMap = atomFamily<OptionMarket | null, string>({
  key: 'optionsMap',
  default: null,
});

// necessary to keep track of all options stored in state
export const optionsIds = atom<string[]>({
  key: 'optionsIds',
  default: [],
});

// TODO default based on future options
export const underlyingMint = atom<PublicKey>({
  key: 'underlyingMint',
  default: PublicKey.default,
});

// TODO default to USDC
export const quoteMint = atom<PublicKey>({
  key: 'quoteMint',
  default: PublicKey.default,
});

export const expirationUnixTimestamp = atom<BN>({
  key: 'expirationUnixTimestamp',
  default: new BN(0),
});

export const selectExpirationAsDate = selector({
  key: 'selectExpirationAsDate',
  get: ({ get }) => {
    const expiration = get(expirationUnixTimestamp);
    const date = new Date(expiration.toNumber() * 1000);
    return date.toISOString();
  },
});

/**
 * Should store a list of option keys by the non fungible params used on the Markets page.
 */
export const optionsByMarketsPageParams = atomFamily<string[], string>({
  key: 'optionsByMarketsPageParams',
  default: [],
});

/**
 * Selects the underlying mints for options that have not yet expired
 */
export const selectUnderlyingMintsOfFutureOptions = selector({
  key: 'selectUnderlyingMints',
  get: ({ get }) => {
    const nowInSeconds = Date.now() / 1000;
    const _optionsIds = get(optionsIds);
    const mints = _optionsIds.reduce((acc, publicKeyStr) => {
      const option = get(optionsMap(publicKeyStr));
      if (option && option.expirationUnixTimestamp.toNumber() > nowInSeconds) {
        acc.push(option.underlyingAssetMint);
      }
      return acc;
    }, [] as PublicKey[]);
    return _uniqby(mints, (mint) => mint.toString());
  },
});

/**
 * Selects the quote mints for options that have not yet expired
 */
export const selectQuoteMintsOfFutureOptions = selector({
  key: 'selectQuoteMintsOfFutureOptions',
  get: ({ get }) => {
    const nowInSeconds = Date.now() / 1000;
    const _optionsIds = get(optionsIds);
    const mints = _optionsIds.reduce((acc, publicKeyStr) => {
      const option = get(optionsMap(publicKeyStr));
      if (option && option.expirationUnixTimestamp.toNumber() > nowInSeconds) {
        acc.push(option.quoteAssetMint);
      }
      return acc;
    }, [] as PublicKey[]);
    return _uniqby(mints, (mint) => mint.toString());
  },
});

/**
 * select future expiration dates by the underlying and quote mints
 */
export const selectFutureExpirationsByUnderlyingAndQuote = selector({
  key: 'selectFutureExpirationsByUnderlyingAndQuote',
  get: ({ get }) => {
    const nowInSeconds = Date.now() / 1000;
    const _underlyingMint = get(underlyingMint);
    const _quoteMint = get(quoteMint);

    const _optionsIds = get(optionsIds);
    const expirations = _optionsIds.reduce((acc, publicKeyStr) => {
      const option = get(optionsMap(publicKeyStr));
      if (
        option &&
        option.expirationUnixTimestamp.toNumber() > nowInSeconds &&
        option.underlyingAssetMint.equals(_underlyingMint) &&
        option.quoteAssetMint.equals(_quoteMint)
      ) {
        acc.push(option.expirationUnixTimestamp);
      }
      return acc;
    }, [] as BN[]);

    return _uniqby(expirations, (exp) => exp.toNumber());
  },
});

/**
 * select underlying amount for option based on the selecting underlying mint,
 * quote mint, and expiration
 */
export const selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote =
  selector({
    key: 'selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote',
    get: ({ get }) => {
      const _underlyingMint = get(underlyingMint);
      const _quoteMint = get(quoteMint);
      const _expirationUnixTimestamp = get(expirationUnixTimestamp);
      const _optionsIds = get(optionsIds);
      const expirations = _optionsIds.reduce((acc, publicKeyStr) => {
        const option = get(optionsMap(publicKeyStr));
        if (
          option &&
          option.expirationUnixTimestamp.eq(_expirationUnixTimestamp) &&
          option.underlyingAssetMint.equals(_underlyingMint) &&
          option.quoteAssetMint.equals(_quoteMint)
        ) {
          acc.push(option.underlyingAmountPerContract);
        }
        return acc;
      }, [] as BN[]);

      return _uniqby(expirations, (exp) => exp.toNumber());
    },
  });

export const useUpsertOptions = () =>
  useRecoilTransaction_UNSTABLE<[ProgramAccount<OptionMarket>[]]>(
    ({ set }) =>
      (_optionAccounts) => {
        // loop over fetched options and insert into state in a single recoil transaction
        const optionKeys = _optionAccounts.map((optionAccount) =>
          optionAccount.publicKey.toString(),
        );
        set(optionsIds, optionKeys);
        _optionAccounts.forEach((optionAcount) => {
          const optionPublicKeyStr = optionAcount.publicKey.toString();
          set(
            optionsByMarketsPageParams(
              getOptionsByMarketsPageParamsKey(optionAcount.account),
            ),
            (curr) => [...curr, optionPublicKeyStr],
          );
          set(optionsMap(optionPublicKeyStr), optionAcount.account);
        });
      },
  );
