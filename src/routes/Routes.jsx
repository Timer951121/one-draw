import React, {useContext, useEffect} from 'react';
import {MemoryRouter, Navigate, Route, Routes, UNSAFE_LocationContext, useNavigate} from 'react-router-dom';
import {AuthLayout, DefaultLayout, EditLayout} from '../layout';
import Login from '../pages/Login/Login';
import Sites from '../pages/Sites/Sites';
import Roof from '../pages/ModelSite/Roof/Roof';
import Obstruction from '../pages/ModelSite/Obstruction/Obstruction';
import Tree from '../pages/ModelSite/Tree/Tree';
import Modules from '../pages/SystemDesign/Modules/Modules';
import Irradiance from '../pages/SystemDesign/Irradiance/Irradiance';
import SolarAccess from '../pages/SystemDesign/ShadePoint/ShadePoint';
import WhatIf from '../pages/PowerCalculation/WhatIf/WhatIf';
import PriceCalculation from '../pages/PowerCalculation/PriceCalculation/PriceCalculation';
import SurfaceDraw from '../pages/AdvancedTools/SurfaceDraw/SurfaceDraw';
import CustomImagery from "../pages/ModelSite/Custom Imagery/CustomImagery";
import {UserContext} from "../contexts/UserContext";
import TreeCartPage from "../pages/PowerCalculation/TreeCart/TreeCart";
import TapeMeasure from "../pages/TapeMeasure/TapeMeasure";
import {ViewerContextProvider} from "../contexts/ViewerContext";
import azureLoginValidation from "../services/azureLoginValidation";
import BuildingAttributes from "../pages/ModelSite/BuildingAttributes/BuildingAttributes";
import {Header} from "../components";
import NotFound404 from "../pages/404-Not-Found/NotFound404";
import ShadePoint from "../pages/SystemDesign/ShadePoint/ShadePoint";


const EditorRoutes = () => {
    const {hasCapability} = useContext(UserContext);


    return (
        <>
            <UNSAFE_LocationContext.Provider value={null}>
                <ViewerContextProvider>
                    <MemoryRouter>

                        <EditLayout/>
                        <Routes>
                            <Route path='/' element={<Navigate replace to='/configure/roof'/>}/>
                            {hasCapability("View_Building_Attributes") && <Route
                                path="/building"
                                element={<BuildingAttributes/>}
                            />}
                            {hasCapability("View_Building_Attributes") && <Route
                              path="/building/engineering-letter"
                              element={<BuildingAttributes />}
                            />}
                            {hasCapability("View_Building_Attributes") && <Route
                              path="/building/engineering-affidavit"
                              element={<BuildingAttributes />}
                            />}
                            <Route exact path='/roof' element={<Roof/>}/>
                            <Route exact path='/obstruction' element={<Obstruction/>}/>
                            <Route exact path='/tree' element={<Tree/>}/>
                            <Route exact path='/modules' element={<Modules/>}/>
                            <Route exact path='/irradiance' element={<Irradiance/>}/>
                            <Route exact path='/solar-access' element={<ShadePoint/>}/>
                            {
                                hasCapability('What_If') &&
                                <Route path='/what-if' element={<WhatIf/>}/>
                            }
                            <Route path='/price-calculation' element={<PriceCalculation/>}/>
                            {
                                hasCapability('Edit_Imagery') &&
                                <Route path='/custom-image' element={<CustomImagery/>}/>
                            }
                            {
                                (hasCapability('Surface Draw') || hasCapability('Surface_Draw')) &&
                                <Route path='/surface-draw' element={<SurfaceDraw/>}/>
                            }
                            {
                                hasCapability('Tree_Cart') &&
                                <Route path='/tree-cart' element={<TreeCartPage/>}/>
                            }
                            <Route path='/tape-measure' element={<TapeMeasure/>}/>
                        </Routes>
                    </MemoryRouter>
                </ViewerContextProvider>
            </UNSAFE_LocationContext.Provider>
        </>
    )
}

const AppRoutes = () => {

    const isAzureAuthenticated = azureLoginValidation()

    const {setUser} = useContext(UserContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (!isAzureAuthenticated) {
            navigate('/login')
        }

    }, []);


    return (
        <>
            {
                (isAzureAuthenticated) && (
                    <Header/>)
            }

            <Routes>
                <Route element={<AuthLayout/>}>
                    <Route path='/' element={<Navigate replace to='/login'/>}/>
                    <Route path='/login'
                           element={
                               isAzureAuthenticated ?
                                   <Navigate replace to='/sites'/> :
                                   <Login setUser={setUser}/>
                           }
                    />
                </Route>

                {(isAzureAuthenticated) && (
                    <Route element={<DefaultLayout/>}>
                        <Route path='/sites' element={<Sites/>}/>
                    </Route>
                )}

                {(isAzureAuthenticated) && (
                    <Route>
                        <Route path='/configure' element={<EditorRoutes/>}/>
                    </Route>
                )}


                {/*    404 Route*/}
                {(isAzureAuthenticated) && (
                    <Route path='*' element={<NotFound404/>}/>
                )}
            </Routes>
        </>
    );
}

export default AppRoutes;
