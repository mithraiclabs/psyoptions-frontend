import React, { createContext } from 'react';
import { useCookieState } from 'use-cookie-state';

const PasswordContext = createContext([]);

const PasswordProvider: React.FC = ({ children }) => {
  return (
    <PasswordContext.Provider value={useCookieState('password', '')}>
      {children}
    </PasswordContext.Provider>
  );
};

export { PasswordContext, PasswordProvider };
