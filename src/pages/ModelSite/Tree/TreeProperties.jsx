import React, {useContext, useEffect, useState} from "react";
import {Splide, SplideSlide} from "@splidejs/react-splide";
import {FiCopy, FiTrash2} from "react-icons/fi";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {Toggle} from "../../../components";
import {treeList} from "../../../components/Three-JS-Viewer/Constants/TreeShape";
import {UserContext} from "../../../contexts/UserContext";
import { INCH, FOOT, METER, TREE, UnitContext } from "../../../contexts/UnitContext";
import { useSceneStore } from "../../../store/sceneStore";
import {Button, Flex, Select} from "antd";
import { GetRoundNum } from "../../../components/Three-JS-Viewer/Controllers/Common";
import {useViewerStore} from "../../../store/store";
import {ArrowsOutCardinal, Plus, SelectionAll} from "@phosphor-icons/react";
import SliderInput from "../../../components/SliderInput/SliderInput";
import {SHADE_CALCULATIONS, siteCalculationState} from "../../../services/siteCalculationState";

const TreeProperties = () => {

    const {SceneViewer} = useContext(ViewerContext);
    const {hasCapability} = useContext(UserContext);

    const {treeUnit, convertQuantityToUnit, convertTypeQuantityToUnit, renderUnit} = useContext(UnitContext);
    const selectedTrees = useSceneStore(state => state.selectedTrees);
    const isTreeLabelVisible = useViewerStore(state => state.isTreeLabelVisible);
    const toggleTreeLabel = ()=>  useViewerStore.setState({isTreeLabelVisible: !isTreeLabelVisible})
    const selectedTree = selectedTrees[0];

    const [height, setHeight] = useState(GetRoundNum(convertTypeQuantityToUnit(TREE, parseFloat(selectedTree?.userData.height ?? 0), METER), 2));
    const [crownDiameter, setCrownDiameter] = useState(GetRoundNum(convertTypeQuantityToUnit(TREE, selectedTree?.userData.crown_radius ?? 0, METER), 2));
    const [crownHeight, setCrownHeight] = useState(GetRoundNum(convertTypeQuantityToUnit(TREE, selectedTree?.userData.crown_height ?? 0, METER), 2));
    const [trunkRadius, setTrunkRadius] = useState(GetRoundNum(convertTypeQuantityToUnit(TREE, selectedTree?.userData.trunk_radius ?? 0, METER), 2));

    const isHideAllGhostTrees = useViewerStore(state => state.isHideAllGhostTrees);
    const isHideAllSelectedTrees = useViewerStore(state => state.isHideAllSelectedTrees);
    const isTreePerimeterToolActive = useViewerStore(state => state.isTreePerimeterToolActive);
    const isAddTreeActive = useViewerStore(state => state.isAddTreeActive);
    const isMoveTreeActive = useViewerStore(state => state.isMoveTreeActive);


    useEffect(() => {
        setHeight(GetRoundNum(convertTypeQuantityToUnit(TREE, parseFloat(selectedTree?.userData.height ?? 0), METER), 2));
        setCrownDiameter(GetRoundNum(convertTypeQuantityToUnit(TREE, (selectedTree?.userData.crown_radius ?? 0), METER), 2));
        setCrownHeight(GetRoundNum(convertTypeQuantityToUnit(TREE, selectedTree?.userData.crown_height ?? 0, METER), 2));
        setTrunkRadius(GetRoundNum(convertTypeQuantityToUnit(TREE, selectedTree?.userData.trunk_radius ?? 0, METER), 2));
    }, [selectedTrees, treeUnit]);

    const changeHeight = value => {
        SceneViewer?.setTreeProperty('height', convertQuantityToUnit(value, treeUnit, METER));
        setHeight(value);
    };

    const changeCrownDiameter = value => {
        SceneViewer?.setTreeProperty('crown_radius', convertQuantityToUnit(value, treeUnit, METER));
        setCrownDiameter(value);
    };

    const changeCrownHeight = value => {
        SceneViewer?.setTreeProperty('crown_height', convertQuantityToUnit(value, treeUnit, METER));
        setCrownHeight(value);
    };

    const changeTrunkRadius = value => {
        SceneViewer?.setTreeProperty('trunk_radius', convertQuantityToUnit(value, treeUnit, METER));
        setTrunkRadius(value);
    };

    const toggleTreeNameLabel = () => {
        toggleTreeLabel(); // Updates store value
        SceneViewer.toggleTreeLabel(); // Updates in view
    }

    const refreshShadeAfterChangingTreeDimensions = (selectType, value) => {

        if (selectedTrees.length === 0) return;
        /************ Tree actions Undo/Redo implementation begin*************/
        let oldValue = (selectType === 'TreeTotalHeight') ? height : (selectType === 'TreeCrownDiameter') ? crownDiameter
                        :(selectType === 'TreeCrownHeight')? crownHeight : (selectType === 'TreeTrunkRadius') ? trunkRadius : '';
        const selObj = [], originalValueArr = [], newValueArr = [];
        if(oldValue !== value) {
            selectedTrees.forEach(group => {
                selObj.push(group.obstId);
            });
            originalValueArr.push(convertQuantityToUnit(oldValue, treeUnit, METER));
            newValueArr.push(convertQuantityToUnit(value, treeUnit, METER));
            SceneViewer.addStep(selectType, selObj, originalValueArr, newValueArr);
            /************ Tree actions Undo/Redo implementation end*************/
        
            siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
            SceneViewer.refreshShade(false);
        }
    }

    let settingsTotalHeight;
    let settingsCrownHeight;
    let settingsCrownDiameter;
    let settingsTrunkRadius;

    switch (treeUnit) {
        case INCH:
            settingsTotalHeight = {min: 120, max: 1200, step: 1};
            settingsCrownHeight = {min: 12, max: 960, step: 1};
            settingsCrownDiameter = {min: 12, max: 960, step: 1};
            settingsTrunkRadius = {min: 12, max: 180, step: 1};
            break;
        case FOOT:
            settingsTotalHeight = {min: 10, max: 100, step: 0.1};
            settingsCrownHeight = {min: 1, max: 80, step: 0.1};
            settingsCrownDiameter = {min: 1, max: 80, step: 0.1};
            settingsTrunkRadius = {min: 1, max: 15, step: 0.1};
            break;
        case METER:
            settingsTotalHeight = {min: 3, max: 30.48, step: 0.01};
            settingsCrownHeight = {min: 0.3048, max: 24.4, step: 0.01};
            settingsCrownDiameter = {min: 0.3048, max: 24.4, step: 0.01};
            settingsTrunkRadius = {min: 0.3048, max: 4.572, step: 0.01};
            break;
    }

    const deselectAllTrees = () => {
        SceneViewer.treeGroup.children.forEach(tree => {
            tree.select = false

            useSceneStore.getState().removeSelectedTree(tree);

            tree.children[0].material.emissive.setHex(0x000000);
        });
    }

    useEffect(() => {
        if(isAddTreeActive===false) {
            deselectAllTrees();
        }
    }, [isAddTreeActive]);

    useEffect(() => {
        if(isMoveTreeActive===false) {
            deselectAllTrees();
        }
    }, [isMoveTreeActive]);

    const selectMethod = (method) => {
        SceneViewer.selectType = 'tree';

        if(method === "add") {
            //Remove Move mode
            useViewerStore.setState({isMoveTreeActive: false});
            SceneViewer.setMoveMode(false)

            //Enable Add mode
            useViewerStore.setState({isAddTreeActive: !isAddTreeActive});
            SceneViewer.setPushMode(!isAddTreeActive)
        }
        else if (method === "move") {

            if (selectedTrees.length === 0) {
                alert("Please select a Tree to Move")
                return
            }

            //Remove Add mode
            useViewerStore.setState({isAddTreeActive: false});
            SceneViewer.setPushMode(false)

            //Enable Move mode
            useViewerStore.setState({isMoveTreeActive: !isMoveTreeActive});
            SceneViewer.setMoveMode(!isMoveTreeActive)
        }
    };

    const setDeleteTree = (e) => {
        if (e.target.classList.contains("disabled")) return;

        /**********  Ghost tree change begin ********/        
        const newValueArr = [];
        const ghostTreeSteps = SceneViewer.stepArr.filter(step => step.key ==="GhostTree" );
        const olderValueArr = ghostTreeSteps[ghostTreeSteps.length -1]?.newer || [];

        selectedTrees.forEach(group => {
            newValueArr.push(group.obstId);
        });

        SceneViewer.addStep("GhostTree", '', olderValueArr, newValueArr);
        /**********  Ghost tree change end ********/

        SceneViewer.setTreeProperty("delete");
    };

    const onClickSelectAll = (e) => {
        if (e.target.classList.contains("disabled")) return;
        SceneViewer.selectAllTrees();
    };

    const onClickTree = (e, item) => {
        //add active class to selected tree
        const treeList = document.getElementsByClassName("carousel__img");
        for (let i = 0; i < treeList.length; i++) {
            treeList[i].classList.remove("active");
        }
        e.target.parentNode.classList.add("active");
         /*********** Tree type change begin ********/
        const selObj = [], originalValueArr = [], newValueArr = [];
        selectedTrees.forEach(group => {
            selObj.push(group.obstId);
            originalValueArr.push(group?.children[0]?.userData?.crownKey);
            newValueArr.push(item.cM);
        });
        SceneViewer.addStep("TreeShape", selObj, originalValueArr, newValueArr);
        /*********** Tree type change end *********/

        SceneViewer.setTreeProperty("shape", item);
    };

    const onClickCopy = () => {
        SceneViewer.setPushMode(true, true);
    };


    const antDCompatibleOptions = [
        {label: '150 ft', value: convertQuantityToUnit(150, FOOT, METER)},
        {label: '200 ft', value: convertQuantityToUnit(200, FOOT, METER)},
        {label: '250 ft', value: convertQuantityToUnit(250, FOOT, METER)},
    ]


    const roofSquirrelHandler = () => {
        SceneViewer.calculateRoofSquirrel()
    }

    const roofSquirrelRadiusHandler = (e) => {
        const value = antDCompatibleOptions.find(item => item.value === e).value;
        SceneViewer.updateRoofSquirrelRadius(value)
    }

    const onChangeHideAllGhostTrees = () => {
        SceneViewer.hideObject("GhostTree",!isHideAllGhostTrees);
        useViewerStore.setState({isHideAllGhostTrees: !isHideAllGhostTrees});
    }

    const onChangeHideSelectedTrees = () => {
        SceneViewer.hideObject("SelTree",!isHideAllSelectedTrees);
        useViewerStore.setState({isHideAllSelectedTrees: !isHideAllSelectedTrees});
    }

    const onChangeTreePerimeterTool = () => {
        useViewerStore.setState({isTreePerimeterToolActive: !isTreePerimeterToolActive});
        SceneViewer.showRoofSquirrel(!isTreePerimeterToolActive);
        document.getElementById('roofSquirrelCalculateContainer').classList.toggle('disabled');
    }


    const tree_Type = (
        <>
            <div className="tab__column tree-edit-mask">
                <span className="tab__column--title">Tree Type</span>
                <Splide
                    options={{
                        rewind: false,
                        width: "100%",
                        gap: "10px",
                        perPage: 3,
                        perMove: 1,
                    }}
                >
                    {treeList.map((item) => {
                        return (
                            <SplideSlide key={item.id}>
                                <Button
                                    type='text'
                                    className='carousel__img'
                                    onClick={(e) => onClickTree(e, item)}
                                >
                                    <img src={item.img} alt={item.alt} title={item.alt}/>
                                </Button>
                            </SplideSlide>
                        );
                    })}
                </Splide>
            </div>
        </>
    );
    const tree_Height = (
        <>
            <div className="tab__column tree-edit-mask">
                <span className="tab__title--text">Tree Properties</span>
                <span className="tab__column--subtitle">Height</span>

                <SliderInput
                    settings={settingsTotalHeight}
                    value={height}
                    unit={renderUnit(treeUnit)}
                    onChange={(value)=>changeHeight(value)}
                    onChangeComplete={(value) =>refreshShadeAfterChangingTreeDimensions("TreeTotalHeight", value)}
                />

                <span className="tab__column--subtitle">Crown Diameter</span>
                <SliderInput
                    settings={settingsCrownDiameter}
                    value={crownDiameter}
                    unit={renderUnit(treeUnit)}
                    onChange={changeCrownDiameter}
                    onChangeComplete={(value) =>refreshShadeAfterChangingTreeDimensions("TreeCrownDiameter", value)}
                />

                <span className="tab__column--subtitle">Crown Height</span>
                <SliderInput
                    settings={settingsCrownHeight}
                    value={crownHeight}
                    unit={renderUnit(treeUnit)}
                    onChange={changeCrownHeight}
                    onChangeComplete={(value) =>refreshShadeAfterChangingTreeDimensions("TreeCrownHeight", value)}
                />

                <span className="tab__column--subtitle">Trunk Radius</span>
                <SliderInput
                    settings={settingsCrownHeight}
                    value={trunkRadius}
                    unit={renderUnit(treeUnit)}
                    onChange={changeTrunkRadius}
                    onChangeComplete={(value) =>refreshShadeAfterChangingTreeDimensions("TreeTrunkRadius", value)}
                />

            </div>
        </>
    );

    const toggleTree = (
        <>
            <div className="tab__column tree-edit-mask">
                <Button
                    icon={<SelectionAll size={18} />}
                    id='selAllBtn'
                    type='default'
                    size='middle'
                    className='btnSelectAllTrees'
                    onClick={(e) => onClickSelectAll(e)}
                >
                    Select All Trees
                </Button>
                <span className="tab__spacer"></span>

                {
                    hasCapability('Toggle_Tree') &&
                    <>
                        <div className={"tab__flex justify-between"}>
                            <span className="tab__column--subtitle mb-0">Hide All Ghost Trees</span>
                            <Toggle
                                on={isHideAllGhostTrees}
                                onChange={onChangeHideAllGhostTrees}
                            />
                        </div>
                        <br/>

                        <div className="tab__flex justify-between">
                            <span className="tab__column--subtitle mb-0">Hide Selected Trees</span>
                            <Toggle
                                on={isHideAllSelectedTrees}
                                onChange={onChangeHideSelectedTrees}
                            />
                        </div>
                        <br/>
                        <div className='tab__flex justify-between'>
                            <span className='tab__column--subtitle mb-0'>Show Tree Label</span>
                            <Toggle
                                on={isTreeLabelVisible}
                                onChange={toggleTreeNameLabel}
                                property='treeNameLabel'>
                            </Toggle>
                        </div>
                    </>

                }


            </div>


            <div className='tab__column'>
                <div className='tab__flex justify-between mb-2'>
                    <span className='tab__column--subtitle mb-0'>Tree Perimeter Tool</span>
                    <Toggle
                        on={isTreePerimeterToolActive}
                        onChange={onChangeTreePerimeterTool}
                    />
                </div>


                <div id={"roofSquirrelCalculateContainer"} className='tab__column disabled'>
                    <div className='tab__flex hidden'>
                        <Select
                            options={antDCompatibleOptions}
                            onChange={roofSquirrelRadiusHandler}
                            defaultValue={antDCompatibleOptions[0].value}
                        />



                        <Button
                            title={'Calculates number of trees inside the selected perimeter'}
                            onClick={roofSquirrelHandler}
                            variant='btn-primary' size='btn-md'>

                            Calculate
                        </Button>
                    </div>
                </div>

            </div>

        </>
    );


    return (
        <>
            <div className="tab__inner">
                {/* DELETE */}
                <div className="tab__title">
                    <span className="tab__title--text">Tree</span>
                    {
                        hasCapability('Edit_Tree') && hasCapability('Edit_Tree_Remove') &&
                        <div className='tab__title--btns'>
                            <FiCopy onClick={onClickCopy}/>
                            {
                                hasCapability('Toggle Ghost Tree') &&
                                <FiTrash2 onClick={setDeleteTree}/>
                            }
                        </div>
                    }
                </div>


               {/* ADD, EDIT OR MOVE TREES */}
                {
                    hasCapability('Edit_Tree') &&
                    <div className="tab__column">
                        <Flex align='center' justify='center' gap={15}>
                            {hasCapability('Edit_Tree_Add') &&
                            <Button
                                icon={<Plus size={18}/>}
                                className={`${isAddTreeActive ? 'active' : ''}`}
                                id='btnTreeAdd'
                                onClick={() => selectMethod("add")}
                            >
                                Add
                            </Button>}
                            {hasCapability('Edit_Tree_Move') &&
                            <Button
                                icon={<ArrowsOutCardinal size={18}/>}
                                className={`${isMoveTreeActive ? 'active' : ''}`}
                                id='moveTreeModeBtn'
                                onClick={() => selectMethod("move")}
                            >
                                Move
                            </Button>}
                        </Flex>
                    </div>
                }

                {/* TREE TYPE and SIZE*/}
                {hasCapability('Edit_Tree') && hasCapability('Edit_Tree_Modify_Size') ? (
                    <>

                        {tree_Type}
                        {tree_Height}
                    </>
                ) : (
                    <>
                        <div className="tab__column tree-edit-mask disabled">
                            {tree_Type}
                        </div>
                        <div className="tab__column tree-edit-mask disabled">
                            {tree_Height}
                        </div>
                    </>
                )}

                {/* TOGGLE GHOST AND SELECTED TREES, TREE PERIMETER TOOL */}
                {
                    <>{toggleTree}</>
                }
            </div>
        </>
    );
};

export default TreeProperties;
