import React, { useContext, useEffect } from 'react';
import {Button} from 'antd';
import {TbDeviceMobile, TbDeviceMobileRotated } from 'react-icons/tb';
import { Accordion, TabInput, Toggle } from '../../../components';
import { ViewerContext } from '../../../contexts/ViewerContext';
import { UserContext } from "../../../contexts/UserContext";
import { useViewerStore} from "../../../store/store";
import SpinAllAlert from "../../../components/Modal/Modal-Content/SpinAllAlert";
import {Select} from 'antd';
import MoveModuleByMeasurement from "../../../components/Modal/Modal-Content/MoveModuleByMeasurement";
import {GetSelModules} from "../../../components/Three-JS-Viewer/Controllers/ModuleControl";
import ModuleEditOptionsSection from "./ModuleEditOptionsSection";
import {ArrowsClockwise, BoundingBox, Ruler} from "@phosphor-icons/react";
import { SetDisplayShadePoints } from '../../../components/Three-JS-Viewer/Controllers/RefreshShade';
import TotalSystemEfficiency from '../../../components/Popup/Popup-Tabs/TotalSystemEfficiency';
import RoofInformationTable from '../../../components/Popup/Popup-Tabs/RoofInformationTable';

const ModuleProperties = () => {
    const {SceneViewer} = useContext(ViewerContext);

    const {hasCapability} = useContext(UserContext);
    const manualZone = useViewerStore((state) => state.manualZone)
    const moduleList = useViewerStore((state) => state.moduleList);
    const isRoofTagVisible = useViewerStore((state) => state.isRoofTagVisible)

    const activeModule = useViewerStore((state) => state.activeModule);

    const setbackInfoObject = useViewerStore((state) => state.setbackInfoObject);

    const moduleSolarAccess = useViewerStore(state => state.moduleSolarAccess);
    const setModuleSolarAccess = useViewerStore(state => state.setModuleSolarAccess);

    const moduleListSorted = moduleList.filter(m => m.w !== 0 && m.h !== 0);
    moduleListSorted.sort((a, b) => a.text.localeCompare(b.text));

    const antdCompatiableModuleList = moduleListSorted.map(m => ({text: m.text, value: m.text}));

    useEffect(() => {
        SceneViewer?.hideObject('ModuleTexture', moduleSolarAccess);
    }, [SceneViewer, moduleSolarAccess]);


    const selectModule = (e) => {
        if (manualZone) return;
        const {moveMode} = SceneViewer;
        if (moveMode) return;

        const selModule = moduleList.find(item => item.text === e);
        if (selModule === -1) {
            return;
        }

        useViewerStore.setState({activeModule: selModule});
        SceneViewer.setModulesSize(selModule);
    }


    const setModuleDir = dir => {
        if (manualZone) return;
        const {moveMode, pushMode} = SceneViewer;
        if (moveMode) return; //  || pushMode
        SceneViewer.setModuleSetting('dir', dir);
        const btnPort = document.getElementsByClassName('btnModulePort')[0];
        const btnLand = document.getElementsByClassName('btnModuleLand')[0];
        if (!btnPort || !btnLand) return;
        if (dir === 'port') {
            btnPort.classList.add('active');
            btnLand.classList.remove('active');
        } else if (dir === 'land') {
            btnPort.classList.remove('active');
            btnLand.classList.add('active');
        }
    }


    const onClickManualFillZone = e => {
        SceneViewer.setManualZone(!manualZone);
    }


   const handleMoveModuleByMeasurement = () => {
        //check if module is selected
        //if not selected show alert
       const selModules = GetSelModules(SceneViewer.moduleMeshArr);
       if (!selModules || !selModules.length){
           alert("Please select a module to move by measurement")
       }
       else {
           SceneViewer.viewerAlert({
               show: true,
               title: "Move Module by Measurement",
               message: <MoveModuleByMeasurement/>,
               messageType: "info",
               isModal: true
           })
       }



   }

   const setBoxSelectMode = () => {
       const selModules = GetSelModules(SceneViewer.moduleMeshArr);
       if (!selModules || !selModules.length){
           alert("Please select a module to begin box select mode")
       }
       else {
           SceneViewer.selectType = 'module'
           SceneViewer.setupSelectionBoxHelper('module')
       }

   }

    const toggleRoofTag = () => {
        SceneViewer.toggleRoofTag(!isRoofTagVisible);
        useViewerStore.setState({isRoofTagVisible: !isRoofTagVisible});
    }


    const spinAllModules = () => {
        //Call Alert Here
        SceneViewer.viewerAlert({
            show: true,
            title: "Alert : Spin All Modules Action",
            message: <SpinAllAlert/>,
            messageType: "warning",
            isModal: true
        })
    }

    return (
        <>
            <div className='tab__inner'>
               <ModuleEditOptionsSection/>
               <div className='tab__column'>
                
                <Accordion title='Show/Hide System Information' active={true} style={{fontSize: "3px"}}>
                    <div className='tab__column' style={{padding: "10px"}}>
                        <span className='tab__column--title'>Total System Efficiency</span>
                        <TotalSystemEfficiency/>
                        <span className='tab__column--title' style={{position: "relative", top: "20px"}}>Roof Information Table</span>
                        <RoofInformationTable/>
                    </div> 
                </Accordion>
               </div>
               
               

                {hasCapability('Edit_Module_Type') &&
                    <>
                        <div className={`tab__column ${manualZone ? 'disabled' : ''}`}>
                            <span className='tab__column--title'>Module Type</span>
                            {

                                <Select
                                    placeholder='Select Module Type'
                                    style={{width: '100%'}}
                                    value={activeModule?.text ?? ''}
                                    onChange={selectModule}
                                    options={antdCompatiableModuleList}
                                />
                            }
                        </div>

                        <div className={`tab__column ${manualZone ? 'disabled' : ''}`}>
                            <div className='tab__column'>
                                <div className='tab__flex justify-between'>
                                    <span className='tab__column--subtitle mb-0'>Orientation</span>
                                    <Button id={"modulePortDirBtn"} variant='btn-clear' size='btn-resize'
                                            className='orientation-btn btnModulePort'
                                            onClick={e => setModuleDir('port')}
                                            property='ModulePort'>
                                        <TbDeviceMobile size={24}/>
                                    </Button>
                                    <Button id={"moduleLandDirBtn"} variant='btn-clear' size='btn-resize'
                                            className='orientation-btn btnModuleLand active'
                                            onClick={e => setModuleDir('land')}
                                            property='ModuleLand'>
                                        <TbDeviceMobileRotated size={24}/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                }
                <div className={`tab__column`}>
                    <Button
                        icon={<Ruler size={18} />}
                        className={`w-full`} variant='btn-primary-outline' size='btn-md'
                            onClick={handleMoveModuleByMeasurement}>Move Module By Measurement</Button>
                    <br/>
                    <Button
                        icon={<BoundingBox size={18} />}
                        className={`w-full`} variant='btn-primary-outline' size='btn-md'
                            onClick={setBoxSelectMode}
                    >Box Select Mode</Button>
                </div>

                <div className='tab__column'>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Module Solar Access</span>
                        <Toggle
                            id={"hideModuleTexture"}
                            on={moduleSolarAccess}
                            onChange={(value) => {
                                setModuleSolarAccess(value);
                                SetDisplayShadePoints(SceneViewer, null);
                            }}
                            property='ModuleTexture'
                        ></Toggle>
                    </div>
                </div>
                <div className='tab__column'>
                <div className='tab__flex justify-between'>
                    <span className='tab__column--subtitle mb-0'>Show/Hide Roof Tag</span>
                    <Toggle
                        on={isRoofTagVisible}
                        onChange={toggleRoofTag}
                    />
                </div>
                </div>

                <div className={`tab__column`}>
                    <div className='tab__flex'>
                        <Button
                            icon={<ArrowsClockwise size={18} />}
                            id='spinAllModulesBtn'
                            type='default'
                            size='middle'
                            className='editor__control--finalize'
                            onClick={spinAllModules}
                        >
                            Rotate All Panels
                        </Button>
                    </div>
                </div>
                {/* <div className='tab__column setback'>
                    <span className='tab__column--title'>Setback Information</span>
                    <div className='tab__flex justify-between mb-2'>
                        <TabInput label='Eave' align='input-flex' initValue={setbackInfoObject?.eave || 0}
                                  className='two-column' property='SetbackEave' readOnly={true}/>
                        <TabInput label='Hip' align='input-flex' initValue={setbackInfoObject?.hip || 0}
                                  className='two-column' property='SetbackHip' readOnly={true}/>
                    </div>
                    <div className='tab__flex justify-between mb-2'>
                        <TabInput label='Ridge' align='input-flex' initValue={setbackInfoObject?.ridge || 0}
                                  className='two-column' property='SetbackRidge' readOnly={true}/>
                        <TabInput label='Rake' align='input-flex' initValue={setbackInfoObject?.rake || 0}
                                  className='two-column' property='SetbackRake' readOnly={true}/>
                    </div>
                    <div className='tab__flex justify-between mb-2'>
                        <TabInput label='Valley' align='input-flex' initValue={setbackInfoObject?.valley || 0}
                                  className='two-column' property='SetbackValley' readOnly={true}/>
                    </div>
                </div> */}
            </div>
        </>
    );
}

export default ModuleProperties;
