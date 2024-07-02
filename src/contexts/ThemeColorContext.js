import React, {createContext} from 'react';
import {createGlobalStyle} from "styled-components";
import useLocalStorage from 'use-local-storage';
import {LightenDarkenColor} from 'lighten-darken-color';
import HexToRgba from "../helpers/colorHelper";

const ThemeColorContext = createContext(false);

const ThemeColorProvider = ({children}) => {
    const [primary, setPrimary] = useLocalStorage("primary_color", "#538abc");
    const [secondary, setSecondary] = useLocalStorage("secondary_color", "#41539e");

    const PrimaryRgba = HexToRgba(`${primary}`);
    const PrimaryLite = HexToRgba(`${primary}`, 0.08);
    const PrimaryTrans = HexToRgba(`${primary}`, 0.8);
    const SecondaryRgba = HexToRgba(`${secondary}`);
    const PrimaryDark = LightenDarkenColor(primary, -20);

    const GlobalStyles = createGlobalStyle`
        :root {
            --primary       : ${PrimaryRgba};
            --pLite         : ${PrimaryLite};
            --pDark         : ${PrimaryDark};
            --pTransparent  : ${PrimaryTrans};
            --secondary     : ${SecondaryRgba};
        }
    `;

    return (
        <ThemeColorContext.Provider value={{primary, setPrimary, secondary, setSecondary}}>
            <GlobalStyles/>
            {children}
        </ThemeColorContext.Provider>
    );
}

export {ThemeColorProvider, ThemeColorContext};