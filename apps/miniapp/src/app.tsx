import { App, ZMPRouter, AnimationRoutes, SnackbarProvider } from 'zmp-ui';
import { Route } from 'react-router-dom';
import { CheckinPage } from './pages/CheckinPage';

export function MiniApp() {
  return (
    <App>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path="/" element={<CheckinPage />} />
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
}
