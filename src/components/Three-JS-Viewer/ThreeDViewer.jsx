//Module import
import React, {useContext, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';


//Function/Class/Hooks import
import {Viewer} from './Viewer-Factory/Viewer';

//React Components import
import {ViewerContext} from '../../contexts/ViewerContext';
import {useViewerStore} from '../../store/store';
import {LoadModelJson} from './Controllers/Loader';
import {UserContext} from '../../contexts/UserContext';
import moduleServices from '../../services/moduleService';
import {getDesignVersionList} from '../../services/designVersionService';
import siteService from '../../services/siteService';
import masterDataService from "../../services/masterDataService";
import {getPathnameIncludes, setPathname} from "../../helpers/getPathname";
import getStateCodeFromStateName from "../../services/stateCodeService";
import {LAYER_OPTIONS} from "../../Constants";
import {LoadingContext} from '../../store/loadingMessageStore';
import {fetchSetbackInfo} from './Controllers/PathwayControl';
import {preliminaryLayoutClosure} from '../../services/preliminaryLayoutClosureService'
import {logger} from '../../services/loggingService';
import RestrictFinalisePopup from "../Modal/Modal-Content/RestrictFinalisePopup"
import {IoIosLock} from "react-icons/io";

let viewerInstance

const ThreeDViewer = () => {

    const navigate = useNavigate();

    const {SceneViewer,setSceneViewer} = useContext(ViewerContext);

    const location = useLocation()


    const {user, hasCapability} = useContext(UserContext);
    const setDesignList = useViewerStore((state) => state.setDesignList)
    const setSelectedDesign = useViewerStore((state) => state.setSelectedDesign);
    const isGhostObstructionUpdated = useViewerStore((state) => state.isGhostObstructionUpdated);
    const {designList, selectedDesignIndex, loadingCompleted} = useViewerStore(state => state);

    const keyDownListener = (e) => {
        const isModalOpenInInterface = useViewerStore.getState().isModalOpenInInterface;

        if (!getPathnameIncludes('configure') || isModalOpenInInterface) {
            return;
        }

        if (e.ctrlKey) {
            if (hasCapability('Undo') && e.key === 'z') {
                //Undo
                //Ctrl + Z
                document.getElementById("undoBtn").click();
            } else if (hasCapability('Redo') && e.key === 'y') {
                //Redo
                //Ctrl + Y
                document.getElementById("redoBtn").click();
            }
        } else if (e.altKey) {
            if (e.key === 't') {
                //Alt + T
                viewerInstance.setupSelectionBoxHelper('tree');
            }
        } else if (e.shiftKey) {
            if (hasCapability('Orbit') && e.key.toLowerCase() === 'o') {
                //Shift + O
                viewerInstance.setOrbitControlsMode('orbit');
            } else if (hasCapability('Pan') && e.key.toLowerCase() === 'p') {
                //Shift + P
                viewerInstance.setOrbitControlsMode('pan');
            } else if (e.key.toLowerCase() === 'h') {
                //Shift + H
                document.getElementById('defaultPositionBtn').click();
            } else if (e.key === 'Delete') {
                //Shift + Delete
                document.getElementById('clearSceneBtn').click();
            }
        } else if (e.key === 'Escape') {

            //if pathname is not tape-measure
            if (getPathnameIncludes('tape-measure')) {
                viewerInstance.resetDraw(false);
                viewerInstance.setDrawMode(false);
                viewerInstance.setAutoAlignMode(false);
                navigate('/configure/roof');
            } else {
                viewerInstance.setDrawMode(false);
                viewerInstance.setAutoAlignMode(false);
            }
            const event = new Event("closeContextMenu");
            document.getElementById("canvasContainer").dispatchEvent(event);
            viewerInstance.deselectAllSelectedObjectsAndEndTask();
        } else if (e.key === 'Delete') {
            viewerInstance.setModuleSetting('delete');
        } else if (e.key.toLowerCase() === 'p') {
            //P
            document.getElementById("pushPullToolBtn").click()
        } else if (hasCapability('Tape_Measure') && e.key.toLowerCase() === 'd') {
            //Q
            document.getElementById("btnMeasure").click()
        } else if (hasCapability('X-Ray_View') && e.key.toLowerCase() === 'k') {
            //K
            document.getElementById("btnXRay").click()
        } else if (hasCapability('What_If') && e.key.toLowerCase() === 'w') {
            //W
            navigate(`/configure/what-if`)
        } else if (e.key.toLowerCase() === 'o') {
            //Obstruction
            navigate(`/configure/obstruction`);
        } else if (e.key.toLowerCase() === 'r') {
            //Roof
            navigate(`/configure/roof`);
        } else if (e.key.toLowerCase() === 't') {
            //Tree
            navigate(`/configure/tree`);
        } else if (e.key.toLowerCase() === 'm') {

            //Module
            navigate(`/configure/modules`);
        } else if (hasCapability("Irradiance") && e.key.toLowerCase() === 'i') {
            //Irradiance
            navigate(`/configure/irradiance`)
        } else if (e.key.toLowerCase() === 's') {
            //Solar Access
            navigate(`/configure/solar-access`);
        } else if (hasCapability('EPC_Calculations') && e.key.toLowerCase() === 'e') {
            //EPC
            navigate(`/configure/price-calculation`);
        } else if (e.key.toLowerCase() === 'f' && (hasCapability('Surface Draw') || hasCapability('Surface_Draw'))) {
            //Flat Roof
            navigate(`/configure/surface-draw`);
        } else if (hasCapability('Tree_Cart') && e.key.toLowerCase() === 'c') {
            //Tree Cart
            navigate(`/configure/tree-cart`);
        } else if (hasCapability("View_Building_Attributes") && e.key.toLowerCase() === 'b') {
            //Building
            navigate(`/configure/building`);
        }
    };

    useEffect(() => {
        try {
            masterDataService
                .getMasterDataList()
                .then(async (masterDataAPIResponse) => {
                    useViewerStore.setState({masterDataList: masterDataAPIResponse});
                })
                .catch((error) => {
                    logger.error(error);
                });
        } catch (e) {
            logger.error(e);
        }
        useViewerStore.setState({isTreeLabelVisible: false})
    }, []);

    useEffect(() => {

        //Instantiate a new Scene from Viewer Factory
        viewerInstance = new Viewer();

        viewerInstance.navigate = navigate
        viewerInstance.hasCapability = hasCapability;

        //Set ViewerState for parent components to access Viewer Instance
        setSceneViewer(viewerInstance)

        //Navigating to the editor page
        navigate("/configure/roof");



        if (!user?.user_Id) {
            return;
        }

        // anonymous async caller
        (async () => {
            const loadingContext = new LoadingContext();
            try {

                const urlParams = new URLSearchParams(window.location.search);
                const sfid = urlParams.get('sfid');

                if (!sfid || sfid === '' || sfid === null) {
                    alert("No Site Found / Invalid SalesForceId");
                    return
                }

                loadingContext.setMessage({message: 'Getting Site Data...'});


                const response = await siteService.postSitesSearch(sfid, 1, [], {}, false, false);

                if(response.Message==="No records found"){
                    throw new Error("No Site Found for the given SalesForceId, Please check the SalesForceId and try again.");
                }

                const site = response.Data[0];

                loadingContext.setMessage({message: 'Processing Site Data...'});
                const [state, zipCode] = site.State.split("-");
                const stateCode = getStateCodeFromStateName(state);

                // Formatting the address
                let address = site.Address;
                if (site.Address.includes(",")) {
                    const addressFirstPartTrimmed = site.Address.split(",")[0];
                    const fullAddress = `${addressFirstPartTrimmed}, ${site.City}, ${stateCode}`;
                    address = `${fullAddress.split(",")[0]}, ${fullAddress.split(",")[1]}, ${fullAddress.split(",")[2].split("-")[0]}`;
                }

                document.title = `${address} - OneDraw`;



                const stage = parseInt(site.Stage?.split(':')[0]);

                // Warning if Stage 4 or later and user is not Admin/Sales Op/RSA
                const canModifyStage4 = hasCapability('Stage_4_Post_Contract_Finalize');
                const canFinalize = hasCapability('Finalize');
                if (canFinalize && (stage && stage >= 4) && !canModifyStage4) {
                    alert("Alert: This opportunity is in stage 4 or later, therefore no modification will be saved");
                }

                preliminaryLayoutClosure(site.SalesForceId).catch(logger.error);

                sessionStorage.setItem('OppurtunityId', site.Account_Id);
                sessionStorage.setItem('SalesForceId', site.SalesForceId);
                sessionStorage.setItem('stateCode', stateCode);
                sessionStorage.setItem('postalCode', zipCode);
                sessionStorage.setItem('directLead', site.DirectLead);
                sessionStorage.setItem('opportunityName', site.Name);
                sessionStorage.setItem('city', site.City);
                sessionStorage.setItem('currentStage', stage);
                sessionStorage.setItem('Utility_Company', site.Utility_Company);
                sessionStorage.setItem('Multiplier', site.Multiplier);

                useViewerStore.setState({siteAddress: address, loadingCompleted: false});
                loadingContext.setMessage({message: 'Fetching Modules...'});

                const moduleListAPIResponse = await moduleServices.getModuleList();
                const moduleList = moduleListAPIResponse?.map((item, index) => ({
                    key: index,
                    text: item.Product_Name || "",
                    value: item.Product_Name || "",
                    power: item.Wattage || 0,
                    w: item.Width_mm ? item.Width_mm / 1000 : 0,
                    h: item.Length_mm ? item.Length_mm / 1000 : 0
                }));

                const defaultModuleName = await moduleServices.getDefaultModule(stateCode);
                const defaultModule = moduleList.find(module => module.text === defaultModuleName);

                useViewerStore.setState({moduleList});
                useViewerStore.setState({activeModule: defaultModule});

                setDesignList([]);

                loadingContext.setMessage({message: 'Getting Site Designs...'});

                const designList = await getDesignVersionList(sfid);

                if (designList === null) {
                    setSelectedDesign(-1);

                    await viewerInstance.getSite();
                    return;
                }

                setDesignList(designList);
                setSelectedDesign(0);

                const design = designList[0];
                const data = await siteService.retrieveSiteDesignDetailsWithDesignData(sfid, design.Design_No, design.Version_No);

                const designData = JSON.parse(data.DesignDataList[0].Design_Data);
                useViewerStore.setState({designID: data.DesignDataList[0].DesignID});
                loadingContext.setMessage({message: 'Fetching Setback Info...'});
                await fetchSetbackInfo(sfid);

                loadingContext.setMessage({message: 'Drawing Site...'});
                await LoadModelJson(viewerInstance, designData, 'glb');
            } catch (e) {
                logger.error(e);
                viewerInstance.viewerAlert({
                    show: true,
                    title: "Loading Error",
                    message: e.message,
                    messageType: "error",
                    isModal: true
                });

            } finally {
                loadingContext.dispose();
                window.addEventListener('keydown', keyDownListener, false);
                window.addEventListener('resize', viewerInstance.resizeCanvas);
            }
        })();


        return () => {
            viewerInstance.renderer.domElement.remove();
            window.removeEventListener('keydown', keyDownListener, false);
            window.removeEventListener('resize', viewerInstance.resizeCanvas);
            sessionStorage.setItem('OppurtunityId', "");
            sessionStorage.setItem('SalesForceId', "");
            sessionStorage.setItem('stateCode', "");
            sessionStorage.setItem('postalCode', "");
            sessionStorage.setItem('directLead', "");
            sessionStorage.setItem('opportunityName', "");
            sessionStorage.setItem('currentStage', "");
            useViewerStore.setState({siteAddress: ''});
        };
    }, [user]);

    useEffect(() => {
        const pathname = location.pathname;
        setPathname(pathname);
        let selectType = viewerInstance.getSelectTypeFromPath(pathname)
        const measureMode = pathname.includes('measure');
        viewerInstance.hideObject("GhostObst", true);
        if (!pathname.includes('roof')) {
            viewerInstance.toggleRoofTag(false);
            useViewerStore.setState({
                isRoofTagVisible: false,
                isMoveRoofActive: false
            });
        }

        if (!pathname.includes('tree')) {
            useViewerStore.setState({
                isHideAllSelectedTrees: false,
                isTreePerimeterToolActive: false,
                isMoveTreeActive: false,
                isAddTreeActive: false
            });
            viewerInstance.hideObject("SelTree", false);
            viewerInstance.showRoofSquirrel(false);
        }

        if (pathname.includes('modules')) {
            viewerInstance.setVisibleGroup(LAYER_OPTIONS.MODEL.TREE, false);
            useViewerStore.setState({isTreeLayerOn: false});
        } else {
            viewerInstance.setVisibleGroup(LAYER_OPTIONS.MODEL.TREE, true);
            useViewerStore.setState({isTreeLayerOn: true});
        }

        if (!pathname.includes('obstruction')) {
            useViewerStore.setState({
                isHideAllGhostObstructions: true,
                isMoveObstructionActive: false,
                isAddObstructionActive: false
            });

        }

        if (!pathname.includes('price-calculation')) {
            viewerInstance.toggleTreeMultiplierLabel(false);
            viewerInstance.toggleModuleMultiplierLabel(false);
            useViewerStore.setState({
                isTreeMultiplierLabelVisible: false,
                isModuleMultiplierLabelVisible: false,
            });
        }

        if (pathname.includes('price-calculation')) {
            viewerInstance.toggleTreeMultiplierLabel(true);
            // viewerInstance.toggleModuleMultiplierLabel(false);
            useViewerStore.setState({
                isTreeMultiplierLabelVisible: true,
                // isModuleMultiplierLabelVisible: false,
            });
        }

        if (pathname.includes('solar-access')) {
            viewerInstance.roofMeshArr.forEach((roof) => {
                const roofChildren = roof.children
                roofChildren.forEach((child) => {
                    if (child.name === 'shadePoint') {
                        child.visible = true
                    }
                })
            })
        }

        if (!pathname.includes('solar-access')) {
            viewerInstance.roofMeshArr.forEach((roof) => {
                const roofChildren = roof.children
                roofChildren.forEach((child) => {
                    if (child.name === 'shadePoint') {
                        child.visible = false
                    }
                })
            })
        }

        if (pathname.includes('obstruction')) {
            useViewerStore.setState({
               isHideAllGhostObstructions: true
            });

        }



        viewerInstance.setSelectType(selectType);
        viewerInstance.setMeasureMode(measureMode);
        viewerInstance.setAutoAlignMode(false);
        useViewerStore.setState({isTapandHold: false})
        useViewerStore.setState({isTabandHoldUp: false});
    }, [location])

    useEffect(()=>{
        if(loadingCompleted){
           if(selectedDesignIndex>=0 
            && designList[0]?.Design_Certification_Status 
            && designList[0]?.Design_Certification_Status !== "Not Certified" 
            && designList[0]?.Design_Certification_Status !== "Certified Design Override"
            && designList[0]?.Design_Certification_Status !== null)
            {
                const isUnlockedSite =  hasCapability("Pre_Installed_Certified") || hasCapability("Install_Change_Certified") || hasCapability("As_Built_Certified") || hasCapability("Certified_Design_Override") 
                if(!isUnlockedSite){
                    setTimeout(() => {
                        SceneViewer?.viewerAlert({
                            show: true,
                            title: <span style={{display: "flex"}}><IoIosLock
                                size={25}/> {designList[0]?.Design_Certification_Status}</span>,
                            message: <RestrictFinalisePopup
                                certification_status={designList[0]?.Design_Certification_Status}/>,
                            messageType: "success",
                            isModal: true
                        })
                    }, 5000);
                }
            }
            // useViewerStore.setState({loadingCompleted: false})
        }
    }, [loadingCompleted])


    useEffect(() => {
        viewerInstance.hideObject("GhostObst", true);
    }, [isGhostObstructionUpdated]);

    return (
        <div id={'canvasContainer'}></div>
    );
}

export default ThreeDViewer;
