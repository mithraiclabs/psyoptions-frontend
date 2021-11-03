/// <reference types="react-scripts" />

import { SSRData } from 'urql';

declare global {
  interface Window {
    __URQL_DATA__?: SSRData;
  }
}
