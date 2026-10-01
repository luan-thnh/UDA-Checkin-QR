import { jsx as _jsx } from "react/jsx-runtime";
import { App } from 'zmp-ui';
import { CheckinPage } from './pages/CheckinPage';
export function MiniApp() {
    return (_jsx(App, { children: _jsx(CheckinPage, {}) }));
}
