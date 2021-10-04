import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const SimplePathRedirect: React.VFC = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
};

export default SimplePathRedirect;
