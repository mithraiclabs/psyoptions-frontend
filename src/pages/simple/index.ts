import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const SimplePathRedirect: React.VFC = () => {
  const history = useHistory();
  useEffect(() => {
    history.replace('/');
  }, [history]);

  return null;
};

export default SimplePathRedirect;
