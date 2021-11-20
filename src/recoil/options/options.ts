/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { OptionMarket, OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { BN, ProgramAccount } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import _uniqby from 'lodash.uniqby';
import {
  atom,
  atomFamily,
  selector,
  useRecoilTransaction_UNSTABLE,
} from 'recoil';

const defaultExpiration = new BN(0);
const defaultUnderlying = new BN(0);

/**
 * Store each option by PublicKey string.
 */
export const optionsMap = atomFamily<OptionMarketWithKey | null, string>({
  key: 'optionsMap',
  default: null,
});

// necessary to keep track of all options stored in state
export const optionsIds = atom<string[]>({
  key: 'optionsIds',
  default: [],
});

export const underlyingMint = atom<PublicKey | null>({
  key: 'underlyingMint',
  default: null,
});

export const quoteMint = atom<PublicKey | null>({
  key: 'quoteMint',
  default: null,
});

export const expirationUnixTimestamp = atom<BN>({
  key: 'expirationUnixTimestamp',
  default: defaultExpiration,
});

/**
 * aka contract size
 */
export const underlyingAmountPerContract = atom<BN>({
  key: 'underlyingAmountPerContract',
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
 * Selects the mints for options that have not yet expired
 */
export const selectMintsOfFutureOptions = selector({
  key: 'selectMintsOfFutureOptions',
  get: ({ get }) => {
    const nowInSeconds = Date.now() / 1000;
    const _optionsIds = get(optionsIds);
    const mints = _optionsIds.reduce((acc, publicKeyStr) => {
      const option = get(optionsMap(publicKeyStr));
      if (option && option.expirationUnixTimestamp.toNumber() > nowInSeconds) {
        acc.push(option.underlyingAssetMint);
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
        _underlyingMint &&
        _quoteMint &&
        // must check for all permutations to get Calls and Puts
        (option.underlyingAssetMint.equals(_underlyingMint) ||
          option.underlyingAssetMint.equals(_quoteMint)) &&
        (option.quoteAssetMint.equals(_quoteMint) ||
          option.quoteAssetMint.equals(_underlyingMint))
      ) {
        acc.push(option.expirationUnixTimestamp);
      }
      return acc;
    }, [] as BN[]);

    return _uniqby(expirations, (exp) => exp.toNumber()).sort((a, b) =>
      a.sub(b).toNumber(),
    );
  },
});

/**
 * select underlying amount for option based on the selecting underlying mint,
 * quote mint, and expiration.
 *
 * Sorts the sizes in descending order.
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
          _underlyingMint &&
          _quoteMint &&
          // must check for all permutations to get Calls and Puts
          (option.underlyingAssetMint.equals(_underlyingMint) ||
            option.underlyingAssetMint.equals(_quoteMint)) &&
          (option.quoteAssetMint.equals(_quoteMint) ||
            option.quoteAssetMint.equals(_underlyingMint))
        ) {
          acc.push(option.underlyingAmountPerContract);
        }
        return acc;
      }, [] as BN[]);

      return _uniqby(expirations, (exp) => exp.toString()).sort((a, b) =>
        a.toString() > b.toString() ? 1 : -1,
      );
    },
  });

export const selectOptionsByMarketsPageParams = selector({
  key: 'selectOptionsByMarketsPageParams',
  get: ({ get }) => {
    const _underlyingMint = get(underlyingMint);
    const _quoteMint = get(quoteMint);
    const _expiration = get(expirationUnixTimestamp);
    const _underlyingAmountPerContract = get(underlyingAmountPerContract);

    const _optionsIds = get(optionsIds);
    const options = _optionsIds
      .map((publicKeyStr) => get(optionsMap(publicKeyStr)))
      .filter((option) => {
        return (
          option &&
          option.expirationUnixTimestamp.eq(_expiration) &&
          _underlyingMint &&
          _quoteMint &&
          // must check for all permutations to get Calls and Puts
          (option.underlyingAmountPerContract.eq(
            _underlyingAmountPerContract,
          ) ||
            option.quoteAmountPerContract.eq(_underlyingAmountPerContract)) &&
          (option.underlyingAssetMint.equals(_underlyingMint) ||
            option.underlyingAssetMint.equals(_quoteMint)) &&
          (option.quoteAssetMint.equals(_quoteMint) ||
            option.quoteAssetMint.equals(_underlyingMint))
        );
      });
    return options as OptionMarketWithKey[];
  },
});

/**
 * Reset all of the options state.
 *
 * Unfortunately cannot use useResetRecoilState on the atomFamily :/
 */
export const useResetOptionsState = () =>
  useRecoilTransaction_UNSTABLE(
    ({ get, reset }) =>
      () => {
        const _optionIds = get(optionsIds);
        _optionIds.forEach((id) => reset(optionsMap(id)));
        reset(optionsIds);
        reset(underlyingMint);
        reset(quoteMint);
        reset(expirationUnixTimestamp);
        reset(underlyingAmountPerContract);
      },
    [],
  );

/**
 * Upserts Options into the optionsMap atomFamily. Also initializes
 * other state based on the results
 */
export const useUpsertOptions = () =>
  useRecoilTransaction_UNSTABLE<[ProgramAccount<OptionMarket>[]]>(
    ({ get, set }) =>
      (_optionAccounts) => {
        // loop over fetched options and insert into state in a single recoil transaction
        const optionKeys = _optionAccounts.map((optionAccount) =>
          optionAccount.publicKey.toString(),
        );
        set(optionsIds, optionKeys);
        const underlyingCountMap: Record<string, number> = {};
        const quoteCountMap: Record<string, number> = {};
        _optionAccounts.forEach((optionAcount) => {
          const optionPublicKeyStr = optionAcount.publicKey.toString();
          set(optionsMap(optionPublicKeyStr), {
            ...optionAcount.account,
            key: optionAcount.publicKey,
          });
          // count underlying and quote mints to determine most used
          const optionUnderlyingMintString =
            optionAcount.account.underlyingAssetMint.toString();
          const optionQuoteMintString =
            optionAcount.account.quoteAssetMint.toString();
          underlyingCountMap[optionUnderlyingMintString] =
            (underlyingCountMap[optionUnderlyingMintString] ?? 0) + 1;
          quoteCountMap[optionQuoteMintString] =
            (quoteCountMap[optionQuoteMintString] ?? 0) + 1;
        });

        let _underlyingMint = get(underlyingMint);
        let _quoteMint = get(quoteMint);
        if (!_underlyingMint || _underlyingMint.equals(PublicKey.default)) {
          // only overwrite underlyingMint when it is set to the default PublicKey
          const mostUsedUnderlying = Object.entries(underlyingCountMap).reduce(
            (acc, entry) => {
              if (entry[1] > underlyingCountMap[acc]) {
                return entry[0];
              }
              return acc;
            },
            Object.keys(underlyingCountMap)[0],
          );
          _underlyingMint = new PublicKey(mostUsedUnderlying);
          set(underlyingMint, _underlyingMint);
        }
        if (!_quoteMint || _quoteMint.equals(PublicKey.default)) {
          // only overwrite quoteMint when it is set to the default PublicKey
          const mostUsedQuote = Object.entries(quoteCountMap).reduce(
            (acc, entry) => {
              if (entry[1] > quoteCountMap[acc]) {
                return entry[0];
              }
              return acc;
            },
            Object.keys(quoteCountMap)[0],
          );
          _quoteMint = new PublicKey(mostUsedQuote);
          set(quoteMint, _quoteMint);
        }
        const nowInSeconds = Date.now() / 1000;
        const filteredOptionAccounts = _optionAccounts.filter(
          (optionAccount) =>
            optionAccount.account.expirationUnixTimestamp.toNumber() >
              nowInSeconds &&
            _underlyingMint &&
            optionAccount.account.underlyingAssetMint.equals(_underlyingMint) &&
            _quoteMint &&
            optionAccount.account.quoteAssetMint.equals(_quoteMint),
        );
        let expiration = get(expirationUnixTimestamp);
        if (expiration.eq(defaultExpiration)) {
          // set expiration
          const expCount = filteredOptionAccounts.reduce(
            (acc, optionAccount) => {
              const expirationString =
                optionAccount.account.expirationUnixTimestamp.toString();
              acc[expirationString] = (acc[expirationString] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );
          const highestExpString = Object.keys(expCount).reduce((acc, key) => {
            if ((expCount[acc] ?? 0) < expCount[key]) {
              return key;
            }
            return acc;
          }, '');
          expiration = new BN(highestExpString);
          set(expirationUnixTimestamp, expiration);
        }
        const underlyingAmountSize = get(underlyingAmountPerContract);
        if (underlyingAmountSize.eq(defaultUnderlying)) {
          const firstOptionAccount = filteredOptionAccounts.find(
            (optionAccount) =>
              optionAccount.account.expirationUnixTimestamp.eq(expiration),
          );
          set(
            underlyingAmountPerContract,
            firstOptionAccount?.account.underlyingAmountPerContract,
          );
        }
      },
    [],
  );
