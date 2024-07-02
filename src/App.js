import React, {useContext, useEffect} from 'react';
import { ConfigProvider } from 'antd';
import Routes from './routes/Routes';
import { ThemeContext } from './contexts/ThemeContext';
import { UserContext, UserProvider } from './contexts/UserContext';
import { ThemeColorContext } from './contexts/ThemeColorContext';
import './App.scss';
import { useViewerStore } from './store/store';
import { UnitContext } from './contexts/UnitContext';
import rotateScreenImage from './assets/img/i-pad/ipad-portrait-view-image.png';
function App() {
    const {theme} = useContext(ThemeContext);
    const {user} = useContext(UserContext);
    const {primary} = useContext(ThemeColorContext);
    const unitContext = useContext(UnitContext);

    const setUnitContext = useViewerStore(state => state.setUnitContext);
    if(setUnitContext) { setUnitContext(unitContext); }



    useEffect(() => {

        let portrait = window.matchMedia("(orientation: portrait)");

        //if already in portrait mode show alert
        if(portrait.matches) {
            document.getElementById("portraitAlertScreen").style.display = "flex";
        } else {
            document.getElementById("portraitAlertScreen").style.display = "none";
            useViewerStore.setState({isRightSidebarOpen: true});
        }


        portrait.addEventListener("change", function(e) {
            if(e.matches) {
                document.getElementById("portraitAlertScreen").style.display = "flex";
            } else {
                document.getElementById("portraitAlertScreen").style.display = "none";
                useViewerStore.setState({isRightSidebarOpen: true});
            }
        })


    }, []);

    return (
        <UserProvider>

            <div
                id={"portraitAlertScreen"}
                className={"portraitAlertScreen"}>
                <img
                    height={200}
                    src={rotateScreenImage} alt="rotate screen"/>
                <h4>
                    Please Rotate your Device to Landscape Mode to Use this Application
                </h4>
            </div>

            <div className='app' data-theme={theme} user={user}>
                <ConfigProvider
                    theme={{
                        token: {
                            colorBgBase: theme === 'dark' ? '#2c2d33' : '#ffffff',
                            colorPrimary: `${primary}`,
                            colorPrimaryBg: theme === 'dark' ? 'rgba(0,0,0,0.1)' : '#ffffff',
                            colorTextBase: theme === 'dark' ? '#ffffff' : '#000000',
                            colorBorderBase: theme === 'dark' ? 'white' : '#ffffff',
                            borderRadius: 6,
                            optionSelectedBg:`${primary}`,
                            optionActiveBg: `${primary}`,
                        },
                    }}
                >
                    <Routes/>
                </ConfigProvider>
            </div>
        </UserProvider>
    );
}

export default App;
