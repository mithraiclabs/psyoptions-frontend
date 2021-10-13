import { createContext, useState } from 'react';

export type FormFactor = 'desktop' | 'tablet' | 'mobile';

const ScreenSizeContext = createContext<{
  formFactor: FormFactor;
  updateFormFactor: (mobileDevice: boolean, tabletDevice: boolean) => void;
}>({
  formFactor: 'desktop',
  updateFormFactor: () => {},
});

export const MOBILE_DEVICE_MEDIA_QUERY = "(min-width:376px)";
export const TABLET_DEVICE_MEDIA_QUERY = "(min-width:881px)";

export const ScreenSizeProvider: React.FC = ({ children }) => {
  const [formFactor, setFormFactor] = useState('desktop' as FormFactor);

  const updateFormFactor = (mobileDevice: boolean, tabletDevice: boolean) => {
    const isDesktop = !mobileDevice && !tabletDevice;
    const device = isDesktop ? 'desktop' : mobileDevice ? 'mobile' : 'tablet';
    setFormFactor(device);
  };

  return (
    <ScreenSizeContext.Provider value={{ formFactor, updateFormFactor }}>
      {children}
    </ScreenSizeContext.Provider>
  )
}

export { ScreenSizeContext };
