import React, {useCallback, useContext, useEffect, useState} from "react";
import OutsideClickHandler from 'react-outside-click-handler';
import {
    AiFillCaretRight,
    AiFillEdit,
    AiOutlineHome,
    AiOutlineQuestionCircle,
    AiOutlineRotateLeft
} from 'react-icons/ai';
import {ViewerContext} from "../../contexts/ViewerContext";
import {useViewerStore} from "../../store/store";
import {ChangeObstDelete} from "../Three-JS-Viewer/Controllers/ObstructionControl";
import {SetupObstUI, SetupTreeGroup} from "../Three-JS-Viewer/Controllers/TransControl";
import {useLocation, useNavigate} from "react-router-dom";
import MoveModuleByMeasurement from "../Modal/Modal-Content/MoveModuleByMeasurement";
import {BiLocationPlus, BiMove, BiMoveHorizontal, BiRectangle} from "react-icons/bi";
import {RiDeleteBinLine, RiLayout4Line, RiPaintFill, RiDeleteBin2Line   } from "react-icons/ri";
import {MdContentCopy, MdOutlineViewModule, MdRoofing, MdOutlineClose } from "react-icons/md";
import {GiMoonOrbit} from "react-icons/gi";
import {FaTree} from "react-icons/fa";
import {IoBookmarkSharp} from "react-icons/io5";
import {TbBuildingBank, TbBuildingCommunity} from "react-icons/tb";
import {UserContext} from "../../contexts/UserContext";
import {GetSelModules} from "../Three-JS-Viewer/Controllers/ModuleControl";
import { useSceneStore } from "../../store/sceneStore";
import {Info} from "@phosphor-icons/react";

const ContextMenu = () => {

    //Global Context
    const {SceneViewer} = useContext(ViewerContext);
    const {user, hasCapability} = useContext(UserContext);
    const location = useLocation();
    const {pathname} = useLocation();
    const navigate = useNavigate();

    //Global States
    const isPointerOnObject = useViewerStore.getState().isPointerOnObject
    const pointerDownSelectedObjectType = useViewerStore.getState().pointerDownSelectedObjectType
    const pointerDownSelectedObject = useViewerStore.getState().pointerDownSelectedObject
    const treeCartItems = useViewerStore.getState().treeCartItems;

    //For Undo-redo actions
    const selectedTrees = useSceneStore(state => state.selectedTrees);


    //Local States
    const [anchorPoint, setAnchorPoint] = useState({x: 0, y: 0});
    const [showMenu, setShowMenu] = useState(false);
    const [subMenu, setSubMenu] = useState(false);
    const [contextMenuEvent, setContextMenuEvent] = useState(null);

    const modeCountPort = useViewerStore((state) => state.modeCountPort);
    const modeCountLand = useViewerStore((state) => state.modeCountLand);
    const modeCountBoth = useViewerStore((state) => state.modeCountBoth);

    const commonContextMenuOptions = [];

    const contextMenuTemplate =  {
        roof:[],
        obstruction:[],
        tree:[],
        modules:[],
        obstructionObjectContextMenu: [],
        roofObjectContextMenu: [],
        treeObjectContextMenu: [],
        moduleObjectContextMenu: [],
        pathwayObjectContextMenu: [],
        epcTouchContextMenu:[],
        epcContextMenu:[]
    };

    const [contextMenuItems, setContextMenuItems] = useState(contextMenuTemplate['roof']);


    const checkCapabilities = async() =>{

        contextMenuTemplate.treeObjectContextMenu = [
            {title: 'Ghost Tree', key: 'deleteSelectedTree', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Un-Ghost Tree', key: 'deleteSelectedTree', icon: <RiDeleteBin2Line/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Clone Tree', key: 'cloneSelectedTree', icon: <MdContentCopy/>, visible: hasCapability('Edit_Tree')},
            {title: 'Move Tree', key: 'moveSelectedTree', icon: <BiMove/>, visible: hasCapability('Edit_Tree_Move')},
        ];

        contextMenuTemplate.epcTouchContextMenu = [
            {title: 'Ghost Tree', key: 'deleteSelectedTree', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Un-Ghost Tree', key: 'deleteSelectedTree', icon: <RiDeleteBin2Line/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Ghost Tree And Add to Cart', key: 'ghostAddCartSelectedTree', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Remove from the cart', key: 'removeGhostedTreeFromTheCart', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Cancel Action', key: 'cancelAction', icon: <MdOutlineClose />, visible: hasCapability('Toggle Ghost Tree')},

        ];

        contextMenuTemplate.epcContextMenu = [
            {title: 'Ghost Tree And Add to Cart', key: 'ghostAddCartSelectedTree', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Remove from the cart', key: 'removeGhostedTreeFromTheCart', icon: <RiDeleteBinLine/>, visible: hasCapability('Toggle Ghost Tree')},
            {title: 'Clone Tree', key: 'cloneSelectedTree', icon: <MdContentCopy/>, visible: hasCapability('Edit_Tree')},
            {title: 'Move Tree', key: 'moveSelectedTree', icon: <BiMove/>, visible: hasCapability('Edit_Tree_Move')},
        ];

        contextMenuTemplate.moduleObjectContextMenu = [
            // {title: 'Select & Edit Module', key: 'editSelectedModule'},
            {title: 'Delete Module', key: 'deleteSelectedModule', icon: <RiDeleteBinLine/>, visible: hasCapability('Edit_Module_Remove')},
            {
                title: `Add Module`,
                key: 'addModules',
                icon: <MdOutlineViewModule/>,
                submenu: [
                    {title: `Portrait`, key: 'portAdd', icon: <TbBuildingBank/>},
                    {title: `Landscape`, key: 'landAdd', icon: <TbBuildingCommunity/>},
                ],
                visible: hasCapability('Add_Module')
            },
            {title: 'Spin Module', key: 'spinSelectedModule', icon: <AiOutlineRotateLeft/>, visible: hasCapability('Edit_Module_Add')},
            {title: 'Move Module', key: 'moveSelectedModule', icon: <BiMove/>, visible: hasCapability('Edit_Module_Move')},
            {title: 'Move Module by Measurement', key: 'moveSelectedModuleMeasurement', icon: <BiMove/>, visible: hasCapability('Edit_Module_Move')},
            {title: 'Box Select Module', key: 'boxSelectModule', icon: <BiRectangle/>, visible: hasCapability('Box_Select_Module')},

        ];

        contextMenuTemplate.obstructionObjectContextMenu.push(...[
            {title: 'Clone Obstruction', key: 'cloneObstruction', icon: <MdContentCopy/>, visible: hasCapability('Edit_Obstruction_Remove')},
            {title: 'Move Obstruction', key: 'moveSelectedObstruction', icon: <BiMove/>,  visible: hasCapability('Edit_Obstruction_Move') },
        ]);

        contextMenuTemplate.roofObjectContextMenu.push(...[
            {
                title: 'Clear Layout',
                key: 'clearLayout',
                icon: <RiDeleteBinLine/>, visible: true
            },
            {
                title: `Autofill Layout`,
                icon: <RiLayout4Line/>,
                submenu: [
                    {title: `Landscape :`, key: 'roofModuleLand'},
                    {title: `Portrait :`, key: 'roofModulePort'},
                    {title: `Both :`, key: 'roofModuleBoth'},
                ], visible: true
            },
            {
                title: `Mark Building`,
                icon: <IoBookmarkSharp/>,
                submenu: [
                    {title: `Primary`, key: 'buildingModuleOn', icon: <TbBuildingBank/>},
                    {title: `Accessory`, key: 'buildingModuleOff', icon: <TbBuildingCommunity/>},
                ], visible: true
            },
            {
                title: `Add Module`,
                key: 'addModules',
                icon: <MdOutlineViewModule/>,
                submenu: [
                    {title: `Portrait`, key: 'portAdd', icon: <TbBuildingBank/>},
                    {title: `Landscape`, key: 'landAdd', icon: <TbBuildingCommunity/>},
                ], visible: hasCapability('Add_Module')
            }
        ]);


        if (hasCapability('Orbit')) {
            commonContextMenuOptions.push({title: 'Orbit ( Shift+O )', key: 'orbit', icon: (<GiMoonOrbit/>), visible: true});
        }
        if (hasCapability('Pan')) {
            commonContextMenuOptions.push({title: 'Pan ( Shift+P )', key: 'pan', icon: (<BiMoveHorizontal/>), visible: true});
        }
        if (hasCapability('Default_Position')) {
            commonContextMenuOptions.push({title: 'Default Position ( Shift+H )', key: 'defaultPosition', icon: <AiOutlineHome/>, visible: true});
        }
        if (hasCapability('Box_Select_Tree')) {
            commonContextMenuOptions.push({title: 'Box Select Tree ( Alt +T )', key: 'boxSelectTree', icon: <BiRectangle/>, visible: true});
        }

        if (hasCapability('Add_Obstructions')) {
            commonContextMenuOptions.push({title: 'Add Obstruction', key: 'addObstruction', icon: <MdRoofing/>, visible: true});
        }
        if (hasCapability('Add_Tree')) {
            commonContextMenuOptions.push({title: 'Add Tree', key: 'addTree', icon: <FaTree/>, visible: true});
        }
        if (hasCapability('Add_Module')) {
            commonContextMenuOptions.push({title: 'Add Module', key: 'addModule', icon: <MdOutlineViewModule/>, visible: hasCapability('Add_Module')});
        }

        if (hasCapability('Toggle_Ghost_Obstructions')) {
            contextMenuTemplate.obstructionObjectContextMenu.push({title: 'Ghost Obstruction', key: 'deleteObstruction', icon: <RiDeleteBinLine/>, visible: true});
        }

        if (hasCapability('Toggle_Shingle')) {
            contextMenuTemplate.roofObjectContextMenu.push({title: 'Change Roof Style', key: 'changeRoofShingle', icon: <RiPaintFill/>, visible: true});
        }

        if (hasCapability('Mark_Questionable_Roof') || hasCapability('Mark Questionable Roof')) {
            contextMenuTemplate.roofObjectContextMenu.push(...[
                {title: 'Set Questionable Roof', key: 'setQuestionable', icon: <AiOutlineQuestionCircle/>, visible: true},
                {title: 'Unset Questionable Roof', key: 'unsetQuestionable', icon: <AiOutlineQuestionCircle/>, visible: true},
            ]);
        }

        if (hasCapability('Toggle Pathways')) {
            contextMenuTemplate.pathwayObjectContextMenu.push({title: 'Toggle Pathway', key: 'toggleSelectedPathway', icon: <RiDeleteBinLine/>, visible: true});
        }


        contextMenuTemplate.roof = [
            ...commonContextMenuOptions,
            {title: 'Show Lat/Long', key: 'showLatLong', icon: <BiLocationPlus/>, visible: true},
        ];
        contextMenuTemplate.obstruction = [
            ...commonContextMenuOptions,
            {title: 'Edit Obstruction', key: 'editObstruction', icon: <AiFillEdit/>, visible: hasCapability('Edit_Obstruction_Add')},
        ];
        contextMenuTemplate.tree = [
            ...commonContextMenuOptions,

            {title: 'Edit Tree', key: 'editTree', icon: <AiFillEdit/>, visible: hasCapability('Edit_Tree')},
        ];
        contextMenuTemplate.modules = [
            ...commonContextMenuOptions,
        ];
    };

    const handleContextMenu = useCallback(
        (event) => {
            const isTapandHold = useViewerStore.getState().isTapandHold;
            if (event.button === 2 || isTapandHold) {
                const canvas = document.getElementById("canvasContainer");
                event.preventDefault();
                setContextMenuEvent(event);
                const menuWidth = 200; // change this to match the actual width of your menu
                const menuHeight = 250; // change this to match the actual height of your menu
                let x =  event.pageX;
                let y = event.pageY;

                //adjust position if menu goes beyond canvas
                if(x + menuWidth > canvas.offsetWidth){
                    x = canvas.offsetWidth - menuWidth;
                }
                if(y + menuHeight > canvas.offsetHeight){
                    y = canvas.offsetHeight - menuHeight;
                }


                setAnchorPoint({
                    x: x,
                    y: y-60
                })
                setTimeout(() => {
                    const objectType = useViewerStore.getState().pointerDownSelectedObjectType
                    if(isTapandHold && objectType !== "tree") {
                        setShowMenu(false);
                        return
                    }
                    setShowMenu(true);
                }, 200)
            }else{
                return
            }
        },
        [setShowMenu, setAnchorPoint]
    );


    const setCustomContextMenuSelectedObstruction = () => {
        let obj = useViewerStore.getState().pointerDownSelectedObject
        let obstId = obj.obstId
        SceneViewer.obstId = obstId
        return obstId
    }


    useEffect(() => {
        if(user?.user_Id){
            const pathname = location.pathname

            checkCapabilities();

            if (isPointerOnObject) {
                if (pointerDownSelectedObjectType === 'obst') {
                    setContextMenuItems(contextMenuTemplate['obstructionObjectContextMenu'])
                    const obstMeshArr = SceneViewer.obstGroup.children.map(c => c.children[0].children[0].children[0]);
                    obstMeshArr.forEach((obst) => {

                        const pointerDownSelectedObject = useViewerStore.getState().pointerDownSelectedObject;
                        if (pointerDownSelectedObject && obst.obstId === pointerDownSelectedObject.obstId && obst.delStatus) {

                            SceneViewer.viewerAlert({
                                show: true,
                                title: <div className={"center-wrapper-with-gap"}>
                                    <Info size={32} />

                                    <span>Selected Obstruction is Ghosted</span>
                                </div>,
                                message: "",
                                type: "Info",
                                isModal: false
                            });

                        }

                    })

                } else if (pointerDownSelectedObjectType === 'roof') {
                    // navigate('/configure/roof')
                    setContextMenuItems(contextMenuTemplate['roofObjectContextMenu'])
                } else if (pointerDownSelectedObjectType === 'tree') {
                    if (pathname.includes("price-calculation")){
                        //Toggle Ghosted Tree Cart Items
                        const isTapandHold = useViewerStore.getState().isTapandHold;
                        let treeExist = treeCartItems.find(tree=>tree.obstId === pointerDownSelectedObject.obstId);                       
                        if(isTapandHold){
                            if(treeExist){
                                contextMenuTemplate.epcTouchContextMenu.forEach((menuItem)=>{
                                    if(menuItem.title === 'Ghost Tree And Add to Cart' || menuItem.title === 'Ghost Tree' || menuItem.title === 'Un-Ghost Tree'){
                                        menuItem.visible = false;
                                    }
                                    if(menuItem.title === 'Remove from the cart'){
                                        menuItem.visible = true;
                                    }
                                });
                            }else{
                                const allDelStatusTrue = SceneViewer.selTreeArr.every(group => group.delStatus === true);
                                const idSet = new Set(SceneViewer.selTreeArr.map(obj => obj.obstId));
                                const commonObjects = treeCartItems.some(obj => idSet.has(obj.obstId));
                                contextMenuTemplate.epcTouchContextMenu.forEach((menuItem)=>{
                                    if(menuItem.title === 'Remove from the cart' || menuItem.title === 'Un-Ghost Tree'){
                                        menuItem.visible = false;
                                    }
                                    if(allDelStatusTrue && menuItem.title === 'Un-Ghost Tree'){
                                        menuItem.visible = true;
                                    }
                                    if(allDelStatusTrue && menuItem.title === 'Ghost Tree'){
                                        menuItem.visible = false;
                                    }
                                    if(commonObjects && (menuItem.title === 'Un-Ghost Tree' || menuItem.title === 'Ghost Tree')){
                                        menuItem.visible = false;
                                    }
                                });
                            }
                            setContextMenuItems(contextMenuTemplate['epcTouchContextMenu'])

                        }else{
                        if(treeExist){
                            contextMenuTemplate.epcContextMenu.forEach((menuItem)=>{
                                if(menuItem.title === 'Ghost Tree And Add to Cart'){
                                    menuItem.visible = false;
                                }
                                if(menuItem.title === 'Remove from the cart'){
                                    menuItem.visible = true;
                                }
                            });
                        }else{
                            contextMenuTemplate.epcContextMenu.forEach((menuItem)=>{
                                if(menuItem.title === 'Remove from the cart'){
                                    menuItem.visible = false;
                                }
                                if(menuItem.title === 'Ghost Tree And Add to Cart'){
                                    menuItem.visible = true;
                                }
                            });
                        }

                        setContextMenuItems(contextMenuTemplate['epcContextMenu'])
                        }
                    }else{
                        const allDelStatusTrue = SceneViewer.selTreeArr.every(group => group.delStatus === true);
                        if(allDelStatusTrue){
                            contextMenuTemplate.treeObjectContextMenu.forEach((menuItem)=>{
                                if(menuItem.title === 'Ghost Tree'){
                                    menuItem.visible = false;
                                }
                                if(menuItem.title === 'Un-Ghost Tree'){
                                    menuItem.visible = true;
                                }
                            });
                        }else{
                            contextMenuTemplate.treeObjectContextMenu.forEach((menuItem)=>{
                                if(menuItem.title === 'Ghost Tree'){
                                    menuItem.visible = true;
                                }
                                if(menuItem.title === 'Un-Ghost Tree'){
                                    menuItem.visible = false;
                                }
                            });
                        }
                        setContextMenuItems(contextMenuTemplate['treeObjectContextMenu'])
                    }
                } else if (pointerDownSelectedObjectType === 'module') {
                    // navigate('/configure/modules')
                    setContextMenuItems(contextMenuTemplate['moduleObjectContextMenu'])
                } else if (pointerDownSelectedObjectType === 'pathway') {
                    setContextMenuItems(contextMenuTemplate['pathwayObjectContextMenu'])
                } else if (pointerDownSelectedObjectType === null) {
                    setShowMenu(false)
                    useViewerStore.setState({isPointerOnObject: false})
                }
            } else {
                if (pathname.includes("roof")) {
                    setContextMenuItems(contextMenuTemplate['roof'])
                } else if (pathname.includes("obstruction")) {
                    setContextMenuItems(contextMenuTemplate['obstruction'])
                } else if (pathname.includes("tree")) {
                    setContextMenuItems(contextMenuTemplate['tree'])
                } else if (pathname.includes("modules")) {
                    setContextMenuItems(contextMenuTemplate['modules'])
                }
            }
        }


    }, [isPointerOnObject, pointerDownSelectedObjectType, pointerDownSelectedObject, pathname, user,SceneViewer]);

    const showSubmenu = (event, index) => {
        let menus = contextMenuItems;

        menus.map((item, index_item) => {

            item['is_active'] = index === index_item;

            return item;
        })

        setSubMenu([...menus]);
    }

    const hideSubmenu = (event, index) => {
        let menus = contextMenuItems;

        menus.map((item, index_item) => {
            item['is_active'] = false;

            return item;
        })

        setSubMenu([...menus]);
    }


    const handleClick = useCallback(() => {
        if (showMenu) {
            setShowMenu(false)
            useViewerStore.setState({isPointerOnObject: false})
        }

    }, [showMenu, isPointerOnObject]);

    useEffect(() => {
        const rendererCanvas = document.getElementById("canvasContainer")


        rendererCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault()
        })

        rendererCanvas.addEventListener('closeContextMenu', (e) => {
            setShowMenu(false)
        })

        rendererCanvas.addEventListener("click", handleClick);
        rendererCanvas.addEventListener("pointerup", handleContextMenu);

        return () => {
            rendererCanvas.removeEventListener("click", handleClick);
            rendererCanvas.removeEventListener("pointerup", handleContextMenu);
        };
    }, [handleClick, handleContextMenu]);

    const depthlevel = 0;


    const handleContextMenuClick = (e) => {
        const isTapandHold = useViewerStore.getState().isTapandHold;
        switch (e.target.getAttribute('name')) {
            case 'orbit':
                SceneViewer.setOrbitControlsMode('orbit');
                if (SceneViewer.helper !== null) {
                    SceneViewer.removeSelectionBoxHelper()
                }
                useViewerStore.setState({editorControlMode: 'orbit'})
                break
            case 'pan':
                SceneViewer.setOrbitControlsMode('pan');
                useViewerStore.setState({editorControlMode: 'pan'})
                break
            case 'boxSelectTree':
                SceneViewer.setupSelectionBoxHelper('tree')
                break
            case 'boxSelectModule':
                SceneViewer.selectType = 'module'
                SceneViewer.setupSelectionBoxHelper('module')
                break
            case 'showLatLong':
                SceneViewer.alertSelectedLatLongPoints(contextMenuEvent);
                break
            case 'addObstruction':
                if (!pathname.includes("obstruction")) {
                    navigate('/configure/obstruction')
                    setTimeout(() => {
                        document.getElementById('addObstBtn').click();
                    }, 100)
                } else {
                    document.getElementById('addObstBtn').click();
                }
                break
            case 'addTree':
                if (!pathname.includes("tree")) {
                    navigate('/configure/tree')
                    setTimeout(() => {
                        document.getElementById("btnTreeAdd").click()
                    }, 100)
                } else {
                    document.getElementById("btnTreeAdd").click()
                }
                break
            case 'clearScene':
                document.getElementById('clearSceneBtn').click();
                break
            case 'defaultPosition':
                document.getElementById('defaultPositionBtn').click();
                break
            case 'editObstruction':
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Select Obstruction",
                    message: "Click on Obstruction to Edit",
                    type: "Info",
                    isModal: true
                })

                document.getElementById('editObstBtn').click();
                break
            case 'editTree':
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Select Tree",
                    message: "Click on Tree to Edit",
                    type: "Info",
                    isModal: true
                })
                document.getElementById('editTreeBtn').click();
                break
            case 'moveObstruction':
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Move Obstruction",
                    message: "Click on Obstruction or set of Obstructions to Move",
                    type: "Info",
                    isModal: true
                })
                document.getElementById('moveObstBtn').click();
                break
            case 'addModule':
                if (!pathname.includes("modules")) {
                    navigate('/configure/modules')
                    setTimeout(() => {
                        document.getElementById('addModuleBtn').click()
                    }, 100)
                } else {
                    document.getElementById('addModuleBtn').click()
                }


                break
            case 'deleteObstruction':
                setCustomContextMenuSelectedObstruction()
                useViewerStore.setState({isGhostObstructionUpdated: !useViewerStore.getState().isGhostObstructionUpdated})
                ChangeObstDelete(SceneViewer)

                break
            case 'moveSelectedObstruction':
                if (!pathname.includes("obstruction")) {
                    navigate('/configure/obstruction')
                    setTimeout(() => {
                        let obstID = setCustomContextMenuSelectedObstruction()
                        SetupObstUI(SceneViewer, obstID)
                        document.getElementById('moveObstBtn').click();
                    }, 100)
                } else {
                    let obstID = setCustomContextMenuSelectedObstruction()
                    SetupObstUI(SceneViewer, obstID)
                    document.getElementById('moveObstBtn').click();
                }
                break
            case 'moveSelectedTree':
                if (!pathname.includes("tree")) {
                    navigate('/configure/tree')
                    setTimeout(() => {
                        let obstID = setCustomContextMenuSelectedObstruction()
                        SetupTreeGroup(SceneViewer, obstID, true)
                        document.getElementById('moveTreeModeBtn').click();
                    }, 100)
                } else {
                    let obstID = setCustomContextMenuSelectedObstruction()
                    SetupTreeGroup(SceneViewer, obstID, true);
                    document.getElementById('moveTreeModeBtn').click();
                }
                break
            case 'cloneObstruction':
                if (!pathname.includes("obstruction")) {
                    navigate('/configure/obstruction')
                    setTimeout(() => {
                        let obstID = setCustomContextMenuSelectedObstruction()
                        SetupObstUI(SceneViewer, obstID)
                        SceneViewer.setPushMode(true, true);
                    }, 100)
                } else {
                    let obstID = setCustomContextMenuSelectedObstruction()
                    SetupObstUI(SceneViewer, obstID)
                    SceneViewer.setPushMode(true, true);
                }
                break
            case 'cloneSelectedTree':
                if (!pathname.includes("tree")) {
                    navigate('/configure/tree')
                    setTimeout(() => {
                        let obstID = setCustomContextMenuSelectedObstruction()
                        SetupTreeGroup(SceneViewer, obstID, true)
                        SceneViewer.setPushMode(true, true);
                    }, 100)
                } else {
                    let obstID = setCustomContextMenuSelectedObstruction()
                    SetupTreeGroup(SceneViewer, obstID, true)
                    SceneViewer.setPushMode(true, true);
                }
                break
            case 'deleteSelectedTree':
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

                if(isTapandHold){
                    useViewerStore.setState({isTapandHold: false});
                    useViewerStore.setState({isTabandHoldUp: false});             
                }
                SceneViewer.deselectAllSelectedObjectsAndEndTask();
                break
            case 'ghostAddCartSelectedTree':
                SceneViewer.addToCart();
                break
            case 'removeGhostedTreeFromTheCart':
                SceneViewer.removeTreeFromCart();
                if(isTapandHold){
                    useViewerStore.setState({isTapandHold: false});
                    useViewerStore.setState({isTabandHoldUp: false});
                }
                SceneViewer.deselectAllSelectedObjectsAndEndTask();
                break
            case 'deleteSelectedModule':
                SceneViewer.setModuleSetting('delete');
                break
            case 'spinSelectedModule':
                const selModules = GetSelModules(SceneViewer.moduleMeshArr)
                selModules.forEach((module) => {
                    const currentDir = module.dir;

                    if (currentDir === "port" || currentDir === "both") {
                        SceneViewer.setModuleSetting('dir', 'land');
                    } else {
                        SceneViewer.setModuleSetting('dir', 'port');
                    }
                })


                break
            case 'moveSelectedModule':
                if (!pathname.includes("modules")) {
                    navigate('/configure/modules')
                    setTimeout(() => {
                        document.getElementById('moveModuleBtn').click();
                    }, 100)
                } else {
                    document.getElementById('moveModuleBtn').click();
                }

                break
            case "changeRoofShingle":
                if (!pathname.includes("roof")) {
                    navigate('/configure/roof')
                    setTimeout(() => {
                        document.getElementById("roofShingleTabIcon").click()
                    }, 100)
                } else {
                    document.getElementById("roofShingleTabIcon").click()

                }
                break
            case "clearLayout":
                const roof = SceneViewer.roofMeshArr.find(r => r.roofFaceId === SceneViewer.preSelRoofId);
                if (roof) {
                    SceneViewer.setClearFaceModule(roof);
                }
                break
            case "toggleSelectedPathway":
                SceneViewer.togglePathway()
                break
            case "moveSelectedModuleMeasurement":
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Move Module by Measurement",
                    message: <MoveModuleByMeasurement/>,
                    messageType: "info",
                    isModal: true
                })
                break
            case "roofModuleLand":
                SceneViewer.setRoofModuleDir('land');
                break
            case "roofModulePort":
                SceneViewer.setRoofModuleDir('port');
                break
            case "roofModuleBoth":
                SceneViewer.setRoofModuleDir('both');
                break
            case "buildingModuleOn":
                SceneViewer.setBuildingModule(false);
                break
            case "buildingModuleOff":
                SceneViewer.setBuildingModule(true);
                break
            case "setQuestionable":
                SceneViewer.setQuestionable();
                break
            case "unsetQuestionable":
                SceneViewer.unsetQuestionable();
                break
            case "portAdd":
                if (!pathname.includes("modules")) {
                    navigate('/configure/modules')
                    setTimeout(() => {

                        document.getElementById('addModuleBtn').click()
                        SceneViewer.setModuleSetting('dir', 'port');
                    }, 100)
                } else {
                    document.getElementById('addModuleBtn').click()
                    SceneViewer.setModuleSetting('dir', 'port');
                }
                break
            case "landAdd":
                if (!pathname.includes("modules")) {
                    navigate('/configure/modules')
                    setTimeout(() => {

                        document.getElementById('addModuleBtn').click()
                        SceneViewer.setModuleSetting('dir', 'land');

                    }, 100)
                } else {
                    document.getElementById('addModuleBtn').click()
                    SceneViewer.setModuleSetting('dir', 'land');
                }
                break
            case "cancelAction":
                useViewerStore.setState({isTapandHold: false});
                useViewerStore.setState({isTabandHoldUp: false});
                SceneViewer.deselectAllSelectedObjectsAndEndTask();
                break
            default: break


        }
        setShowMenu(false);
    }
    useEffect(()=>{
        if(showMenu){
            setShowMenu(false)
        }
    },[pathname])

    return (
        <>
            {showMenu ? (
                <OutsideClickHandler
                    onOutsideClick={(e) => {
                        const isTapandHold = useViewerStore.getState().isTapandHold;
                        if (e.button !== 2 && !isTapandHold) {
                            setShowMenu(false);
                            SceneViewer.deselectAllSelectedObjectsAndEndTask()
                        }

                    }}
                >
                    <ul
                        onContextMenu={(e) => e.preventDefault()}
                        id="context-menu"
                        className="context"
                        style={{
                            top: anchorPoint.y,
                            left: anchorPoint.x,
                        }}
                    >
                        {contextMenuItems.map((item, index) => {
                            return (
                                item.submenu && item.submenu.length > 0 ? (
                                    item.visible &&
                                    <li
                                        className="context__item sub-menu"
                                        key={index}
                                        depthlevel={depthlevel}
                                    >
                                        <button
                                            name={item.key}
                                            // onClick={handleContextMenuClick}
                                            className="context__toggle "
                                            onMouseEnter={(event) => showSubmenu(event, index)}
                                            onMouseLeave={(event) => hideSubmenu(event, index)}
                                            aria-haspopup="menu"
                                            aria-expanded={subMenu ? "true" : "false"}
                                        >
                                            {item.icon && <i name={item.key} className='context__icon'>{item.icon}</i>}
                                            {item.title}
                                            <AiFillCaretRight/>
                                            {(item['is_active']) && (
                                                <div className="context__submenu--wrapper">
                                                    <ul className="context__submenu">
                                                        {item.submenu.map((subitem, index) => {
                                                            return (
                                                                <li
                                                                    className="context__item"
                                                                    key={index}
                                                                    name={subitem.key}
                                                                    depthlevel={depthlevel + 1}
                                                                    onClick={handleContextMenuClick}
                                                                >
                                                                    {
                                                                        subitem.icon &&
                                                                        <i name={subitem.key}
                                                                           className='context__icon'>{subitem.icon}</i>

                                                                    }
                                                                    {subitem.title}

                                                                    {
                                                                        subitem.title === "Landscape :" && <> {modeCountLand} </>
                                                                    }

                                                                    {
                                                                        subitem.title === "Portrait :" && <> {modeCountPort} </>
                                                                    }

                                                                    {subitem.title === "Both :" && <> {modeCountBoth} </>}
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                ) : (
                                    item.visible && <li className="context__item" name={item.key} key={index}
                                        onClick={handleContextMenuClick}>
                                        {item.icon &&
                                            <i name={item.key} key={index} className='context__icon'>{item.icon}</i>}
                                        {item.title}
                                    </li>
                                )
                            )
                        })}
                    </ul>
                </OutsideClickHandler>
            ) : (
                <></>
            )}
        </>
    );
};

export default ContextMenu;