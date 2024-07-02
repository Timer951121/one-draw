import * as THREE from "three";
import {PMREMGenerator, TextureLoader} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {CSS2DObject, CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import {FBXLoader} from "three/addons/loaders/FBXLoader";
import {defaults} from "../Constants/Default";
import {ChangeTreeDelete} from "../../Three-JS-Viewer/Controllers/ObstructionControl";

import {
    RotateCamera,
    SetCameraAngle,
    SetCameraView,
    SetCompassDeg,
    SetInitCamRotVal,
    SetTopView
} from "../Controllers/CameraControl";
import {
    DownloadGLTF,
    EmptyGroup,
    ExportGen,
    getCenterPoint,
    GetClickObj,
    GetDateVal,
    GetMousePos,
    GetParentTool,
    isMobile,
    isModuleMesh,
    SetMatEmissive,
    SetVisibleGroup
} from "../Controllers/Common";
import {ChangeMeshMaterial, ResetWallMeshArr, SetWallMeshArr, SetWallMeshOBB} from "../Controllers/MeshControl";
import {
    GetPlane,
    LoadModelJson,
    LoadModelXML,
    LoadPlane,
    LoadStreetView,
    Obstruction_Tree_Initial_Setup,
    testMesh
} from "../Controllers/Loader";
import {
    SelectAllTrees,
    SetTreeTransArr,
    SetupObstUI,
    SetupTreeGroup,
    TransChange,
    TransDown,
    TransUp
} from "../Controllers/TransControl";
import {
    ChangeObstAngle,
    ChangeObstDelete,
    ChangeObstDiameter,
    ChangeObstHeight,
    ChangeObstLength,
    ChangeObstRadius,
    ChangeObstShape,
    ChangeObstSides,
    ChangeObstWidth,
    ChangeSelectedTreeShape,
    ChangeTreePos,
    ChangeTreeSize,
    CheckDragableObst,
    HideObject,
    PutDragObst,
    SetDragObst,
    SetObstVPos,
    ToggleSelectedTreeDelete,
} from "../Controllers/ObstructionControl";
import {SetCloneVirObj, SetCopyVirObj, SetVirMeshPos} from "../Controllers/PushControls";
import {
    AddAutoAlignPoint,
    AddPointLine,
    CreateLineMesh,
    DrawAutoAlignLine,
    DrawLine,
    ResetLineMesh,
    ShowLineSnapSwitch
} from "../Controllers/LineControl";
import {CheckSunTimePlay, LoadSunGroup, SetSunGroupPos} from "../Sun-Vector-Path/LoadSun";
import {DragMapCustom, FetchMapImage, SetMapCustomSize, ViewAlertLatLon} from "../Controllers/MapControl";
import {RefreshShade, SetDisplayShadePoints} from '../Controllers/RefreshShade';
import {AddStep, SetStep} from "../Controllers/StepControl";
import {
    DeleteModule,
    GetPosModuleDown,
    GetSelModules,
    InitModulePush,
    ModulePlacementStatusOk,
    ReadyTransModules,
    ResetSelModuleArr,
    SetBtnModule,
    SetBuildingModule,
    SetClearFaceModule,
    SetModuleArr,
    SetModuleDisplay,
    SetModuleOriPos,
    SetSelModuleArr,
    SetVirModuleSize,
    timeModuleDelay,
    TransModule,
    UpdateSelModuleArr
} from "../Controllers/ModuleControl";
import {useViewerStore} from "../../../store/store";
import SelectionBox from "../Box-Select/SelectionBox";
import {SetFlatRoofProperty, SetupFlatRoof} from "../Controllers/FlatRoofControl";
import {ShowSelectRoof} from "../Controllers/RoofSelectControl";
import {SelectionHelper} from "three/addons/interactive/SelectionHelper";
import {CreatePlaneRoof} from "../Controllers/PlaneRoofControls";
import RoofSquareTable from "../../Modal/Modal-Content/RoofSquareTable";
import {SetTogglePathwayValue} from "../Controllers/PathwayControl";
import {ClearModuleEmissive, SelectBoxModule, SetBoxModulesPos} from "../Box-Select/ModuleBoxControl";
import React from "react";
import QuestionableRoof from "../../Modal/Modal-Content/QuestionableRoof";
import JSZip from "jszip";
import siteService, {getEagleViewToken} from "../../../services/siteService";
import {getEagleViewXMLFile} from "../../../services/eagleViewXMLService";
import moduleTextureForMeasureLayout from "../../../assets/img/textures/Measure-Layout-Module.jpg";
import sleep from "../../../helpers/sleep";
import {useSceneStore} from "../../../store/sceneStore";
import {getPathname, getPathnameIncludes} from "../../../helpers/getPathname";
import {isIpadDevice} from "../../../helpers/isIpadDevice";
import {LoadingContext} from "../../../store/loadingMessageStore";
import TreeCartForm from "../../Tree-Cart/TreeCartForm";
import {MODULE_GRAPH, siteCalculationState} from "../../../services/siteCalculationState";
import {logger} from "../../../services/loggingService";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment";

export const dateToday = new Date(), year = dateToday.getFullYear(), dateFirst = new Date("01/01/" + year); // , timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const mobileDevice = isMobile();
var resizeTimeout;

export class Viewer {

    isViewerInSplitMode = false;

    linePosArr = [];
    crownMapArr = [];
    meshArr = [];
    roofMeshArr = [];
    edgeMeshArr = [];
    selTreeArr = [];
    wallMeshArr = [];
    obstMeshArr = [];
    nodeArr = [];
    terrainArr = [];
    stepArr = [];
    moduleMeshArr = [];
    flatFrooEditLabel = [];
    pathwayMeshArr = [];
    selTypeMeshArr = [];
    sunInfo = {
        date: GetDateVal(dateToday),
        lat: 0,
        lon: 0,
        zone: 0,
        time: dateToday.getHours() + dateToday.getMinutes() / 60,
        elevation: 0,
    };
    tabInfo = 'Roof Properties';
    terrainView = true;
    mapView = true;
    moduleDir = 'port';
    flagModulePathway = true;
    boxPos2D = {s: {}, e: {}};

    camPos3D = {x: 0, y: 100, z: 80};

    compassHeading = 0;
    stepNum = -1;
    stepMax = -1;
    disLineSnap = 1.5;

    viewerMountRef = null;

    selectionBox = null
    helper = null

    isObjectSelectedForPushPullTool = false;

    objectSelectedForPushPullTool = null;

    maxObstructionHeight = 20

    moveModuleState = undefined;

    roadNearPoint = undefined;


    //Constructor
    constructor() {


        const canvasContainer = document.getElementById("canvasContainer"), {
            clientWidth,
            clientHeight
        } = canvasContainer;

        this.cSize = {w: clientWidth, h: clientHeight};

        this.scene = new THREE.Scene();

        window.viewer = this;

        this.drawMode = false;
        this.autoAlignMode = false;
        this.autoScaleParams = {};


        this.camera = new THREE.OrthographicCamera(this.cSize.w / -2, this.cSize.w / 2, this.cSize.h / 2, this.cSize.h / -2, 1, 1000);
        this.camera.zoom = 8;


        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.setSize(this.cSize.w, this.cSize.h);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.zIndex = 0;
        this.renderer.sortObjects = false;


        this.cssLabelrenderer = new CSS2DRenderer({
            preserveDrawingBuffer: true,
        });
        this.cssLabelrenderer.setSize(this.cSize.w, this.cSize.h);
        this.cssLabelrenderer.domElement.style.position = 'absolute';
        this.cssLabelrenderer.domElement.style.top = '0';
        this.cssLabelrenderer.domElement.style.zIndex = 1;


        canvasContainer.appendChild(this.cssLabelrenderer.domElement);
        canvasContainer.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.cssLabelrenderer.domElement);

        this.controls.maxDistance = 120;
        this.controls.minDistance = 5;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.09
        this.controls.minZoom = 0.5
        //max zoom


        this.controls.mouseButtons = {LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: null}
        this.controls.saveState()


        //Compass Controller
        this.controls.addEventListener('change', (e) => {
            //Dont change compass if pan
            const editorControlMode = useViewerStore.getState().editorControlMode;
            if (editorControlMode === 'pan') return;
            SetCompassDeg(this.camera, this);
        })

        //Scene Environment
        this.pmremGenerator = new PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        this.neutralEnvironment = this.pmremGenerator.fromScene(new RoomEnvironment()).texture;
        this.scene.environment = this.neutralEnvironment;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 0.5;


        //Add Light
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
        this.scene.add(this.ambientLight);


        //Setup Mesh Group
        this.totalGroup = new THREE.Group();
        this.scene.add(this.totalGroup);
        this.sunGroup = new THREE.Group();
        this.lineGroup = new THREE.Group();
        this.modelGroup = new THREE.Group();
        this.boundGroup = new THREE.Group();
        this.roofGroup = new THREE.Group();
        this.treeGroup = new THREE.Group();
        this.obstGroup = new THREE.Group();
        this.treeLabelGroup = new THREE.Group();
        this.guideLineGroup = new THREE.Group();
        this.roofTagGroup = new THREE.Group();
        this.roofTagGroup.name = 'roofTagGroup';
        this.roofTagGroup.visible = false;

        this.roofIDTriangleGroup = new THREE.Group();
        this.roofIDTriangleGroup.name = 'roofIDTriangleGroup';
        this.roofIDTriangleGroup.visible = false;

        this.treeTagGroup = new THREE.Group();

        this.treeLabelGroup.name = 'treeLabelGroup';
        this.treeLabelGroup.visible = true

        this.treeTagGroup.name = 'treeTagGroup'
        this.treeTagGroup.visible = false

        this.totalGroup.add(this.sunGroup, this.lineGroup, this.guideLineGroup, this.modelGroup, this.boundGroup, this.roofTagGroup, this.treeTagGroup, this.roofIDTriangleGroup);
        this.modelGroup.add(this.roofGroup, this.treeGroup, this.obstGroup, this.treeLabelGroup);

        this.testMesh = testMesh.clone();
        this.testMesh.visible = false;
        this.totalGroup.add(this.testMesh);

        //Transform Controls
        this.transform = new TransformControls(this.camera, this.cssLabelrenderer.domElement);
        this.transform.showY = false;
        this.transform.setMode('translate');
        this.transform.size = 0.6;
        this.scene.add(this.transform);

        this.transform.addEventListener('change', (e) => TransChange(e, this));
        this.transform.addEventListener('mouseDown', (e) => TransDown(e, this));
        this.transform.addEventListener('mouseUp', (e) => TransUp(e, this));

        this.visibleInfo = {roof: true, tree: true, obst: true, roofLine: true, modules: true};


        //Render Plane (Floor Geometry)
        LoadPlane(this);
        Obstruction_Tree_Initial_Setup(this);
        this.initGuideLineGroup();

        LoadSunGroup(this.sunGroup);
        CreateLineMesh(this);

        //Map Coordinate (Latitude and Longitude) Object
        this.mapCoordinates = {latitude: null, longitude: null}


        //Roof Squirrel

        //Radius is 150 feet
        const radius = 44.72


        const geometry = new THREE.CircleGeometry(radius, 50);
        const material = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.4});
        const circle = new THREE.Mesh(geometry, material);
        circle.position.y = 2

        circle.name = 'roofSquirrelCircle'

        circle.visible = false


        //render on top of everything
        circle.renderOrder = 1000
        material.depthTest = false
        material.depthWrite = false

        circle.rotateX(-Math.PI / 2)

        this.totalGroup.add(circle)

        //Hidden  Plane Mesh for Transformation
        this.planeMesh = GetPlane({x: 1000, y: 1000}, true);
        this.planeMesh.position.y = -0.1;
        this.planeMesh.name = 'plane';
        this.totalGroup.add(this.planeMesh);

        this.animate();

        const container = document.getElementById('canvasContainer');
        if (mobileDevice) {
            container.addEventListener('touchstart', this.onMouseDown);
            container.addEventListener('touchmove', this.onMouseMove);
            container.addEventListener('touchend', this.onMouseUp);
        } else {
            container.addEventListener('pointerdown', this.onMouseDown);
            container.addEventListener('pointermove', this.onMouseMove);
            container.addEventListener('pointerup', this.onMouseUp);
        }
    }


    viewerAlert = (
        {
            show = true,
            title = "",
            message = "",
            messageType = "",
            isModal = false
        }
    ) => {
        useViewerStore.setState({
            viewerAlert: {
                show: show,
                title: title,
                message: message,
                messageType: messageType,
                isModal: isModal
            }
        })
    }

    removeViewerAlert = () => {
        useViewerStore.setState({
            viewerAlert: {
                show: false,
                isModal: false
            }
        })
    }

    getSite = async () => {
        const loadingContext = new LoadingContext();
        loadingContext.setMessage({message: 'Fetching Site Data...'});

        try {
            const eagleViewToken = await getEagleViewToken();

            const oppID = sessionStorage.getItem('OppurtunityId');
            const siteJson = await siteService.postSiteById(oppID, eagleViewToken);
            const site = JSON.parse(siteJson);
            window.sessionStorage.setItem("sitejson", siteJson);

            if (site === null) {
                logger.log("Eagle View XML site")
                loadingContext.setMessage({message: 'Pulling data from Eagle View XML ...'});

                const xmlData = await getEagleViewXMLFile(oppID, eagleViewToken)

                if (xmlData === null) {
                    this.viewerAlert({
                        show: true,
                        title: "Data Error",
                        message: "No design data found. Please check again later",
                        messageType: "warning",
                        isModal: true
                    })
                } else {
                    loadingContext.setMessage({message: 'Drawing Site Objects...'});

                    await LoadModelXML(this, xmlData)
                }
            } else {
                loadingContext.setMessage({message: 'Drawing Site Objects...'});

                await LoadModelJson(this, site)
            }
        } catch (e) {
            logger.error(e);
            this.viewerAlert({
                show: true,
                title: "Loading Error",
                message:
                    <>
                        <p className={"theme-based-text-color"}>Something went wrong while loading the site, Please try
                            again
                            later or Refresh the Browser</p>
                        <p className={"theme-based-text-color"}>Error: {e.message}</p>
                    </>
                , messageType: "error",
                isModal:
                    true
            })
        } finally {
            loadingContext.dispose();
        }
    }

    updateSunPos(type, value) {
        if (type === 'time') {
            this.sunInfo.time = value;
        }
        SetSunGroupPos(this.sunGroup, this.sunInfo);
    }

    updateSunPath(type, value) {
        if (type === 'date') {
            const dateNew = new Date(dateFirst);
            dateNew.setDate(value);
            this.sunInfo.date = GetDateVal(dateNew);
        }
        SetSunGroupPos(this.sunGroup, this.sunInfo);
    }

    showSunPathLine = (value) => {
        const sunPath = this.sunGroup.children[1];
        if (sunPath) sunPath.visible = value;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (!this.camera || !this.renderer) return;
        this.renderer.render(this.scene, this.camera);

        this.cssLabelrenderer.render(this.scene, this.camera);
        this.controls.update();
        if (this.autoRotate) RotateCamera(this);
        if (this.selectType === 'sun') CheckSunTimePlay(this);
        const conTarget = this.controls.target;

        this.camera.lookAt(conTarget.x, conTarget.y, conTarget.z);
    }


    setCameraView = (viewMode, home) => {
        SetCameraView(this, viewMode, home);
    }


    setCameraAngle = (rot) => {
        SetCameraAngle(this, rot)
    }

    setCameraZoom = (dir) => {
        this.camera.zoom = Math.max(6, this.camera.zoom - dir);
        this.camera.updateProjectionMatrix()
    }

    disableControls = () => {
        this.controls.enabled = false;
    }

    enableControls = () => {
        this.controls.enabled = true;
    }

    setupSelectionBoxHelper = (boxSelectType) => {
        document.body.style.cursor = 'crosshair'
        useViewerStore.setState({isBoxSelectMode: true})
        this.disableControls()
        this.selectionBox = new SelectionBox(this.camera, this.scene);
        this.helper = new SelectionHelper(this.cssLabelrenderer, 'selectBox');
        this.selectType = boxSelectType
    }

    removeSelectionBoxHelper = () => {
        document.body.style.cursor = 'default'
        this.helper.dispose();
        this.enableControls()
        useViewerStore.setState({isBoxSelectMode: false})
        this.helper = null
        this.selectionBox = null
    }


    onMouseDown = e => {
        e.preventDefault()
        if (mobileDevice || isIpadDevice()) {
            const meshType = GetClickObj(e, [...this.meshArr], this.camera, this.cSize);
            if (getPathnameIncludes('price-calculation') && meshType?.object?.meshType === "tree") {
                this.buttonPressTimer = setTimeout(() => {
                    useViewerStore.setState({isTapandHold: true})
                }, 500);
            }
        }
        this.upPos = null;
        if (this.downPos) return;
        const {posX, posY} = GetMousePos(e);
        this.downPos = {x: posX, y: posY};

        const isPushPullMode = useViewerStore.getState().isPushPullMode

        if (isPushPullMode) {
            const interInfo = GetClickObj(e, [...this.meshArr], this.camera, this.cSize);
            if (interInfo && interInfo.object && interInfo.object.isMesh && interInfo.object.meshType === 'obst') {

                document.body.style.cursor = 'grabbing'
                this.objectSelectedForPushPullTool = interInfo.object
                this.isObjectSelectedForPushPullTool = true
                if (!getPathnameIncludes('obstruction')) {
                    this.navigate('/configure/obstruction')
                }

                setTimeout(() => {
                    const newObstId = interInfo.object.obstId
                    SetupObstUI(this, newObstId);
                }, 100)


            } else if (interInfo && interInfo.object && interInfo.object.isMesh && interInfo.object.meshType === 'tree') {

                if (this.hasCapability && this.hasCapability('Edit_Tree_Move')) {
                    document.body.style.cursor = 'grabbing'
                    this.objectSelectedForPushPullTool = interInfo.object
                    this.isObjectSelectedForPushPullTool = true


                    if (!getPathnameIncludes('tree')) {
                        this.navigate('/configure/tree')
                    }


                    setTimeout(() => {
                        const newObstId = interInfo.object.obstId
                        SetupTreeGroup(this, newObstId, true);
                    }, 100)
                }
            }
            return
        }


        const isBoxSelectMode = useViewerStore.getState().isBoxSelectMode

        if (isBoxSelectMode) {
            this.selectionBox.startPoint.set(
                (posX / this.cSize.w) * 2 - 1,
                -(posY / this.cSize.h) * 2 + 1,
                0.5);

            this.boxPos2D.s = {x: posX, y: posY};
            const pointerDownSelectedObject = useViewerStore.getState().pointerDownSelectedObject;
            const selectedModule = GetSelModules(this.moduleMeshArr);


            if (this.selectType === 'module') SetBoxModulesPos(this, selectedModule[0]);
            SetMatEmissive(this.selectionBox.collection, this.selectType, 'collection');
            return;
        }

        if (GetParentTool(e)) return;

        if (isIpadDevice() && this.selectType === 'roof') {
            const interInfo = GetClickObj(e, [...this.pathwayMeshArr], this.camera, this.cSize);
            if (interInfo && interInfo.object.meshType === 'pathway') {
                //confirm if the user wants to toggle the pathway
                window.confirm("Are you sure you want to toggle the clicked pathway?") && SetTogglePathwayValue(this, interInfo.object.pathwayId)
            }
        }


        if (this.viewMode === '3d') {
            this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
            if (this.selectType === 'obst' && this.obstId && this.moveMode) {
                this.dragObst = CheckDragableObst(e, this);
                if (this.dragObst && this.dragObst.obstId === this.obstId) this.controls.enabled = false;
            } else if (this.measureMode) {
                const interInfo = GetClickObj(e, [...this.roofMeshArr, ...this.wallMeshArr, this.planeMesh], this.camera, this.cSize);
                this.drawMode = true;
                AddPointLine(this, interInfo.point, interInfo.object.roofFaceId);
            } else if (this.selectType === 'module') {
                SetObstVPos(this.obstGroup);
                if (this.moveMode) {
                    const interInfo = GetClickObj(e, [...this.roofMeshArr], this.camera, this.cSize);
                    this.posModuleDown = GetPosModuleDown(interInfo, this.moduleMeshArr);
                    this.moveModuleState = ReadyTransModules(this);
                }
                this.mouseModuleStatus = 'down';
            }
        } else {
            this.controls.maxPolarAngle = 0.01;
            const interInfo = GetClickObj(e, [this.planeMesh], this.camera, this.cSize);
            const manualZone = useViewerStore.getState().manualZone;
            if (this.measureMode || this.createRoofMode || manualZone) {
                this.drawMode = true;
                AddPointLine(this, interInfo.point);
            } else if (this.mapCoordinates && this.mapCoordinates.longitude && !this.isViewerInSplitMode && this.selectType !== 'surface') {
                ViewAlertLatLon(this, interInfo.point);
            }
        }
        if (this.selectType === 'mapCustom') {
            if (this.moveMode) {
                const flagDownMap = GetClickObj(e, [this.mapCustom], this.camera, this.cSize);
                if (!flagDownMap) return;
                const interPlane = GetClickObj(e, [this.planeMesh], this.camera, this.cSize);
                this.posPlaneDown = interPlane.point;
                const curPosX = this.mapCustomWrapper.position.x,
                    curPosY = this.mapCustomWrapper.position.z;
                this.posMapDown = {
                    x: curPosX ? parseInt(curPosX) : 0,
                    z: curPosY ? parseInt(curPosY) : 0
                };
            } else if (this.autoAlignMode) {
                const interPlane = GetClickObj(e, [this.mapCustom], this.camera, this.cSize);
                this.drawMode = true;
                AddAutoAlignPoint(this, interPlane.point);
            }
        }
    }

    onMouseMove = e => {
        e.preventDefault()

        const isPushPullMode = useViewerStore.getState().isPushPullMode


        const {posX, posY} = GetMousePos(e);

        if (isPushPullMode && this.isObjectSelectedForPushPullTool) {
            this.controls.enabled = false;
            document.body.style.cursor = 'grabbing';

            if (this.objectSelectedForPushPullTool.meshType === 'obst') {
                const height = this.objectSelectedForPushPullTool.height

                if (e.movementY > 0) {
                    //Decrease height
                    this.setObstHeight(height - 0.1)
                } else if (e.movementY < 0 && height <= 6.096) {
                    //Increase height

                    //just make height 6.096
                    if (height + 0.1 > 6.096) {
                        this.setObstHeight(6.096)
                        return
                    }
                    this.setObstHeight(height + 0.1)
                }
            } else {
                if (this.hasCapability && this.hasCapability('Edit_Tree_Move')) {
                    const height = this.selTreeArr[0].totalH;

                    if (e.movementY > 0) {
                        //Decrease height
                        this.setTreeProperty('height', height - 0.1)
                    } else if (e.movementY < 0 && height <= 30.48) {
                        //Increase height

                        //just make height 6.096
                        if (height + 0.1 > 30.48) {
                            this.setTreeProperty('height', 30.48)
                            return
                        }
                        this.setTreeProperty('height', height + 0.1)
                    }
                }
            }
        }

        const isBoxSelectMode = useViewerStore.getState().isBoxSelectMode;

        if (isBoxSelectMode) {
            if (this.helper.isDown) {

                SetMatEmissive(this.selectionBox.collection, this.selectType, 'collection', 'move');

                this.selectionBox.endPoint.set(
                    (posX / this.cSize.w) * 2 - 1,
                    -(posY / this.cSize.h) * 2 + 1,
                    0.5);

                this.boxPos2D.e = {x: posX, y: posY};
                const allSelected = this.selectionBox.select();

                //select meshType module only
                const moduleSelected = this.selectionBox.select().filter(mesh => isModuleMesh(mesh));
                const firstModule = moduleSelected[0];

                if (this.selectType === 'module') SelectBoxModule(this, firstModule);
                SetMatEmissive(allSelected, this.selectType, 'allSelected', 'move');
            }
        }


        if (this.selectType === 'mapCustom' && this.moveMode && this.posMapDown && this.posPlaneDown) {
            const interPlane = GetClickObj(e, [this.planeMesh], this.camera, this.cSize);
            DragMapCustom(this, interPlane.point);
        }

        if (GetParentTool(e)) return;
        if (this.dragObst) {
            SetDragObst(e, this);
            return;
        }
        if (this.pushMode) {
            SetVirMeshPos(this, e);
            return;
        }
        if (this.selectType === 'module') {
            if (this.posModuleDown) TransModule(e, this, this.moveModuleState);
            if (this.mouseModuleStatus === 'down') {
                this.mouseModuleStatus = 'drag';
            }
        }

        if (this.drawMode) {
            if (this.autoAlignMode) {
                const interPlane = GetClickObj(e, [this.mapMesh], this.camera, this.cSize);
                if (interPlane) DrawAutoAlignLine(this, interPlane.point);
            } else {
                const meshArr = this.viewMode === '2d' ? [this.planeMesh] : [this.mapMesh, ...this.meshArr];
                const interInfo = GetClickObj(e, meshArr, this.camera, this.cSize);
                DrawLine(this, interInfo.point);
            }
        }
    }

    onMouseUp = e => {
        e.preventDefault()
        if (mobileDevice || isIpadDevice()) {
            clearTimeout(this.buttonPressTimer);
        }
        const isTapandHold = useViewerStore.getState().isTapandHold
        if (isTapandHold) useViewerStore.setState({isTabandHoldUp: true})
        const {posX, posY} = GetMousePos(e);
        var dragDis = 0;
        if (this.downPos) {
            dragDis = Math.abs(posX - this.downPos.x) + Math.abs(posY - this.downPos.y);
        }
        this.downPos = null;
        if (this.upPos) return;
        this.upPos = {x: posX, y: posY};

        const isPushPullMode = useViewerStore.getState().isPushPullMode

        if (isPushPullMode) {
            if (isPushPullMode && this.isObjectSelectedForPushPullTool) {
                this.controls.enabled = true
                document.body.style.cursor = 'grab'
                this.isObjectSelectedForPushPullTool = false
            }
            return;
        }
        // ON RIGHT CLICK
        if (e.button === 2 || isTapandHold) {

            const isTreeLayerVisible = useViewerStore.getState().isTreeLayerOn

            let arrayForRaycast = []

            if (isTreeLayerVisible) {
                arrayForRaycast = this.meshArr
            } else {
                //traverse and remove meshType tree
                //also remove obst.delStatus === true
                arrayForRaycast = this.meshArr.filter(mesh => {
                    return mesh.meshType !== 'tree'
                })
            }

            const isHideAllGhostObstructions= useViewerStore.getState().isHideAllGhostObstructions

            if(isHideAllGhostObstructions){
                arrayForRaycast = arrayForRaycast.filter(mesh => {
                    return mesh.meshType !== 'obst' || mesh.delStatus !== true
                })
            }



            const clickObj = GetClickObj(e, arrayForRaycast, this.camera, this.cSize),
                meshType = clickObj?.object?.meshType;


            var pointerDownSelectedObject = null, isPointerOnObject = false, pointerDownSelectedObjectType = null
            if (meshType === "obst" || meshType === "tree" || meshType === "module" || meshType === "roof" || meshType === "pathway") {


                pointerDownSelectedObject = clickObj.object;
                isPointerOnObject = true;
                pointerDownSelectedObjectType = meshType
                this.selectType = meshType;
                if (meshType === "obst") {
                    this.tabInfo = 'Obstruction Properties'
                } else if (meshType === "roof") {
                    this.preSelRoofId = clickObj.object.roofFaceId;
                    const modeCount = clickObj.object.userData.moduleCount || {port: 0, land: 0, both: 0};
                    this.selectRightClickRoof();
                    useViewerStore.setState({
                        modeCountPort: modeCount.port,
                        modeCountLand: modeCount.land,
                        modeCountBoth: modeCount.both
                    });
                    this.tabInfo = 'Roof Properties'
                } else if (meshType === "tree" && isTreeLayerVisible) {
                    this.tabInfo = 'Tree Properties'
                } else if (meshType === "module") {
                    this.mouseModuleStatus = 'down'
                } else if (meshType === "pathway") {
                    this.mouseModuleStatus = 'down'
                }
            }
            useViewerStore.setState({
                pointerDownSelectedObject, isPointerOnObject, pointerDownSelectedObjectType
            })
            // return;
        }

        const isBoxSelectMode = useViewerStore.getState().isBoxSelectMode

        if (isBoxSelectMode) {

            this.selectionBox.endPoint.set(
                (posX / this.cSize.w) * 2 - 1,
                -(posY / this.cSize.h) * 2 + 1,
                0.5);

            const allSelected = this.selectionBox.select();

            if (allSelected.length > 0) {

                SetMatEmissive(allSelected, this.selectType, 'allSelected', 'up');

                for (let i = 0; i < allSelected.length; i++) {
                    if (this.selectType === "tree" && allSelected[i].isMesh && allSelected[i].meshType === 'tree') {
                        // this.selectionBox.collection[ i ].material.emissive.set( 0x000000 );
                        SetupTreeGroup(this, allSelected[i].obstId, true)
                    }
                }
            }

            if (this.selectType === 'module') ClearModuleEmissive(this.moduleMeshArr);
            this.removeSelectionBoxHelper()

        }

        if (GetParentTool(e)) {
            return;
        }
        if (this.pushMode) {
            // update module placement validation
            SetVirMeshPos(this, e);

            SetCloneVirObj(this);
            return;
        }
        if (this.dragObst) {
            this.controls.enabled = true;
            PutDragObst(this);
            return;
        }
        if (this.selectType === 'module') {
            if (this.moveMode) {
                SetModuleOriPos(this, this.moduleMeshArr);
                if (this.mouseModuleStatus === 'down') {
                    this.setMoveMode(false);
                }
            } else if (this.pushMode) {

            } else {
                if (this.mouseModuleStatus === 'down') {
                    const interInfo = GetClickObj(e, this.moduleMeshArr.filter(module => {
                        return module.pathwayOver !== true
                    }), this.camera, this.cSize);
                    if (interInfo) {
                        SetSelModuleArr(this.moduleMeshArr, interInfo.object, e);
                    }
                }
            }
            this.posModuleDown = false;
        } else if (this.selectType === 'mapCustom') {
            this.posMapDown = null;
            this.posPlaneDown = null;
        }
        if (this.moveMode) return;
        if (!this.selectType || dragDis > 10) return;
        var selTypeMeshArr = this.meshArr.filter(mesh => {
            return mesh.visible && mesh.meshType === this.selectType
        });
        if (this.tabInfo === 'Obstruction Properties') {
            selTypeMeshArr = selTypeMeshArr;
        } else if (this.selectType === 'surface') {
            if (this.createPlaneMode) selTypeMeshArr = [this.planeMesh];
            else selTypeMeshArr = this.meshArr.filter(mesh => {
                return mesh.flatRoof === true
            });
        }
        this.selTypeMeshArr = selTypeMeshArr;
        const interObj = GetClickObj(e, this.selTypeMeshArr, this.camera, this.cSize);
        const newObstId = interObj ? interObj.object.obstId : undefined;

        if ((e.button !== 2 && !isTapandHold) && (this.selectType === 'roof' || this.selectType === 'module')) {
            const clickObj = GetClickObj(e, this.roofMeshArr, this.camera, this.cSize)
            ShowSelectRoof(this, clickObj);
        }

        if (this.selectType === 'roof') {
            SetWallMeshArr(this, interObj);
        } else if (this.selectType === 'tree') {
            if (e.button === 2 || isTapandHold) {
                SetupTreeGroup(this, newObstId, true);
            } else {
                SetupTreeGroup(this, newObstId);
            }
        } else if (this.selectType === 'obst') {
            if (e.button === 2) {
                SetupObstUI(this, newObstId)
            } else {
                SetupObstUI(this, newObstId)
            }
        } else if (this.selectType === 'surface') {
            if (this.createPlaneMode) CreatePlaneRoof(this, interObj);
            else if (!this.createRoofMode) SetupFlatRoof(this, interObj);
        }
    }

    selectRightClickRoof = () => {
        this.roofMeshArr.forEach(roofMesh => {
            roofMesh.selectRoofFace = false;
        });
    }

    setCompassDrag = (val) => {
        this.compassDrag = val;
        SetInitCamRotVal(this);
    }

    setAutoRotate = (val) => {
        this.autoRotate = val;
        SetInitCamRotVal(this);
        if (this.viewMode === '3d') this.controls.enableRotate = !val;
        this.controls.enablePan = !val;
    }

    setTopView = (val) => {
        SetTopView(this, val);
    }

    setSelectType = (selectType) => {
        this.selectType = selectType;
        this.setPushMode(false);
        this.setMoveMode(false);
        this.sunGroup.visible = false;
        SetModuleDisplay(this.modelGroup, true);
        SetTreeTransArr(this, true);
        this.setManualZone(false);
    }

    setManualZone = (val) => {
        useViewerStore.setState({manualZone: val});
        if (val && this.viewMode === '3d') {
            SetCameraView(this, '2d');
        } else if (!val && this.viewMode === '2d') {
            SetCameraView(this, '3d', true);
        }
        this.initLineGroup();
    }

    setPushMode = (pushMode, copyMode) => {
        this.pushMode = pushMode;
        if (this.viewMode === '3d') this.controls.enableRotate = !pushMode;
        if (copyMode) SetCopyVirObj(this);
        if (pushMode || this.selectType !== 'obst') this.obstId = undefined;
        this.transform.detach();
        this.virObs.visible = false;
        this.virTree.visible = false;
        this.virModule.visible = false;
        this.treeTransMesh.visible = false;

        // SetControlIcon([
        //     {key: 'view2d', name: 'disable', add: pushMode},
        //     {key: 'btnMeasure', name: 'disable', add: pushMode},
        // ]);

        if (pushMode) {
            if (this.selectType === 'tree') {
                this.virTree.visible = true;
                SetTreeTransArr(this, true);
            } else if (this.selectType === 'obst') {
                this.virObs.visible = true;
                SetupObstUI(this);
            } else if (this.selectType === 'module') InitModulePush(this);
        }
        if (this.selectType === 'module') {
            SetBtnModule('add', pushMode);
            useViewerStore.setState(() => ({modulePlacementStatus: ModulePlacementStatusOk}));
        }
        if (pushMode && this.viewMode === '2d') this.setCameraView('3d');
    }

    setMoveMode = (moveMode) => {
        this.moveMode = moveMode;
        if (moveMode) {
            if (this.selectType === 'roof') {
                this.setCameraView('2d');
                this.transform.attach(this.mapMesh);
            } else if (this.selectType === 'tree') this.transform.attach(this.treeTransMesh);
            else if (this.selectType === 'obst' && this.viewMode === '2d') this.setCameraView('3d');
        } else {
            document.body.style.cursor = 'pointer';
            this.transform.detach();
            if (this.viewMode === '2d') this.setCameraView('3d');
        }
        if (this.selectType === 'module' || this.selectType === 'mapCustom' || this.selectType === 'roof') {
            SetBtnModule('move', moveMode);
            this.controls.enableRotate = !moveMode
        }
    }

    setAutoAlignMode = (autoAlignMode) => {
        this.autoAlignMode = autoAlignMode;
        if (autoAlignMode) {
            this.autoScaleParams.current = 'map';
            this.autoScaleParams.mapRef = {};
            this.autoScaleParams.modelRef = {};
            this.initLineGroup();
        } else {
            this.drawMode = false;
            // ResetLineMesh(this, 'stop');
            // resetAutoScale(this);
        }

        // else ResetLineMesh(this, 'pause');
        // if (this.selectType === 'mapCustom'){
        //     this.controls.enableRotate = !autoAlignMode
        // }
    }

    setDrawMode = (drawMode) => {
        this.drawMode = drawMode;
        if (!this.drawMode) ResetLineMesh(this, 'pause');
        const labelDrawStop = document.getElementById('labelDrawStop');
        if (!labelDrawStop) return;
        if (drawMode) labelDrawStop.classList.add('active');
        else labelDrawStop.classList.remove('active');
    }

    resetDraw = () => {
        this.setDrawMode(false);
        ResetLineMesh(this, 'stop');
    }

    setMeasureMode = (measureMode) => {
        this.measureMode = measureMode;
        this.initLineGroup();
    }

    setEPCStatus = () => {
        SetDisplayShadePoints(this, 'epc');
    }

    initGuideLineGroup = () => {
        const guideLineMat = new THREE.LineDashedMaterial({color: 0xFF5F1F, depthTest:false, depthWrite:false, transparent:true});
        const guideInit = new THREE.Mesh(), guideOut = new THREE.Group();
        guideOut.add(guideInit);
        this.guideLineGroup.add(guideOut);

        ['x', 'z'].forEach(axis => {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
                lineMesh = new THREE.Line(lineGeo, guideLineMat);
            guideInit.add(lineMesh);
        });
    }

    initLineGroup = () => {
        EmptyGroup(this.lineGroup);
        const manualZone = useViewerStore.getState().manualZone;
        this.lineGroup.visible = this.lineMesh.visible = (this.measureMode || this.autoAlignMode || this.createRoofMode || manualZone);
        this.lineMesh.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
        this.guideLineGroup.children[0].children[0].children.forEach(guideLine => {
            guideLine.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
        });
        ShowLineSnapSwitch(this);
    }

    setDisLineSnap = (value) => {
        this.disLineSnap = value;
    }

    setBuildingModule = (value) => {
        SetBuildingModule(this, value);
    }

    moveModuleDistance = (dir, inch) => {
        UpdateSelModuleArr(this, 'moveInch', {dirStr: dir, inch});
        // MoveModuleDistance(this, dir, inch);
    }

    setRoofModuleDir = (dir) => {
        if (this.roofModuleTime) return;
        this.roofModuleTime = true;
        setTimeout(() => {
            this.roofModuleTime = false;
        }, 100);
        SetModuleArr(this, false, this.preSelRoofId, dir);
    }

    setSpinAllModules = () => {
        this.moduleDir = this.moduleDir === 'land' ? 'port' : 'land';
        SetModuleArr(this);
    }

    setModuleSetting = (type, value) => {
        if (type === 'dir') {
            this.moduleDir = value;

        }
        if (this.pushMode) {
            SetVirModuleSize(this.virModule, type, value);
            return;
        }
        const selModules = GetSelModules(this.moduleMeshArr)
        if (!selModules || !selModules.length) return;
        if (this.changeModuleTime) {
            return;
        }
        this.changeModuleTime = true;
        const selRoof = this.roofMeshArr.find(item => {
            return item.roofFaceId === selModules[0].roofId
        });
        if (type === 'dir') UpdateSelModuleArr(this, 'dir', value);
        if (type === 'delete' && this.hasCapability("Edit_Module_Remove")) DeleteModule(selModules, selRoof, this.moduleMeshArr, this);
        else {
            siteCalculationState.needsUpdate(MODULE_GRAPH);
        }
        setTimeout(() => {
            this.changeModuleTime = false;
        }, timeModuleDelay);
    }

    setModulesSize = (module) => {
        if (module.w === 0 || module.h === 0) {
            throw new Error(`module size for ${module.text} is invalid`);
        }

        SetModuleArr(this);
    }

    loadStreetView() {
        LoadStreetView(this);
    }

    deleteCustomImagery = () => {
        this.mapCustom.material.dispose()
        this.mapCustom.material.map = null;
        this.mapCustom.visible = false;
        this.mapCustom.material.needsUpdate = true;
    }

    setClearFaceModule = (faceMesh) => {
        SetClearFaceModule(this, faceMesh);
    }


    clearScene = () => {
        SetTreeTransArr(this, true);
        this.treeTransMesh.visible = false;
        this.transform.detach();
        if (this.mapMesh) {
            this.mapMesh.material.map = null;
            this.mapMesh.material.needsUpdate = true;
        }

        this.roofJson = null;
        [this.lineGroup, this.boundGroup, this.roofGroup, this.treeGroup, this.obstGroup].forEach(group => {
            EmptyGroup(group);
        });
    }

    setTreeProperty = (type, value) => {
        if (type.includes('pos')) ChangeTreePos(this, type, value);
        else if (type === 'delete') ToggleSelectedTreeDelete(this);
        else if (type === 'shape') ChangeSelectedTreeShape(this, value);
        else ChangeTreeSize(this, type, value);
    }

    addToCart = () => {
        if (!this.selTreeArr || this.selTreeArr === 0) return;
        this.viewerAlert({
            show: true,
            title: "Fill Tree Info",
            message: <TreeCartForm
                selectedTrees={this.selTreeArr}
                onSubmit={() => {
                    //this.refreshShade(false);
                    this.setTreeProperty("delete");
                    this.deselectAllSelectedObjectsAndEndTask()
                }}
            />,
            messageType: "info",
            isModal: true,
        })
    }

    removeTreeFromCart = () => {
        if (!this.selTreeArr || this.selTreeArr === 0) return;
        let updatedCartTrees = useViewerStore.getState().treeCartItems;

        this.selTreeArr.forEach((treeInCart) => {
            treeInCart.userData.treeCartInfo = {};
            treeInCart.select = false;
            useSceneStore.getState().removeSelectedTree(treeInCart);
            treeInCart.children[0].material.emissive.setHex(0x000000);

            //Remove Tree from cart based on selected tree id
            updatedCartTrees = updatedCartTrees.filter((tree) => tree.userData.treeId !== treeInCart.userData.treeId);

            ChangeTreeDelete(treeInCart, false);
        });

        useViewerStore.setState({treeCartItems: updatedCartTrees});
        this.refreshShade(false);
    }

    selectAllTrees = () => {
        if (this.pushMode || this.moveMode) return;
        SelectAllTrees(this);
    }

    setWallSize = (value) => {
        this.wallHEdit = value;
        value = Math.round(value * 1000) / 1000 - this.wallHData;

        for (const roofMesh of this.roofMeshArr) {
            const group = roofMesh.parent.parent;
            group.position.set(group.position.x, roofMesh.userData.initialHeight + value, group.position.z);
        }

        const wallMeshArr = this.meshArr.filter(m => m.name.startsWith('wallMesh'));
        for (const wall of wallMeshArr) {
            const points = wall.userData.positions;

            const wallShape = new THREE.Shape();
            wallShape.moveTo(points[0].x, points[0].z);
            for (let i = 1; i < points.length - 1; i++) {
                wallShape.lineTo(points[i].x - value, points[i].z);
            }
            wallShape.lineTo(points[points.length - 1].x, points[points.length - 1].z);

            const extrudeSettings = {
                depth: wall.userData.depth ? wall.userData.depth - 0.1 : 0.04,
                bevelEnabled: false,
            };
            wall.geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
            SetWallMeshOBB(wall, wall.userData.center, wall.userData.firstPos);
        }

        for (const edge of this.edgeMeshArr) {
            const positions = edge.userData.positions;
            edge.geometry.setPositions([positions[0], positions[1] + value, positions[2], positions[3], positions[4] + value, positions[5]]);
        }

        for (const obst of this.obstGroup.children) {
            obst.position.set(obst.position.x, obst.children[0].children[0].children[0].userData.initialHeight + value, obst.position.z);
        }
    }

    setObstProperty = (type, value) => {
        switch (type) {
            case 'angle':
                return this.setObstAngle(value);
            case 'height':
                return this.setObstHeight(value);
            case 'length':
                return this.setObstLength(value);
            case 'width':
                return this.setObstWidth(value);
            case 'sides':
                return this.setObstSides(value);
            case 'diameter':
                return this.setObstDiameter(value);
            case 'radius':
                return this.setObstRadius(value);
            case 'shape':
                return this.setObstShape(value);
            case 'delete':
                return this.setObstDelete(value);
        }
    }

    setObstAngle = () => ChangeObstAngle(this)

    setObstHeight = (value) => ChangeObstHeight(this, value)

    setObstLength = (value) => ChangeObstLength(this, value)

    setObstWidth = (value) => ChangeObstWidth(this, value)

    setObstSides = (value) => ChangeObstSides(this, value)

    setObstDiameter = (value) => ChangeObstDiameter(this, value)

    setObstRadius = (value) => ChangeObstRadius(this, value)

    setObstShape = (value) => ChangeObstShape(this, value)

    setObstDelete = () => ChangeObstDelete(this)

    setSunDefault = () => {
        this.sunInfo.date = dateToday;
        this.sunInfo.time = dateToday.getHours() + dateToday.getMinutes() / 60;
        this.updateSunPath('date', (dateToday.getTime() - dateFirst.getTime()) / (24 * 3600 * 1000));
    }

    hideObject = (type, value) => {
        if (type === 'SunVector') {
            this.setSunDefault();
            this.sunGroup.visible = value;
        } else HideObject(this, type, value);
    }

    setVisibleGroup = (type, value) => {
        SetVisibleGroup(this, type, value);
    }

    downloadGLTF = async () => {
        await DownloadGLTF(this);
    }

    exportJson = async () => {
        const file = await ExportGen(this);
        if (!file) {
            return;
        }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        const sfidString = sessionStorage.getItem('SalesForceId')
        link.download = `${sfidString}.genesis`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    importGLBFile = (file) => {
        const newZip = new JSZip();
        var flagGltf = false;
        newZip.loadAsync(file).then((zip) => {
            for (let [filename, gltfFile] of Object.entries(zip.files)) {
                if (filename.split('.').pop() === 'gltf') {
                    flagGltf = true;
                    newZip.file(filename).async("string").then(content => {
                        const jsonInfo = JSON.parse(content);
                        if (jsonInfo.scenes && jsonInfo.scenes[0]) {
                            const {extras} = jsonInfo.scenes[0];
                            this.clearScene();
                            setTimeout(() => {
                                LoadModelJson(this, extras, 'glb');
                            }, 0);
                        }
                    });
                } else {
                    window.alert('Can not load the gltf file');
                    return;
                }
            }
            if (!flagGltf) {
                window.alert('Can not find gltf file in zip');
                return;
            }
        });
    }


    resizeCanvas = () => {

        const isStreetViewVisible = useViewerStore.getState().isStreetViewVisible

        const canvasContainer = document.getElementById('canvasContainer')

        if (isStreetViewVisible) {
            canvasContainer.classList.add('canvas-street-view-split')
        }

        const {clientWidth, clientHeight} = canvasContainer;

        this.cSize.w = isStreetViewVisible ? clientWidth / 2 : clientWidth;
        this.cSize.h = clientHeight;

        const updatedWidth = isStreetViewVisible ? window.innerWidth / 2 : clientWidth

        const aspect = updatedWidth / clientHeight;
        var camR = (this.camera.top * 2) / updatedWidth;
        const newWidth = updatedWidth * camR;

        this.camera.aspect = aspect;
        this.camera.left = newWidth * aspect / -2;
        this.camera.right = newWidth * aspect / 2;
        this.camera.top = newWidth / 2;
        this.camera.bottom = newWidth / -2;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(updatedWidth, clientHeight);
            this.cssLabelrenderer.setSize(updatedWidth, clientHeight);
        }, 100);

    }

    setTabInfo = (value) => {
        this.tabInfo = value;
        ResetWallMeshArr(this);
        // ShowSelectRoof(this);
        this.obstId = undefined;
        SetupObstUI(this);
    }

    setMeshTexture(meshArray, roofShingleImg, typeOfMesh, textureId) {
        ChangeMeshMaterial(meshArray, roofShingleImg, 'map', this, typeOfMesh, textureId);
    }

    deleteWall = (wallArr) => {
        wallArr.forEach(wall => {
            if (wall.select) wall.parent.visible = false;
        });
    }

    setMeshMaterialColor(meshArray, color) {
        ChangeMeshMaterial(meshArray, color, 'color', this, null, null);
    }

    resetRoofToDefault = () => {
        this.setMeshMaterialColor(this.roofMeshArr, defaults.ROOF_FACE_COLOR);
    }

    resetWallToDefault = () => {
        this.setMeshMaterialColor(this.wallMeshArr, defaults.WALL_COLOR);
    }

    loadTexturedFBXMesh = (modelFile) => {
        let object = new FBXLoader().parse(modelFile);
        object.rotation.x = -Math.PI / 2;
        object.scale.set(0.35, 0.35, 0.35)

        const box3 = new THREE.Box3();
        box3.expandByObject(object, true)
        const vec = new THREE.Vector3();
        box3.getCenter(vec)
        vec.negate()

        //subtract
        vec.sub(new THREE.Vector3(-6, -7, 3.5))

        object.position.set(vec.x, vec.y, vec.z)

        this.ambientLight.intensity = 0.7

        this.scene.add(object);
    }

    updateCustomImageProperty = (type, value) => {
        SetMapCustomSize(this, type, value);
    }

    resetPlaneSize = () => {
        this.mapMesh.scale.x = 1
        this.mapMesh.scale.y = 1
    }

    fetchMapImageAndLoadOnPlane = (vendor = 'mapbox') => {
        FetchMapImage(this, vendor);
    }

    resetObstructionToDefault = () => {
        this.setMeshMaterialColor(this.wallMeshArr, defaults.WALL_COLOR);
    }

    setOrbitControlsMode = (mode) => {

        if (mode === 'orbit') {
            //make left click rotate
            this.controls.mouseButtons = {LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN}
            this.controls.update()
        } else if (mode === 'pan') {
            //make left click pan
            this.controls.mouseButtons = {LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN}
            this.controls.update()
        }
    }

    refreshShade = (display) => {
        RefreshShade(this, display);
    }

    setupHideIrradiance = () => {
        RefreshShade(this, true, 'whatif');
    }

    addStep = (key, object, older, newer) => {
        AddStep(this, key, object, older, newer);
    }

    setStep = (stepDir) => {
        SetStep(this, stepDir);
    }

    setCreateRoofPage = () => {
        if (this.selectType === 'surface' && this.viewMode === '3d') this.setCameraView('2d');
        else if (this.selectType !== 'surface' && this.viewMode === '2d') this.setCameraView('3d', true);
        const btnMeasure = document.getElementById('btnMeasure'),
            divSettingFlatRoof = document.getElementById('settingFlatRoof');

        if (this.selectType === 'surface') btnMeasure?.setAttribute('disabled', true);
        else btnMeasure?.removeAttribute('disabled');
        if (divSettingFlatRoof) {
            divSettingFlatRoof.style.visibility = 'hidden'; // 'visible';
        }
        // SetControlIcon([
        //     {key: 'view3d', name: 'disable', add: this.selectType === 'surface'},
        //     {key: 'btnMeasure', name: 'disable', add: this.selectType === 'surface'},
        // ])
        this.setCreateRoofMode(false);
        SetupFlatRoof(this);
    }

    setFlatRoofProperty = (type, value) => {
        SetFlatRoofProperty(this, type, value);
    }

    setCreateRoofMode = (mode) => {
        this.createRoofMode = mode;
        if (mode) {
            this.setCreatePlaneMode(false);
            if (this.viewMode === '3d') SetCameraView(this, '2d');
        } else {
            if (this.viewMode === '2d') SetCameraView(this, '3d');
        }
        this.initLineGroup();
        const btnCreateRoofMode = document.getElementsByClassName('btnCreateRoofMode')[0];
        if (btnCreateRoofMode) btnCreateRoofMode.textContent = mode ? 'Stop Draw' : 'Draw Roof';
    }

    setCreatePlaneMode = (mode) => {
        this.createPlaneMode = mode;
        if (mode) this.setCreateRoofMode(false);
        const btnCreatePlaneMode = document.getElementsByClassName('btnCreatePlaneMode')[0];
        if (btnCreatePlaneMode) btnCreatePlaneMode.textContent = mode ? 'Stop' : 'Add';
    }

    alertSelectedLatLongPoints = (e) => {
        const interPlane = GetClickObj(e, [this.planeMesh], this.camera, this.cSize);
        if (this.mapCoordinates && !this.isViewerInSplitMode) {
            ViewAlertLatLon(this, interPlane.point);
        }
    }

    deselectAllSelectedObjectsAndEndTask = () => {

        if (this.downPos) return

        //Reset selectType
        const actualSelectType = this.getSelectTypeFromPath(getPathname())
        this.setSelectType(actualSelectType)

        const isPushPullMode = useViewerStore.getState().isPushPullMode

        if (isPushPullMode) {
            document.getElementById('pushPullToolBtn').click()
        }

        //UPDATE UI
        useViewerStore.setState({
            isMoveRoofActive: false,
            isAddModuleActive: false,
            isMoveModuleActive: false,
            isAddTreeActive: false,
            isMoveTreeActive: false,
            isAddObstructionActive: false,
            isMoveObstructionActive: false,
        })


        document.body.style.cursor = "default";

        //Remove Custom Context Menu
        useViewerStore.setState({pointerDownSelectedObjectType: null})


        if (getPathnameIncludes('obstruction')) {
            // document.getElementById("editObstBtn").click(); //This button is not there in the DOM
        } else if (getPathnameIncludes('modules')) {
            this.virModule.visible = false
            this.selectType = 'module';
            this.setPushMode(false);
            this.setMoveMode(false);
        }


        //End Push-Mode ( add )
        if (this.pushMode) {
            this.setPushMode(false)
        }

        //End Move-Mode ( move objects )
        if (this.moveMode) {
            this.setMoveMode(false)
        }


        //Deselect all roof faces
        this.roofMeshArr.forEach((mesh) => {
            const {oriMap, oriColor, roofFaceId} = mesh;
            mesh.selectRoofFace = false
            mesh.material.color.setHex(oriColor);
            mesh.material.map = oriMap;
            const selectRoofInfo = document.getElementById('selectRoofInfo');
            const wholeRoofInfo = document.getElementById('wholeRoofInfo');
            if (selectRoofInfo && selectRoofInfo) {
                wholeRoofInfo.style.display = 'block'
                selectRoofInfo.style.display = 'none'
            }

        })


        //Deselect Modules
        ResetSelModuleArr(this.moduleMeshArr)

        //Deselect Tree
        this.treeGroup.children.forEach(tree => {
            tree.select = false
            useSceneStore.getState().removeSelectedTree(tree);

            tree.children[0].material.emissive.setHex(0x000000);
        });

        //Deselect Obstructions
        SetupTreeGroup(this, null);
        SetupObstUI(this, null)

        //Deselect Walls
        SetWallMeshArr(this, null)
    }


    getSelectTypeFromPath = (pathname) => {
        let selectType = 'roof';
        if (pathname.includes('custom-image')) {
            selectType = 'mapCustom';
        } else if (pathname.includes('obstruction')) {
            selectType = 'obst';
        } else if (pathname.includes('tree')) {
            selectType = 'tree';
        } else if (pathname.includes('roof')) {
            selectType = 'roof';
        } else if (pathname.includes('modules')) {
            selectType = 'module';
        } else if (pathname.includes('surface')) {
            selectType = 'surface';
        } else if (pathname.includes('what-if')) {
            selectType = 'whatif';
        } else if (pathname.includes('price-calculation')) {
            selectType = 'epc';
        } else if (pathname.includes('irradiance') || pathname.includes('solar-access')) {
            if (pathname.includes('irradiance')) selectType = 'sun';
        }
        return selectType;
    }


    showRoofSquirrel = (value) => {

        //home position
        // document.getElementById('defaultPositionBtn').click()

        const circle = this.totalGroup.getObjectByName('roofSquirrelCircle')

        circle.visible = value;


    }

    updateRoofSquirrelRadius = (radius) => {
        const circleMesh = this.totalGroup.getObjectByName('roofSquirrelCircle')

        const circle = new THREE.CircleGeometry(radius, circleMesh.geometry.parameters.segments);

        circleMesh.geometry.dispose()

        circleMesh.geometry = circle

    }


    calculateRoofSquirrel = () => {

        const treeInCircle = []

        const circle = this.totalGroup.getObjectByName('roofSquirrelCircle')

        const radius = circle.geometry.parameters.radius

        this.treeGroup.children.forEach((mesh) => {
            //check if tree collides with circle
            const treePos = mesh.position.clone()
            treePos.y = 0
            const distance = treePos.distanceTo(circle.position)
            if (distance < radius) {
                treeInCircle.push(mesh)
            }
        })

        const radiusInFeet = Math.round(radius * 3.28084)

        //show modal
        this.viewerAlert({
            show: true,
            title: "Tree Perimeter Tool Info",
            message: `There are ${treeInCircle.length} trees in the ${radiusInFeet} feet radius of the roof`,
            messageType: "info",
            isModal: true
        })
    }

    setPushPullMode = (mode) => {
        useViewerStore.setState({isPushPullMode: mode})
    }

    checkIfRoofIsSmallFace = (roofMesh) => {
        //If roof_size_type is small_face then don't show the roof tag (Area < 5200 sq_inch)
        const roof_size_type = roofMesh.userData.roof_size_type
        return roof_size_type === 'small_face'
    }


    toggleRoofTag = (showStateBoolean) => {

        this.roofTagGroup.clear()


        this.roofMeshArr.forEach(mesh => {

            if (this.checkIfRoofIsSmallFace(mesh)) {
                return
            }

            //create CSS 2D Label
            const label = document.createElement('div');
            label.className = 'roofTagLabel';
            label.textContent = `Roof ${mesh.userData.roof_tag_id}\nAzi : ${Math.round(mesh.oriAng.azimuth)}\nTlt : ${Math.round(mesh.oriAng.tilt)}`;

            const midPoint = getCenterPoint(mesh)
            const labelPosition = midPoint.clone()
            labelPosition.y += 0.5

            const labelTag = new CSS2DObject(label);

            labelTag.position.copy(labelPosition);

            labelTag.visible = showStateBoolean

            this.roofTagGroup.add(labelTag);

        })


    }

    toggleRoofIDTriangle = (showStateBoolean) => {

        this.roofIDTriangleGroup.clear()


        this.roofMeshArr.forEach(mesh => {

            if (this.checkIfRoofIsSmallFace(mesh)) {
                return
            }

            // SVG data
            const svgData = `
        <svg width="70" height="70" xmlns="http://www.w3.org/2000/svg">
  <polygon points="35,10 65,60 5,60" style="fill:white;stroke:black;stroke-width:2" />
  <text x="50%" y="60%" text-anchor="middle" fill="black" font-size="14" font-family="Arial"  font-weight="bold" dy=".3em">${mesh.userData.roof_tag_id}</text>
</svg>`;

            // Convert SVG to texture
            const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
            const svgUrl = URL.createObjectURL(svgBlob);
            const loader = new THREE.TextureLoader();
            const texture = loader.load(svgUrl, function (texture) {
                texture.needsUpdate = true;
            });

            //make texture sharp and not blurry
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();


            // Create material and geometry
            const material = new THREE.MeshStandardMaterial({map: texture, transparent: true});
            material.map.minFilter = THREE.LinearFilter;
            const geometry = new THREE.PlaneGeometry(2, 2);
            const midPoint = getCenterPoint(mesh)
            const bufferOffset = 4
            midPoint.y += bufferOffset
            const triangleMesh = new THREE.Mesh(geometry, material);
            triangleMesh.position.copy(midPoint);
            triangleMesh.rotation.x = -Math.PI / 2;
            this.roofIDTriangleGroup.visible = showStateBoolean
            this.roofIDTriangleGroup.add(triangleMesh);


        });


    }


    getRoofSquareForRoofMeshArray = (roofMeshArr, slopeTypeGroup) => {

        let slopeType = 'Low'

        let sumOfRoofSquare = 0

        let finalSumRoofSquare = 0
        let slopeTypeObj = {}
        if (slopeTypeGroup?.length > 0) {
            slopeTypeObj = JSON.parse(slopeTypeGroup[0].label)
        }
        roofMeshArr.forEach((mesh) => {

            const roofPitch = mesh.oriAng.tilt

            //if all roofPitch is < 14,1 then use slopeType = 'Low'
            //pitch>= 14.1 and < 46 	slope='Normal'
            //pitch>= 46 slope='High'

            if (slopeTypeGroup?.length > 0) {
                if (roofPitch >= slopeTypeObj.low.lowerBound && roofPitch <= slopeTypeObj.low.upperBound) {
                    slopeType = "Low"
                } else if (roofPitch >= slopeTypeObj.normal.lowerBound && roofPitch <= slopeTypeObj.normal.upperBound) {
                    slopeType = 'Normal'
                } else if (roofPitch >= slopeTypeObj.steep.lowerBound && roofPitch <= slopeTypeObj.steep.upperBound) {
                    slopeType = 'Steep'
                }
            } else {
                if (roofPitch >= 14.1 && roofPitch < 46) {
                    slopeType = 'Normal'
                } else if (roofPitch >= 46) {
                    slopeType = 'Steep'
                }
            }

            sumOfRoofSquare += mesh.size

            finalSumRoofSquare += (Number(mesh.size) / 100)

        })

        const auroraRoofSquare = finalSumRoofSquare.toFixed(4)

        const percentage_roofsquare = 15

        const roofWaste = (auroraRoofSquare * percentage_roofsquare / 100).toFixed(4)

        let totalRoofSquare = (Number(auroraRoofSquare) + Number(roofWaste)).toFixed(2)


        //if decimal of totalRoofSquare is more than .33 then show the decimal else floor it
        const decimal = totalRoofSquare.split('.')[1]

        //Floor the totalRoofSquare if decimal is less than 33
        if (decimal) {
            const decimalValue = Number(decimal)
            if (decimalValue < 33) {
                totalRoofSquare = Math.floor(Number(totalRoofSquare))
            } else {
                totalRoofSquare = Math.ceil(Number(totalRoofSquare))
            }
        }

        return {
            totalRoofSquare,
            slopeType
        }
    }


    calculateRoofSquare = () => {
        const isSizeValueAvailable = this.roofMeshArr[0].size
        const accessoryBuildingList = useViewerStore.getState().accessoryBuildingList;
        const masterDataList = useViewerStore.getState().masterDataList;
        if (!isSizeValueAvailable) {
            this.viewerAlert({
                show: true,
                title: "Error : No Sq_footage Info",
                message: `Unable calculate sq-footage Value of roof faces, roof square calculation is not possible`,
                messageType: "error",
                isModal: true
            })
            return;
        }

        const buildingWiseRoofMeshArr = {};

        this.roofMeshArr.forEach(mesh => {
            if (accessoryBuildingList.includes(mesh.userData.buildingName)) return;

            if (!buildingWiseRoofMeshArr[mesh.userData.buildingName]) {
                buildingWiseRoofMeshArr[mesh.userData.buildingName] = [];
            }

            buildingWiseRoofMeshArr[mesh.userData.buildingName].push(mesh);
        });

        const roofSquareTableData = Object.values(buildingWiseRoofMeshArr).map(roofMeshArr => {
            const {
                totalRoofSquare,
                slopeType
            } = this.getRoofSquareForRoofMeshArray(roofMeshArr, masterDataList.Application_Setting);
            return {
                building: roofMeshArr[0].userData.buildingName,
                roofsquare: totalRoofSquare,
                slopetype: slopeType
            };
        });

        useViewerStore.setState({roofSquareTableData});

        this.viewerAlert({
            show: true,
            title: "Roof Square Info",
            message: <RoofSquareTable/>,
            messageType: "info",
            isModal: true
        });
    }

    reLabelTreeGroup = () => {
        const treeArr = [];

        this.treeGroup.children.forEach(tree => {
            const {position, children} = tree, crownMesh = children[0], trunkMesh = children[1];
            const scale = crownMesh.scale
            const {crownScl} = crownMesh;
            const cScl = {x: scale.x / crownScl.x, y: scale.y / crownScl.y, z: scale.z / crownScl.z};
            const tScl = trunkMesh.scale
            const crown_radius = crownMesh.scale.x / crownScl.x;
            const crown_height = crownMesh.scale.y / crownScl.y;
            const trunk_radius = trunkMesh.scale.x;
            const heightValueInMeters = cScl.y + tScl.y / 1.3

            //generate each tree a alphabets id like A...Z, AA...ZZ, AAA...ZZZ
            const treeId = treeArr.length === 0 ? 'A' : treeArr.length < 26 ? String.fromCharCode(65 + treeArr.length) : String.fromCharCode(65 + Math.floor(treeArr.length / 26) - 1) + String.fromCharCode(65 + treeArr.length % 26);

            tree.treeId = treeId;

            tree.userData = {
                treeId: treeId,
                crown_radius: crown_radius,
                crown_height,
                trunk_radius,
                height: heightValueInMeters,
                type: 'ellipsoid',
                x: position.x,
                y: -position.z,
                isAddedToTreeCart: false
            }

            treeArr.push({
                treeId: treeId,
                crown_radius: crown_radius,
                crown_height,
                trunk_radius,
                height: heightValueInMeters,
                type: 'ellipsoid',
                x: position.x,
                y: -position.z
            });
        });
    }


    togglePathway = () => {
        const selPathway = useViewerStore.getState().pointerDownSelectedObject;
        if (!selPathway || !selPathway.pathwayId) return;
        SetTogglePathwayValue(this, selPathway.pathwayId);
    }


    toggleTreeLabel = (forReport) => {
        if (this.treeTagGroup.visible) {
            this.treeTagGroup.visible = false;
            this.treeTagGroup.clear();
        } else {
            this.treeTagGroup.clear();
            this.treeGroup.children.forEach(tree => {
                const {userData, totalH, position} = tree;
                const options = {
                    color: forReport ? '#ffffff' : '#00ffff',
                    size: forReport ? 80 : 60,
                    x: position.x,
                    y: totalH - 4.0,
                    z: forReport ? position.z + 3.0 : position.z + 1.0
                };
                const label = `${userData.treeId}`;
                let labelObj = forReport ? this.makeTextSprite(label, options) : this.makeCSSLabel(label, options);
                // let labelObj = this.makeTextSprite(label, options);
                this.treeTagGroup.add(labelObj);
            });
            this.treeTagGroup.visible = true;
        }
    }

    makeTextSprite = (text, options) => {
        var treeLabelCanvas = document.createElement('canvas');
        var context = treeLabelCanvas.getContext('2d');
        var textWidth = context.measureText(text).width;
        let w = textWidth * 11;
        context.fillStyle = 'rgb(0 0 0 / 80%)'; // Change this to the desired background color
        context.fillRect(0, 0, w, 100); // Rectangle background
        var x = 10;
        context.font = `bold ${options.size}px Helvetica`;
        context.fillStyle = options.color; // text color
        context.strokeStyle = 'black';  // stroke color
        context.lineWidth = 3; // stroke width
        context.fillText(text, x, options.size);
        context.strokeText(text, x, options.size);
        var texture = new THREE.Texture(treeLabelCanvas) // Canvas content to texture
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        var spriteMaterial = new THREE.SpriteMaterial({map: texture});
        spriteMaterial.depthTest = false
        spriteMaterial.depthWrite = false
        //increase sprite material brightness
        spriteMaterial.color.setRGB(1.5, 1.5, 1.5);
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(10, 5, 1.0);
        sprite.center.set(0, 0);
        sprite.position.set(options.x - 0.5, options.y, options.z);
        return sprite;
    }

    makeCSSLabel = (text, options) => {
        const treeLabelDiv = document.createElement('div');
        treeLabelDiv.className = 'tree-label';
        treeLabelDiv.style.color = options.color
        treeLabelDiv.textContent = text;
        const treeLabelObj = new CSS2DObject(treeLabelDiv);
        treeLabelObj.labelColor = options.color;
        treeLabelObj.position.set(options.x, options.y, options.z + 1.0);
        return treeLabelObj
    }


    toggleTreeMultiplierLabel = (showBoolean) => {
        this.treeLabelGroup.children.forEach((label) => {
            label.visible = showBoolean
        })
    }

    toggleModuleMultiplierLabel = (visible) => {
        for (const module of this.moduleMeshArr) {
            for (const child of module.children) {
                if (child.meshType === 'moduleLabel') {
                    child.visible = visible;
                }
            }
        }
    }

    setQuestionable() {
        this.viewerAlert({
            show: true,
            title: "Set Questionable Roof",
            message: <QuestionableRoof/>,
            messageType: "info",
            isModal: true
        })
    }


    unsetQuestionable() {

        const roof = this.roofMeshArr.find(roof => roof.selectRoofFace)

        roof.userData.questionableRoof = false

    }

    resetViewAfterReportGeneration = (reportType) => {
        if (reportType === 'direct') {
            this.setCameraView('3d', true)

            this.setTopView(false)

            this.setVisibleGroup("tree", true)
            this.setVisibleGroup("pathway", true)
            this.setVisibleGroup("setback", true)


            useViewerStore.setState({
                moduleSolarAccess: true
            })
            this.hideObject('ModuleTexture', false)

        } else if (reportType === 'measure') {
            this.moduleMeshArr.forEach((mesh) => {
                mesh.material = mesh.originalMat.clone()
                mesh.material.needsUpdate = true
            })
            this.setCameraView('3d', true)
            this.renderer.setClearColor(0x000000, 0);
            this.setVisibleGroup("tree", true)
            this.setVisibleGroup("maps", true)
            this.setVisibleGroup("pathway", true)
            this.setVisibleGroup("setback", true)
            this.mapMesh.visible = true
            this.toggleRoofIDTriangle(false)


            // this.navigate('/configure/roof');
        } else if ('site') {
            this.setTopView(false)
            this.setVisibleGroup("tree", true)
            this.setCameraView('3d', true)
            this.toggleTreeLabel()
            this.showRoofSquirrel(false)
            this.renderer.setClearColor(0x000000, 0);
        }

    }

    getImageForDirectLayout = async () => {

        return new Promise((resolve, reject) => {
            this.navigate('/configure/modules')

            useViewerStore.setState({
                moduleSolarAccess: false
            })
            this.hideObject('ModuleTexture', true)

            this.setVisibleGroup("tree", false)
            this.setVisibleGroup("pathway", false)
            this.setVisibleGroup("setback", false)

            this.moveCameraToSiteMidpointView();

            setTimeout(() => {
                resolve(this.getCanvasImage())
                this.resetViewAfterReportGeneration('direct')
            }, 2000);
        });

    }

    getImageForMeasureLayout = async () => {
        return new Promise((resolve, reject) => {

            this.setTopView(true)
            this.setVisibleGroup("tree", false)
            this.setVisibleGroup("maps", false)
            this.mapMesh.visible = false
            this.renderer.setClearColor(0xffffff);
            this.setVisibleGroup("pathway", false)
            this.setVisibleGroup("setback", false)
            this.toggleRoofIDTriangle(true)
            this.moveCameraToSiteMidpointView();

            const textureLoader = new TextureLoader()

            textureLoader.load(moduleTextureForMeasureLayout, (moduleTexture) => {

                this.moduleMeshArr.forEach((mesh) => {

                    const modTexture = moduleTexture.clone()

                    modTexture.rotation = Math.PI / 2


                    if(mesh.dir==='land'){
                        modTexture.repeat.set(0.6, 0.6)
                    }
                    else {
                        modTexture.repeat.set(1, 1)
                    }

                    mesh.originalMat = mesh.material.clone()
                    mesh.material = new THREE.MeshStandardMaterial({
                        map: modTexture
                    })
                    mesh.material.needsUpdate = true
                })

                setTimeout(() => {
                    this.resetViewAfterReportGeneration('measure');
                    resolve(this.getCanvasImage());
                }, 2000);
            })
        });
    }

    getCanvasImage = () => this.renderer.domElement.toDataURL('image/jpeg');

    getSiteMidpoint = () => {
        const positions = [];

        for (const wall of this.wallMeshArr) {
            const arr = wall.geometry.attributes.position.array;
            for (let i = 0; i < arr.length; i += 3) {
                positions.push(wall.localToWorld(new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2])));
            }
        }

        if (positions.length === 0) {
            return null;
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

        for (const pos of positions) {
            if (pos.x < minX) {
                minX = pos.x;
            }

            if (pos.x > maxX) {
                maxX = pos.x;
            }

            if (pos.z < minZ) {
                minZ = pos.z;
            }

            if (pos.z > maxZ) {
                maxZ = pos.z;
            }
        }

        const camWidth = this.camera.right - this.camera.left;

        return {
            x: (maxX + minX) / 2,
            z: (maxZ + minZ) / 2,
            zoom: camWidth / Math.max(maxX - minX, maxZ - minZ) / 2,
        };
    }

    moveCameraToSiteMidpointView = () => {
        this.setTopView(true);

        const midpoint = this.getSiteMidpoint();

        if (midpoint) {
            this.camera.position.set(midpoint.x, 70, midpoint.z);
            this.controls.target.set(midpoint.x, 0, midpoint.z);
            this.camera.zoom = midpoint.zoom;
        } else {
            this.camera.zoom = 25;
        }

        this.camera.updateProjectionMatrix();
    }

    getImagesForSiteReport = () => {

        this.setPushMode(false);
        this.toggleRoofIDTriangle(true);

        return new Promise(async (resolve, reject) => {
            let imagesArr = {};
            const waitTime = 1000;
            this.navigate('/configure/modules')
            useViewerStore.setState({
                moduleSolarAccess: true
            })

            this.setVisibleGroup("tree", false);
            this.controls.enabled = false;
            this.moveCameraToSiteMidpointView();

            const origControlTarget = {
                x: this.controls.target.x,
                y: this.controls.target.y,
                z: this.controls.target.x,
            };

            await sleep(waitTime);
            imagesArr.home = this.getCanvasImage();

            this.controls.target.set(origControlTarget.x, origControlTarget.y, origControlTarget.z);
            this.toggleRoofIDTriangle(false);

            this.setTopView(false);
            this.setCameraView('3d', true)
            this.setVisibleGroup("tree", true)
            this.camera.position.set(6.740412343680213e-9, 73.37435872236647, 88.88308884192448)
            this.camera.zoom = 18.5
            this.camera.updateProjectionMatrix()

            await sleep(waitTime);
            imagesArr.north = this.getCanvasImage();

            this.camera.position.set(69.15289852382053, 92.2043574397518, 0.4827990025955498)

            await sleep(waitTime);
            imagesArr.east = this.getCanvasImage();

            this.camera.position.set(-84.9318898718916, 77.89357505292065, -1.7790582520239904)

            await sleep(waitTime);
            imagesArr.west = this.getCanvasImage();

            this.setCameraView('2d', true)
            this.setTopView(true);
            this.toggleTreeLabel(true);
            this.showRoofSquirrel(true);
            this.renderer.setClearColor(0xffffff);

            this.camera.zoom = 9
            this.camera.updateProjectionMatrix()

            await sleep(waitTime);
            imagesArr.tree = this.getCanvasImage();

            this.resetViewAfterReportGeneration('site')
            this.controls.enabled = true;
            resolve(imagesArr)
        })
    }
}
