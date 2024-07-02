import {Button, Flex} from "antd";
import React, {useContext, useEffect} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {UserContext} from "../../../contexts/UserContext";
import {useViewerStore} from "../../../store/store";
import {GetSelModules, ModulePlacementStatusOk, ResetSelModuleArr} from "../../../components/Three-JS-Viewer/Controllers/ModuleControl";
import {ArrowsOutCardinal, Plus, Trash} from "@phosphor-icons/react";
import { showModulePlacementStatus } from "../../../helpers/featureFlags";

const ModuleEditOptionsSection=()=>{

    const {SceneViewer} = useContext(ViewerContext);

    const {hasCapability} = useContext(UserContext);

    const manualZone = useViewerStore((state) => state.manualZone)

    const isMoveModuleActive = useViewerStore((state) => state.isMoveModuleActive)
    const isAddModuleActive = useViewerStore((state) => state.isAddModuleActive)

    const modulePlacementStatus = useViewerStore((state) => state.modulePlacementStatus);

    const setDeleteModule = (e) => {
        if (manualZone) return;
        if (e.target.classList.contains('disabled')) return;
        SceneViewer.setModuleSetting('delete');
    }

    const onClickAdd = e => {
        if (manualZone) return;

        document.body.style.cursor = "default";
        useViewerStore.setState({isAddModuleActive: !isAddModuleActive, isMoveModuleActive: false})
        if(!isAddModuleActive===true){
            SceneViewer.selectType = 'module';
            if (e.target.classList.contains('disabled')) return;
            SceneViewer.setMoveMode(false);
            SceneViewer.setPushMode(true);
        } else {
            SceneViewer.setPushMode(false);
        }
    }

    const onClickMove = e => {
        if (manualZone) return;
        SceneViewer.selectType = 'module';
        if (e.target.classList.contains('disabled')) return;
        useViewerStore.setState({isMoveModuleActive: !isMoveModuleActive, isAddModuleActive: false})
        if(!isMoveModuleActive===true){
            //Check if module is selected
            const selModules = GetSelModules(SceneViewer.moduleMeshArr);
            if (!selModules || !selModules.length){
                alert("Please Select Modules to Move");
                useViewerStore.setState({isMoveModuleActive: false})
                SceneViewer.setMoveMode(false);
            } else {
                document.body.style.cursor = "move";
                SceneViewer.setPushMode(false);
                SceneViewer.setMoveMode(true);
            }
        } else {
            SceneViewer.setMoveMode(false);
            document.body.style.cursor = "default";
            ResetSelModuleArr(SceneViewer.moduleMeshArr);
        }
    }

    return(
        <>
            <div className='tab__title'>
                <span className='tab__title--text tab__title--flex'>Module Properties</span>
            </div>


            <div className={`tab__column ${manualZone ? 'disabled' : ''}`}>
                <Flex


                    align='center' justify='center' gap={15}>
                    {hasCapability('Edit_Module_Add') &&
                        <Button
                            icon={<Plus size={18}/>}
                            type='default'
                            size='middle'
                            id='addModuleBtn'
                            className={`${isAddModuleActive ? 'active' : ''}`}
                            // className='btnModuleAdd'
                            onClick={e => onClickAdd(e)}
                        >Add</Button>
                    }

                    {hasCapability('Edit_Module_Move') &&
                        <Button
                            icon={<ArrowsOutCardinal size={18}/>}
                            type='default'
                            size='middle'
                            id='moveModuleBtn'
                            className={`${isMoveModuleActive ? 'active' : ''}`}
                            onClick={e => onClickMove(e)}
                        >Move</Button>
                    }

                    {
                        hasCapability('Edit_Module_Remove') &&
                            <Button
                                icon={ <Trash size={20} />}
                                id={"moduleDeleteBtn"}
                                variant='btn-clear'
                                size='btn-resize'
                                onClick={setDeleteModule}
                                property='ModuleDel'
                            >

                                Delete
                            </Button>
                    }
                </Flex>

                {showModulePlacementStatus() && modulePlacementStatus !== ModulePlacementStatusOk &&
                    <div style={{color: '#ffffff', marginTop: 10}}>
                        Cannot place module at location: <span>{modulePlacementStatus}</span>
                    </div>
                }
            </div>
        </>
    )
}

export default ModuleEditOptionsSection;