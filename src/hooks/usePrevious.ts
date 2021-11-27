import { useEffect, useRef } from 'react';

/**
 * Keep track of a value from the previous render.
 */
const usePrevious = <T>(value: T): T => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default usePrevious;
