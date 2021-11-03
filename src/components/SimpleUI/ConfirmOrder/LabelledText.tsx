import React from 'react';
import { useTheme } from '@material-ui/core/styles';

const LabelledText: React.VFC<{
  title: string;
  subtitle: string;
  titleColor?: string | null;
}> = ({
  title,
  subtitle,
  titleColor,
}) => {
  const theme = useTheme();

  return (
    <>
      <div
        style={{
          fontSize: 16,
          fontWeight: 400,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          fontSize: 20,
          fontFamily: 'Goldman',
          fontWeight: 700,
          color: titleColor ?? theme.palette.primary.light,
        }}
      >
        {title}
      </div>
    </>
  );
};

export default LabelledText;