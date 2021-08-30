import { useContext } from 'react';
import {
  ConnectionContext,
  ConnectionContextType,
} from '../context/ConnectionContext';

const useConnection = (): ConnectionContextType =>
  useContext(ConnectionContext);

export default useConnection;
