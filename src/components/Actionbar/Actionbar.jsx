import React, {useContext, useEffect, useState} from 'react';
import {Button, Flex} from 'antd';
import {
    ArrowClockwise,
    ArrowCounterClockwise,
    ArrowLineUp,
    ArrowsCounterClockwise,
    Camera,
    DownloadSimple,
    FloppyDisk,
    Gear,
    UploadSimple,
    X
} from '@phosphor-icons/react';
import {UserContext} from '../../contexts/UserContext';
import {ViewerContext} from '../../contexts/ViewerContext';
import {useViewerStore} from '../../store/store';
import SingleModuleAlert from "../Modal/Modal-Content/SingleModuleAlert";
import FinaliseConfirm from "../Modal/Modal-Content/FinaliseConfirm";
import FinaliseConfirmationPopup from "../Modal/Modal-Content/FinaliseConfirmationPopup"
import RestrictFinalisePopup from "../Modal/Modal-Content/RestrictFinalisePopup"
import {CheckSingleModuleRoofs} from "../Three-JS-Viewer/Controllers/ModuleControl";
import { IoIosLock } from "react-icons/io";
const Actionbar = () => {

    const { SceneViewer } = useContext(ViewerContext);
    const { user, hasCapability } = useContext(UserContext);
    const isPushPullMode = useViewerStore((state) => state.isPushPullMode);

    const selRoofFaceArr = useViewerStore((state) => state.selRoofFaceArr);
    const {designList, selectedDesignIndex} = useViewerStore(state => state);
    const [isOpen, setIsOpen] = useState(true);
    const stage = sessionStorage.getItem('currentStage');
    const exportGltf = () => {
        SceneViewer.downloadGLTF();
    }

    const importGltf = () => {
        const gltfImport = document.getElementById('gltfImport');
        gltfImport.click();
    }


    const pushPullHandler = () => {


        if(isPushPullMode){
            SceneViewer.setPushPullMode(false);
            SceneViewer?.viewerAlert({
                show: true,
                title: "Push Pull Tool Exited",
                message: `Push Pull Tool has been exited.`,
                messageType: "info",
                isModal: false,
            });

            document.body.style.cursor = 'default';
        }
        else{
            SceneViewer.setPushPullMode(true);

            SceneViewer?.viewerAlert({
                show: true,
                title: "Push Pull Tool Active",
                message: `Select a Tree or Obstruction and drag to extrude height of tree or obstruction. Press 'Esc' to exit.`,
                messageType: "info",
                isModal: false,
            });
            document.body.style.cursor = 'grab';

        }


    };

    const importGLBFile = (e) => {
        SceneViewer.importGLBFile(e.target.files[0]);
    };

    const checkSelFaceArr = () => {
        const cloneFaceArr = [...selRoofFaceArr];
        cloneFaceArr.forEach(face => {
            face.moduleCount = face.children.filter(item => {
                return item.module
            }).length;
        });
        useViewerStore.setState({selRoofFaceArr: cloneFaceArr});
    };

    const clickSnapShot = () => {
        const canvas = SceneViewer.renderer.domElement;
        const dataURL = canvas.toDataURL('image/png');
        let a = document.createElement('a');
        a.href = dataURL
        a.download = 'oneDRAWScreenshot.png';
        a.click();
    };

    const handleUndo = () => {
        SceneViewer.setStep(-1);
        setTimeout(() => {
            checkSelFaceArr();
        }, 0);
    };

    const handleRedo = () => {
        SceneViewer.setStep(1)
        setTimeout(() => {
            checkSelFaceArr();
        }, 0);
    };

    const handleRefresh = () => {
        SceneViewer.refreshShade(false);
    };

    const checkFinaliseConfirmation = ()=>{
        if(designList[0]?.Design_Certification_Status 
            && designList[0]?.Design_Certification_Status !== "Not Certified" 
            && designList[0]?.Design_Certification_Status !== null)
            {
                if(hasCapability("Pre_Installed_Certified") 
                    || hasCapability("Install_Change_Certified") 
                    || hasCapability("As_Built_Certified") 
                    || hasCapability("Certified_Design_Override")){
                    if(designList[0]?.Design_Certification_Status!=="Certified Design Override"){
                        SceneViewer.viewerAlert({
                            show: true,
                            title: <span style={{display:"flex"}}><IoIosLock  size={25}/> {designList[0]?.Design_Certification_Status}</span>,
                            message: <FinaliseConfirmationPopup confirm={finaliseSave} certification_status={designList[0]?.Design_Certification_Status}/>,
                            messageType: "success",
                            isModal: true
                        })
                    }
                    else{
                        finaliseSave()   
                    }
                }else{
                    SceneViewer.viewerAlert({
                        show: true,
                        title: <span style={{display:"flex"}}><IoIosLock  size={25}/> {designList[0]?.Design_Certification_Status}</span>,
                        message: <RestrictFinalisePopup  certification_status={designList[0]?.Design_Certification_Status}/>,
                        messageType: "success",
                        isModal: true
                    })
                }
            }
            else{
                finaliseSave()
            }
       
    }

    const finaliseSave = () => {

        const roofs = CheckSingleModuleRoofs(SceneViewer.roofMeshArr);



        if (roofs.length > 0) {
            SceneViewer.viewerAlert({
                show: true,
                title: "Single Module Array",
                message: <SingleModuleAlert roofs={roofs}/>,
                messageType: "success",
                isModal: true
            })
        } else {
            SceneViewer.viewerAlert({
                show: true,
                title: "Save Design",
                message: <FinaliseConfirm/>,
                messageType: "success",
                isModal: true
            })
        }

    }

    return (
        <div className='toolbar actions'>
            {
                user? 
                    <Flex gap={15}>
                        
                        <Button
                            title={!isOpen?"Close Actionbar":"Open Actionbar"}
                            type='default'
                            size='large'
                            icon={isOpen ? <Gear size={28} weight='fill'/> : <X size={28} weight='bold'/>}
                            onClick={() => setIsOpen(!isOpen)}
                        />
                        
                        <Flex gap={5} hidden={isOpen}>
                            {hasCapability('Undo') && (
                                <Button
                                    title={"Undo"}
                                    type='default'
                                    size='large'
                                    icon={<ArrowCounterClockwise size={26} weight='fill'/>}
                                    onClick={handleUndo}
                                    property='StepUndo'
                                />
                            )}
                            {hasCapability('Redo') && (
                                <Button
                                    title={"Redo"}
                                    type='default'
                                    size='large'
                                    icon={<ArrowClockwise size={26} weight='fill'/>}
                                    onClick={handleRedo}
                                    property='StepRedo'
                                />
                            )}
                            {hasCapability('Download_GLB') && (
                                <Button
                                    title={"Download GLB File"}
                                    type='default'
                                    size='large'
                                    icon={<DownloadSimple size={26} weight='fill'/>}
                                    onClick={exportGltf}
                                />
                            )}
                            <Button
                                title={"Import GLB File"}
                                type='default'
                                size='large'
                                icon={<UploadSimple size={26} weight='fill'/>}
                                onClick={importGltf}
                            />
                            {hasCapability('Refresh_Shade') && (
                                <Button
                                    title={"Refresh Shade"}
                                    type='default'
                                    size='large'
                                    icon={<ArrowsCounterClockwise size={26} weight='fill'/>}
                                    onClick={handleRefresh}
                                />
                            )}
                            {hasCapability('Push_Pull Tool') && (
                                <Button
                                    title={"Push Pull Tool"}
                                    type={isPushPullMode ? 'primary' : 'default'}
                                    size='large'
                                    icon={<ArrowLineUp size={26} weight='fill'/>}
                                    id='pushPullToolBtn'
                                    onClick={pushPullHandler}
                                />
                            )}
                            {hasCapability('Snapshot') && (
                                <Button
                                    title={"Snapshot"}
                                    type='default'
                                    size='large'
                                    icon={<Camera size={26} weight='fill'/>}
                                    id='snapShotBtn'
                                    onClick={clickSnapShot}
                                />
                            )}
                            {
                            
                            ((hasCapability('Finalize') && stage && stage < 4) || 
                            (hasCapability('Finalize') && stage && stage >=4 && hasCapability('Stage_4_Post_Contract_Finalize')))
                             && <Button
                                title={"Save Design"}
                                    type='primary'
                                    size='large'
                                    icon={<FloppyDisk size={26} weight='fill'/>}
                                    onClick={checkFinaliseConfirmation}
                                >Finalize</Button> }
                            <input type='file' accept='.zip' onChange={importGLBFile} id='gltfImport' hidden/>

                        </Flex>
                    </Flex> 
                :""
            }
        </div>
    );
}

export default Actionbar;