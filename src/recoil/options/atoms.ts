/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { OptionMarket, OptionMarketWithKey } from '@mithraic-labs/psy-american';
import { BN, ProgramAccount } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import _uniqby from 'lodash.uniqby';
import {
  atom,
  atomFamily,
  DefaultValue,
  selector,
  useRecoilTransaction_UNSTABLE,
} from 'recoil';
import { openOrdersByOptionKey } from '..';

export const defaultExpiration = new BN(0);
export const defaultUnderlying = new BN(0);

/**
 * Assets that should not be used as the underlying asset (i.e. USDC).
 * - Mainnet USDC
 */
const UNDERLYING_BLACKLIST = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];

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

/**
 * Keep track of the last params selected on Markets page keyed by the
 * selected asset pair.
 */
export const lastOptionParametersByAssetPair = atom<
  Record<string, { expiration: BN; underlyingAmountPerContract: BN }>
>({
  key: 'lastOptionParametersByAssetPair',
  default: {},
});

export const underlyingMint = atom<PublicKey | null>({
  key: 'underlyingMint',
  default: null,
});

export const quoteMint = atom<PublicKey | null>({
  key: 'quoteMint',
  default: null,
});

export const atomLoader = atom<boolean>({
  key: 'atomLoader',
  default: true,
});

/**
 * Atom for storing selected expiration.
 *
 * Note: Use selectExpirationWithUnderlyingAmount when setting the expiration
 * value should update the contract size value if the current
 * contract size does not exist on the new expiration.
 */
export const expirationUnixTimestamp = atom<BN>({
  key: 'expirationUnixTimestamp',
  default: defaultExpiration,
});

/**
 * aka contract size
 */
export const underlyingAmountPerContract = atom<BN>({
  key: 'underlyingAmountPerContract',
  default: defaultUnderlying,
});

/**
 * Get the underlyingAmountPerContract, but with a default value
 * when the appropriate parameters have values.
 */
export const selectUnderlyingAmountPerContract = selector({
  key: 'selectUnderlyingAmountPerContract',
  get: ({ get }) => {
    const _underlyingAmountPerContract = get(underlyingAmountPerContract);
    // This won't work since it doesn't get reset when the expiration changes
    if (!_underlyingAmountPerContract.eq(defaultUnderlying)) {
      // short circuit when contract size is something other than the default
      return _underlyingAmountPerContract;
    }
  },
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
 * Inserts Options into the optionsMap atomFamily. Also initializes
 * other state based on the results.
 */
export const useInsertOptions = (_reset = false) =>
  useRecoilTransaction_UNSTABLE<[ProgramAccount<OptionMarket>[]]>(
    ({ get, set, reset }) =>
      (_optionAccounts) => {
        const nowInSeconds = Date.now() / 1000;
        const nowBN = new BN(nowInSeconds);
        if (_reset) {
          // Reset the option state prior to adding options
          const _optionIds = get(optionsIds);
          _optionIds.forEach((id) => reset(optionsMap(id)));
          _optionIds.forEach((_optionId) =>
            reset(openOrdersByOptionKey(_optionId)),
          );
          reset(optionsIds);
          reset(underlyingMint);
          reset(quoteMint);
          reset(expirationUnixTimestamp);
          reset(underlyingAmountPerContract);
          reset(lastOptionParametersByAssetPair);
        }
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
          if (optionAcount.account.expirationUnixTimestamp.lt(nowBN)) {
            // count underlying and quote mints to determine most used only for future options.
            const optionUnderlyingMintString =
              optionAcount.account.underlyingAssetMint.toString();
            const optionQuoteMintString =
              optionAcount.account.quoteAssetMint.toString();
            underlyingCountMap[optionUnderlyingMintString] =
              (underlyingCountMap[optionUnderlyingMintString] ?? 0) + 1;
            quoteCountMap[optionQuoteMintString] =
              (quoteCountMap[optionQuoteMintString] ?? 0) + 1;
          }
        });

        let _underlyingMint = get(underlyingMint);
        let _quoteMint = get(quoteMint);
        if (
          !_underlyingMint ||
          _underlyingMint instanceof DefaultValue ||
          _underlyingMint.equals(PublicKey.default)
        ) {
          // only overwrite underlyingMint when it is set to the default PublicKey
          const sortedUnderlyingAssets = Object.entries(underlyingCountMap)
            .filter((entry) => !UNDERLYING_BLACKLIST.includes(entry[0]))
            .sort((a, b) => b[1] - a[1]);
          const mostUsedUnderlying = sortedUnderlyingAssets[0]?.[0];
          _underlyingMint = new PublicKey(mostUsedUnderlying);
          set(underlyingMint, _underlyingMint);
        }
        if (
          !_quoteMint ||
          _quoteMint instanceof DefaultValue ||
          _quoteMint.equals(PublicKey.default)
        ) {
          // only overwrite quoteMint when it is set to the default PublicKey
          const sortedQuoteAssets = Object.entries(quoteCountMap).sort(
            (a, b) => b[1] - a[1],
          );
          const mostUsedQuote = sortedQuoteAssets[0]?.[0];
          _quoteMint = new PublicKey(mostUsedQuote);
          set(quoteMint, _quoteMint);
        }
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
        if (
          expiration instanceof DefaultValue ||
          expiration.eq(defaultExpiration)
        ) {
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
        if (
          underlyingAmountSize instanceof DefaultValue ||
          underlyingAmountSize.eq(defaultUnderlying)
        ) {
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

export const useUpsertOption = () =>
  useRecoilTransaction_UNSTABLE<[OptionMarketWithKey]>(
    ({ set }) =>
      (option) => {
        const optionKeyStr = option.key.toString();
        set(optionsIds, (curVal) => [...curVal, optionKeyStr]);
        set(optionsMap(optionKeyStr), option);
      },
    [],
  );
