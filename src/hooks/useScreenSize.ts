import { useContext } from 'react';
import { ScreenSizeContext } from '../context/ScreenSizeContext';

const useScreenSize = () => useContext(ScreenSizeContext);

export default useScreenSize;
