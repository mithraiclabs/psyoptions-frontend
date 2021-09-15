import { useContext } from 'react';
import { PasswordContext } from '../context/PasswordContext';

const usePassword = () => useContext(PasswordContext);

export default usePassword;
