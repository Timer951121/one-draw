import React, {useContext, useEffect, useState} from 'react';
import {Toggle} from '../../../components';
import {ViewerContext} from "../../../contexts/ViewerContext";
import TreeEPCForm from "../../../components/TreeEPC/TreeEPCForm";
import {useViewerStore} from "../../../store/store";
import { GetRoundNum } from '../../../components/Three-JS-Viewer/Controllers/Common';


const CalculationProperties = () => {
    const {SceneViewer} = useContext(ViewerContext);

    const isTreeMultiplierLabelVisible = useViewerStore((state) => state.isTreeMultiplierLabelVisible)
    const isTreeLabelVisible = useViewerStore(state => state.isTreeLabelVisible);
    const isModuleLabelVisible = useViewerStore(state => state.isModuleMultiplierLabelVisible);
    const localAngIdeal = useViewerStore(state => state.localAngIdeal);
    const roofInfoArr = useViewerStore(state => state.roofInfoArr);
    
    const [roofMultipliers, setRoofMultipliers] = useState([]);
    const [isIdealMultiplierVisible, setIsIdealMultiplierVisible] = useState(false);

    const toggleIdealMultiplier = () => {
        setIsIdealMultiplierVisible(!isIdealMultiplierVisible);
    }
    
    const toggleTreeMultiplierVisibility = () => {
        SceneViewer.toggleTreeMultiplierLabel(!isTreeMultiplierLabelVisible);
        useViewerStore.setState({isTreeMultiplierLabelVisible: !isTreeMultiplierLabelVisible});
    }

    const toggleTreeNameLabel = () => {
        useViewerStore.setState({isTreeLabelVisible: !isTreeLabelVisible})
        SceneViewer.toggleTreeLabel();
    }

    const toggleModuleMultiplier = () => {
        if(!isModuleLabelVisible){
            SceneViewer.moveCameraToSiteMidpointView();
            SceneViewer.camera.zoom = 40;
            SceneViewer.camera.updateProjectionMatrix();
        }
        useViewerStore.setState({isModuleMultiplierLabelVisible: !isModuleLabelVisible})
        SceneViewer.toggleModuleMultiplierLabel(!isModuleLabelVisible);
    }

    useEffect(() => {
        const roofs = SceneViewer.roofs[0].faces;
        let ideal = [];
        roofs.forEach(roof => {
            const roofIdeal = localAngIdeal.find(item => item.tilt === roof.oriAng.tilt)?.ideal ?? 0;
            const roofMultiplier = roofInfoArr.find(item => item.roofFaceId === roof.roofFaceId)?.roofMultiplier;
            const roofNum = roofInfoArr.find(item => item.roofFaceId === roof.roofFaceId)?.roofNum;
            if(!roofMultiplier) return;
            ideal.push({
                roofNo: roofNum,
                roofIdeal: GetRoundNum(roofIdeal / 10000, 16),
                roofMultiplier: roofMultiplier?roofMultiplier:0
            });
            setRoofMultipliers(ideal);
        });
    },[roofInfoArr]);

    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text tab__title--flex">
                        Price Calculation
                    </span>
                </div>

                {/*EPC TOOL */}

                    {/* <span className='tab__column--title'>EPC Management Tool</span> */}
                    <TreeEPCForm/>

                <br/>

                {/* MULTIPLIERS - IDEAL, TREE and MODULES */}
                <div className='tab__column'>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Show Ideal Multipliers</span>
                        <Toggle
                            onChange={toggleIdealMultiplier}
                            on={isIdealMultiplierVisible}
                        >
                        </Toggle>
                    </div>
                    {isIdealMultiplierVisible && <div>
                        <span className='tab__column--subtitle mb-1'>Multipliers</span>
                        <div style={{ maxHeight: '290px', overflow: 'auto' }}>
                            <table className={"tab__table"} >
                                <thead>
                                    <tr
                                        style={{
                                            position: 'sticky',
                                            top: '0',
                                        }}
                                    >
                                        <th>Roof No</th>
                                        <th>Ideal</th>
                                        <th>Roof Avg.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roofMultipliers.map((ideal) => {
                                        return (
                                            <tr>
                                                <td>{ideal.roofNo}</td>
                                                <td>{GetRoundNum(ideal.roofIdeal, 6)}</td>
                                                <td>{GetRoundNum(ideal.roofMultiplier, 6)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <br/>
                    </div>}                    
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Show Tree Multiplier</span>
                        <Toggle
                            onChange={toggleTreeMultiplierVisibility}
                            property='TreeMultiplier'
                            on={isTreeMultiplierLabelVisible}
                        >
                        </Toggle>
                    </div>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Show Tree Label</span>
                        <Toggle
                            on={isTreeLabelVisible}
                            onChange={toggleTreeNameLabel}
                            property='treeNameLabel'>
                        </Toggle>
                    </div>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Show Module Multiplier</span>
                        <Toggle
                            onChange={toggleModuleMultiplier}
                            on={isModuleLabelVisible}
                        >
                        </Toggle>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CalculationProperties;