import { useState, useEffect } from 'react';

export const useCountry = () => {
  const [countryCode, setCountryCode] = useState(null);

  useEffect(() => {
    (async () => {
      const URL = 'https://countrycode.bonfida.workers.dev/';
      const response = await fetch(URL);
      const data = await response.json();
      console.log('Country Code', data?.countryCode);
      setCountryCode(data?.countryCode);
    })();
  }, []);

  return countryCode;
};

export const DISALLOWED_COUNTRIES = [
  'AF', // Afghanistan
  'CI', // Ivory Coast
  'CU', // Cuba
  'IQ', // Iraq
  'IR', // Iran
  'LR', // Liberia
  'KP', // North Korea
  'SY', // Syria
  'SD', // Sudan
  'SS', // South Sudan
  'ZW', // Zimbabwe
  'AG', // Antigua
  'US', // United States
  'AS', // American Samoa
  'GU', // Guam
  'MP', // Northern Mariana Islands
  'PR', // Puerto Rico
  'UM', // United States Minor Outlying Islands
  'VI', // US Virgin Islands
  'UA', // Ukraine
  'BY', // Belarus,
  'AL', // Albania
  'BU', // Burma
  'CF', // Central African Republic
  'CD', // Democratic Republic of Congo
  'LY', // Lybia
  'SO', // Somalia
  'YD', // Yemen
  'GB', // United Kingdom
  'TH', // Thailand
];
