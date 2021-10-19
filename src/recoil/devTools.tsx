import LogMonitor from 'recoil-devtools-log-monitor';
import DockMonitor from 'recoil-devtools-dock';

/**
 * Recoil dev tooling is not stable, so wrapping here to
 * make it easy to swap out
 */
export const RecoilDevTool: React.VFC = () => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <DockMonitor
      toggleVisibilityKey="ctrl-h"
      changePositionKey="ctrl-q"
      changeMonitorKey="ctrl-m"
    >
      <LogMonitor />
    </DockMonitor>
  );
};
