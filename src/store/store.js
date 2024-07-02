import {create} from 'zustand'
import {IoIosLock} from "react-icons/io";
import RestrictFinalisePopup from "../components/Modal/Modal-Content/RestrictFinalisePopup";
import React from "react";

export const useViewerStore = create((set) => ({


    designID: 0,
    isInActiveDesign : false,

    // ThreeJS related states
    sceneViewer: null,
    editorControlMode: 'orbit',


    //UI
    isLeftSidebarOpen: false,
    isRightSidebarOpen: true,
    isTapeMeasureActive: false,
    isUserRedirectedToSiteAfterLogin: false,
    viewerAlert: {
        show: false,
        title: "",
        message: "",
        messageType: "",
        isModal: false
    },

    isMoveRoofActive: false,
    isMoveTreeActive: false,
    isMoveObstructionActive: false,
    isMoveModuleActive: false,

    isAddTreeActive: false,
    isAddObstructionActive: false,
    isAddModuleActive: false,
    isTapandHold:false,
    isTabandHoldUp:false,
    loadingCompleted:false,

    // Boolean states for different modes
    isBoxSelectMode: false,
    isCustomImageryAdded: false,
    isPushPullMode: false,
    isCtrlKeyDown: false,
    isTreeLabelVisible: false,
    isRoofTagVisible: false,
    isRoofIDTriangleVisible: false,
    isTreeMultiplierLabelVisible: false,
    isModuleMultiplierLabelVisible: false,
    isModalOpenInInterface: false,
    isPointerOnObject: false,
    isTreeLayerOn: true,
    isSavingInProgress: false,
    isStreetViewVisible: false,
    engineeringLoader: false, //Refresh enginerring section



    //Toggle States
    isHideAllGhostTrees: false,
    isHideAllSelectedTrees: false,
    isTreePerimeterToolActive: false,
    showSunPathLine: false,
    isSunSimulationRunning: false,
    isHideAllGhostObstructions: true,

    isGhostObstructionUpdated: false,

    isHideAllTreeWhatIfAnalysis: false,
    isHideGhostTreeWhatIfAnalysis: false,
    isHideAllObstWhatIfAnalysis: false,
    isHideGhostObstWhatIfAnalysis: false,

    // Unit of measure States
    unitOfMeasure: "ft",
    roofUnitOfMeasure: 'ft',
    treeUnitOfMeasure: 'ft',
    obstructionUnitOfMeasure: 'ft',

    // Shade and Production related states
    roofArea: 0,
    roofCircleSolar: 0,
    roofCircleTOF: 0,
    roofCircleTSRF: "Calculating...",
    roofIrradiance: 0,
    utilityWattage: 0,
    efficiency: "Calculating...",
    utilityProduction : "",
    roofAreaSize: 0,
    totalSystemSize: 0,
    roofChartSolar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    individualRoofSolarAccessMonthly: [],
    roofChartIrr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    modeCount: 0,
    modeCount33Arr: [],
    modeCircleSolar: 0,
    modeCircleTOF: 0,
    modeCircleTSRF: 0,
    modeIrradiance: 0,
    modeCountPort: 0,
    modeCountLand: 0,
    modeCountBoth: 0,
    multiplier: `Calculating... `,
    actualWattage: 0,
    modeChartSolar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    modeChartIrr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    weightedSolarAverage: '',
    moduleMultiplierAverage: 0,

    // Irradiance related states
    roofInfoArr: [],
    roofIrrArr: [],
    irradianceMonth : [],

    // Pointer related states
    pointerDownSelectedObjectType: null,
    pointerDownSelectedObject: null,

    // Roof related states
    selRoofFaceArr: [],
    selectedRoofFace: null,


    // Module related states
    moduleList: [],
    manualZone: false,
    activeModule: null,
    maxModuleCountPortrait: 0,
    maxModuleCountLandscape: 0,




    //Roof
    wallInitialHeight: 0,
    wallEditedHeight: 0,


    // Roof Square related states
    roofSquareTableData: [
        {
            building: '',
            roofsquare: '',
            slopetype: ''
        }
    ],
    buildingData: [],

    // Tree Cart related states
    treeArr: [],
    treeCartItems: [],
    treeCartTotalCost: 0,
    updateTreeCartBtn: false,
    
    // EPC related states
    epcPriceData:[],
    ppwValue: 0,
    freezePPW: false,
    initialPPWReady: false, // Flag to identify if PPW in EPC updated initially
    settingsSolarRate:undefined,
    epcValue:0,
    pricingType : 'PPW',
    pricingValue : "",
    escalatorValue : '2.9',
    annualUsage : '0',
    epcEstimatedProduction : '',
    epcMessage : '',
    epcCalculatedPrice: '- Quote Not Run -',
    totalSunnovaEPCWithTrees: '- Quote Not Run -',

    // Setback related states
    setbackNotes: [],
    setbackInfoObject: {},
    aHJ_Township: "",

    // Scene Tag related states
    showSceneTag: false,
    sceneTagInfoObject: {},


    //Filter
    isDateFilterApplied: false,
    isStageFilterApplied: false,

    stageSelectedFilter: [],
    dateSelectedFilter: {
        dateFrom: null,
        dateTo: null
    },
    isApplyFilter: false,

    //Design Versions
    designList:[],
    selectedDesignIndex: -1,

    accessoryBuildingList: [],


    directLayoutAnnualUsage: 0,
    directLayoutFinancePartnerProduction: 0,

    unitContext: null,
    moduleSolarAccess: true,

    //Master Data
    masterDataList: {},
    siteDesignDetails: [],
    siteBuildingData:[],

    localMultiplier: 0,
    localModeInfo: [],
    localLocation: {},
    localFaceIdStr: [],
    localHoleInfo: [],
    localEdgeCount: {},
    localAngIdeal: [],
    localFacePtHash: [],
    localAngMultiplierArr: [],
    siteAddress: '',

    isRoofChange:false, //Roof update for refresh/download
    isEngineeringFieldsChange : false, // EL and FEA changes before refresh
    isRefreshDone : false, // EL and FEA refreshed
    isResetEdata : false,
    buildingListData : [],

    modulePlacementStatus: '',

    setIsCustomImageryAdded: (isAdded) => set(() => ({isCustomImageryAdded: isAdded})),
    setUnitOfMeasure: (unit) => set(() => ({unitOfMeasure: unit})),
    setShowSceneTag: (show) => set(() => ({showSceneTag: show})),
    setDesignList: (list) => set(()=>({designList: list})),
    setSelectedDesign: (index) => set(()=>({selectedDesignIndex : index})),

    setUnitContext: (unitContext) => set(() => ({ unitContext: unitContext })),
    setModuleSolarAccess: value => set(() => ({moduleSolarAccess: value})),
    setEngineeringLoader :(value) => set(() =>({ engineeringLoader: value })),
}));
