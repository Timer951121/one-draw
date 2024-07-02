import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter as Router} from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeColorProvider } from './contexts/ThemeColorContext';
import handleMicrosoftLogin from './helpers/handleMsalLogin';
import App from './App';
import '@splidejs/react-splide/css/core';
import { UnitProvider } from './contexts/UnitContext';


handleMicrosoftLogin();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <Router
        basename={process.env.REACT_APP_BASENAME}
    >
        <ThemeColorProvider>
            <ThemeProvider>
                <UnitProvider>
                    <App/>
                </UnitProvider>
            </ThemeProvider>
        </ThemeColorProvider>
    </Router>


);