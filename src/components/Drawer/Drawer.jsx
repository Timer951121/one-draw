import React, {useContext, useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import FinalizeTable from '../Generate-Export-File/Generate-Export-File';
import {Avatar, Button, Divider, Drawer as AntDrawer, Flex, Menu, Space, Tooltip} from 'antd';
import {
    AddressBook,
    Buildings,
    Cube,
    CurrencyCircleDollar,
    DotsNine,
    Eye,
    EyeSlash,
    Fire,
    Globe,
    GlobeHemisphereWest,
    GoogleLogo,
    HashStraight,
    HouseLine,
    HouseSimple,
    Images,
    Lightning,
    MapPin,
    MapTrifold,
    MathOperations,
    PencilLine,
    Question,
    ShoppingCart,
    Shuffle,
    SquaresFour,
    Stack,
    Sun,
    SunHorizon,
    UserCircle,
    TreeEvergreen, Plus, Faders, XCircle
} from '@phosphor-icons/react';
import {ViewerContext} from "../../contexts/ViewerContext";
import {UserContext} from "../../contexts/UserContext";
import {IMAGERY_OPTIONS, LAYER_OPTIONS} from "../../Constants";
import {useViewerStore} from "../../store/store";
import {LoadModelJson, LoadModelXML} from "../Three-JS-Viewer/Controllers/Loader";
import DesignList from "../Design-Version-List/DesignList";
import {LoadingContext} from "../../store/loadingMessageStore";

const Drawer = () => {

    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const {SceneViewer} = useContext(ViewerContext);
    const {user, hasCapability} = useContext(UserContext);


    const [layerVisibilityState, setLayerVisibilityState] = useState({
        roof: true,
        obstruction: true,
        tree: true,
        setback: true,
        pathway: true,
        modules: true,
        irradiance: true,
        maps: true,
        terrain: true
    });




    const [currentMenu, setCurrentMenu] = useState('roof');
    const [currentTool, setCurrentTool] = useState([]);

    // const [isSidebar, setIsSidebar] = useState(false);

    const siteAddress = useViewerStore(state => state.siteAddress);
    const isSidebar = useViewerStore(state => state.isLeftSidebarOpen);
    const setIsSidebar =(val)=> useViewerStore.setState({isLeftSidebarOpen:val});

    const handleMenuClick = (e) => {
        setCurrentMenu(e.key);
        if (e.key==='obstruction') SceneViewer.setTabInfo('Obstruction Properties');
        if (e.key==='tree') SceneViewer.setTabInfo('Tree Properties');
        if (e.key==='building') SceneViewer.setTabInfo('Building Properties');
        if (e.key==='roof') SceneViewer.setTabInfo('Roof Properties');

    };

    const resetLayerVisibilityStateToDefault =()=>{
        setLayerVisibilityState({
            roof: true,
            obstruction: true,
            tree: true,
            setback: true,
            pathway: true,
            modules: true,
            irradiance: true,
            maps: true,
            terrain: true
        })
    }

    useEffect(() => {
        if (pathname === '/configure/building') {
            setCurrentMenu('building');
        } else if (pathname === '/configure/roof') {
            setCurrentMenu('roof');
        } else if (pathname === '/configure/obstruction') {
            setCurrentMenu('obstruction');
        } else if (pathname === '/configure/tree') {
            setCurrentMenu('tree');
        }
        else if (pathname === '/configure/modules') {
            setCurrentMenu('modules');
        }
        else if (pathname === '/configure/solar-access') {
            setCurrentMenu('solar-access');
        }
        else if (pathname === '/configure/irradiance') {
            setCurrentMenu('irradiance');
        }
        else if (pathname === '/configure/price-calculation') {
            setCurrentMenu('epc');
        }
        else if (pathname === '/configure/what-if') {
            setCurrentMenu('whatif');
        }
        else if (pathname === '/configure/tree-cart') {
            setCurrentMenu('treecart');
        }
        else if (pathname === '/configure/building/engineering-letter') {
            setCurrentMenu('');
        }
        else if (pathname === '/configure/building/engineering-affidavit') {
            setCurrentMenu('');
        }
    }, [pathname]);



    const handleToolClick = (e) => {
        setCurrentTool([]);
    };


    const handleCalculateRoofSquare = () => {
        SceneViewer.calculateRoofSquare();
    }

    const handleToggleLayer = (layerName) => {
        const previousState = layerVisibilityState[layerName];

        setLayerVisibilityState((prevState) => ({
            ...prevState,
            [layerName]: !prevState[layerName]
        }));

        SceneViewer.setVisibleGroup(layerName, !previousState);
    };

    const handleChangeImagery = (imagery) => {
        const imageryLabels = document.getElementsByClassName('imagery-label');

        for (let i = 0; i < imageryLabels.length; i++) {
            imageryLabels[i].classList.remove('active');
        }

        document.getElementById(imagery + 'ID').classList.add('active');

        SceneViewer.fetchMapImageAndLoadOnPlane(imagery);
    };




    const getFileExtension = (filename) => {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    }


    const readUploadedFile = (e) => {
        //Clear Scene Viewer if not empty
        if (SceneViewer.scene.children.length > 0) {
            SceneViewer.clearScene();
        }
        //Get File
        const file = e.target.files[0];

        //Instantiate FileReader
        const reader = new FileReader();

        //Read File
        reader.readAsText(file);

        //Async function on file load
        reader.onload = async (e) => {
            //Get File Extension
            const fileExtension = getFileExtension(file.name);
            //File Content
            const fileContent = e.target.result;

            //Check File Extension and call appropriate loader from SceneViewer
            if (fileExtension === 'json') {
                //Parse JSON
                const jsonParsedData = JSON.parse(fileContent);

                window.sessionStorage.setItem("sitejson", JSON.stringify(jsonParsedData));

                //Load JSON roof

                await LoadModelJson(SceneViewer, jsonParsedData);

                if (file.name.split("_")) {
                    const site_address_arr = file.name.split("_")
                    let siteAddressString = ""

                    site_address_arr.forEach((word) => {
                        siteAddressString = siteAddressString + " " + word
                    })


                    let site_address_without_dot_json_arr = siteAddressString.split(".")

                    let finalAddress = ""

                    site_address_without_dot_json_arr.forEach((word) => {
                        if (word !== "json") {
                            finalAddress = finalAddress + " " + word
                        }
                    })

                    useViewerStore.setState({ siteAddress: finalAddress });
                }


            } else if (fileExtension === 'xml') {

                const loadingContext = new LoadingContext();

                //Load XML roof
                loadingContext.setMessage({ message: 'Reading XML file...'});

                await LoadModelXML(SceneViewer, fileContent);

                loadingContext.dispose()
            }
            navigate("/configure/roof");
            // document.getElementById("tabIcon").click()

        };
    }

    const fileUploadHandler = () => {
        let fileInput = document.getElementById('fileInput');
        fileInput.click();
    }


    const sidebarItems = [
        {
            key: 'ModelSite',
            title: 'Model Site',

            // icon: <SquaresFour size={28} weight='fill'/>,
            icon: <span
                title={"Edit"}
                className={"left-menu-icon-wrapper"}
               >
                    <SquaresFour size={28} weight='fill'/>
                </span>,
            children: [
                {
                    label: 'Building (B)',
                    key: 'building',
                    icon: <Buildings size={24} weight='fill'/>,
                    onClick: () => {
                        if (hasCapability("View_Building_Attributes")) {
                            navigate('/configure/building')
                        } else {
                            alert("You don't have access to this feature");
                        }
                    }
                },
                {
                    label: 'Roof (R)',
                    key: 'roof',
                    icon: <HouseSimple size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/roof')
                },
                {
                    label: 'Obstruction (O)',
                    key: 'obstruction',
                    icon: <Cube size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/obstruction')
                },
                {
                    label: 'Tree (T)',
                    key: 'tree',
                    icon: <TreeEvergreen size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/tree')
                },
            ],
        },
        {
            key: 'SystemDesign',
            icon:
                <span
                    title={"System Design"}
                    className={"left-menu-icon-wrapper"}
                >
                <SunHorizon size={28} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    label: 'Modules (M)',
                    key: 'modules',
                    icon: <DotsNine size={24} weight='bold'/>,
                    onClick: () => navigate('/configure/modules')
                },
                {
                    label: 'Shade Point (S)',
                    key: 'solar-access',
                    icon: <Shuffle size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/solar-access')
                },
                {
                    label: 'Irradiance (I)',
                    key: 'irradiance',
                    icon: <Sun size={24} weight='fill'/>,
                    onClick: () => {
                        if (hasCapability("Irradiance")) {
                            navigate('/configure/irradiance')
                        } else {
                            alert("You don't have access to this feature");
                        }
                    }
                },
            ],
        },
        {
            key: 'PowerCalculation',
            icon:
                <span
                    title={"Power+Pricing"}
                    className={"left-menu-icon-wrapper"}
                >
                <Lightning size={28} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    label: 'What If (W)',
                    key: 'whatif',
                    icon: <Question size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/what-if')
                },
                {
                    label: 'EPC Calculation (E)',
                    key: 'epc',
                    icon: <CurrencyCircleDollar size={24} weight='fill'/>,
                    onClick: () => {
                        if (hasCapability('EPC_Calculations')) {
                            navigate('/configure/price-calculation')
                        }
                        else {
                            alert("You don't have access to this feature");
                        }
                    }
                },
                {
                    label: 'Tree Cart (C)',
                    key: 'treecart',
                    icon: <ShoppingCart size={24} weight='fill'/>,
                    onClick: () => navigate('/configure/tree-cart')
                },
            ],
        },
        {
            key: 'AdvancedTools',
            icon:
                <span
                    title={"Surface Draw"}
                    className={"left-menu-icon-wrapper"}
                >
                <PencilLine size={28} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    label: 'Surface Draw (F)',
                    key: 'surfacedraw',
                    icon: <Globe size={24} weight='fill' />,
                    onClick: () => {
                        if (hasCapability('Surface Draw') || hasCapability('Surface_Draw')) {
                            navigate('/configure/surface-draw')
                        }
                        else {
                            alert("You don't have access to this feature");
                        }
                    }
                },
            ],
        },
    ];

    let toolbarItems = [

         {
            key: 'addDesign',
            icon:
                <span
                    title={"Import Aurora/XML File"}
                    className={"left-menu-icon-wrapper"}
                >
                <Faders  size={26} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    label: 'Add Design',
                    key: 'addDesignBtn',
                    icon: <Plus size={24} weight='bold'/>,
                    onClick: fileUploadHandler
                }
            ]
        },

        {
            key: 'map',
            icon:
                <span
                    title={"Map Imagery"}
                    className={"left-menu-icon-wrapper"}
                >
                <MapTrifold size={26} weight='fill'/>
                </span>,
            children: [
                {
                    type: 'group',
                    label: 'Map Services',
                    children: [
                        {
                            label: <span id={`${IMAGERY_OPTIONS.GOOGLE}ID`}
                                         className={"imagery-label active"}>Google</span>,
                            key: 'google',
                            icon: <GoogleLogo size={24} weight='fill'/>,
                            onClick: () => handleChangeImagery(IMAGERY_OPTIONS.GOOGLE),

                        },
                        {
                            label: <span id={`${IMAGERY_OPTIONS.MAPBOX}ID`} className={"imagery-label"}>Mapbox</span>,
                            key: 'mapbox',
                            icon: <MapPin size={24} weight='fill'/>,
                            onClick: () => handleChangeImagery(IMAGERY_OPTIONS.MAPBOX),


                        },
                        {
                            label: <span id={`${IMAGERY_OPTIONS.NEARMAP}ID`} className={"imagery-label"}>Nearmap</span>,
                            key: 'nearmap',
                            icon: <GlobeHemisphereWest size={24} weight='fill'/>,
                            onClick: () => handleChangeImagery(IMAGERY_OPTIONS.NEARMAP),

                        },
                    ],
                },
                {
                    type: 'group',
                    label: 'Others',
                    children: [
                        (
                            hasCapability('Edit_Imagery') &&
                            {
                                label: 'Custom Imagery',
                                key: 'customimagery',
                                icon: <Images size={24} weight='fill'/>,
                                onClick: () => navigate('/configure/custom-image')
                            }
                        )
                    ],
                }
            ]
        },
        (hasCapability('Layers') && {
            key: 'layers',
            icon:
                <span
                    title={"Layers"}
                    className={"left-menu-icon-wrapper"}
                >
                <Stack size={26} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    type: 'group',
                    label: 'Model',
                    className: 'sidebar__layer',
                    children: [
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Roof</span>
                                    {layerVisibilityState.roof ? <Eye size={24} weight='fill'/> : <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'roof',
                            icon: <HouseSimple size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MODEL.ROOF)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Obstruction</span>
                                    {layerVisibilityState.obstruction ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'obstruction',
                            icon: <Cube size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MODEL.OBSTRUCTION)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Tree</span>
                                    {layerVisibilityState.tree ? <Eye size={24} weight='fill'/> : <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'tree',
                            icon: <TreeEvergreen size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MODEL.TREE)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Setbacks</span>
                                    {layerVisibilityState.setback ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'setbacks',
                            icon: <Fire size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MODEL.SETBACK)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Pathways</span>
                                    {layerVisibilityState.pathway ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'pathways',
                            icon: <HashStraight size={24} weight='bold'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MODEL.PATHWAY)
                        },
                    ],
                },
                {
                    type: 'group',
                    label: 'System',
                    className: 'sidebar__layer',
                    children: [
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Modules</span>
                                    {layerVisibilityState.modules ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'modules',
                            icon: <DotsNine size={24} weight='bold'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.SYSTEM.MODULES)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Irradiance</span>
                                    {layerVisibilityState.irradiance ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'irradiance',
                            icon: <SunHorizon size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.SYSTEM.IRRADIANCE)
                        },
                    ],
                },
                {
                    type: 'group',
                    label: 'Maps',
                    className: 'sidebar__layer',
                    children: [
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Maps</span>
                                    {layerVisibilityState.maps ? <Eye size={24} weight='fill'/> : <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'maps',
                            icon: <MapTrifold size={24} weight='bold'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MAPS.MAP)
                        },
                        {
                            label: (
                                <div className='sidebar__layer--item'>
                                    <span>Terrain</span>
                                    {layerVisibilityState.terrain ? <Eye size={24} weight='fill'/> :
                                        <EyeSlash size={24}/>}
                                </div>
                            ),
                            key: 'terrain',
                            icon: <GlobeHemisphereWest size={24} weight='fill'/>,
                            onClick: () => handleToggleLayer(LAYER_OPTIONS.MAPS.TERRAIN)
                        },
                    ],
                },
            ],
        }),
        (hasCapability('View_Roof_Square') && {
            key: 'roofsquare',
            icon:
                <span
                    title={"Show Roof Square"}
                    className={"left-menu-icon-wrapper"}
                >
                <HouseLine size={26} weight='fill'/>
                </span>
                    ,
            children: [
                {
                    label: 'Calculate Roof Square',
                    key: 'calculate',
                    icon: <MathOperations  size={24} weight='bold'/>,
                    onClick: handleCalculateRoofSquare
                }
            ]
        })
    ];


    return (
        user ?

                <>
                    <div className='sidebar'>
                        <input accept={".json,.xml"} onChange={readUploadedFile} id={"fileInput"} hidden type={"file"}/>
                        <div className='sidebar__inner'>
                            <Button
                                title={"Open Drawer"}
                                type='text'
                                icon={<UserCircle size={28} weight='fill'/>}
                                size='large'
                                onClick={() => setIsSidebar(true)}
                            />
                            <Menu
                                onClick={handleMenuClick}
                                selectedKeys={[currentMenu]}
                                mode='vertical'
                                items={sidebarItems}
                                expandIcon={null}
                                triggerSubMenuAction='click'
                            />
                        </div>

                        <div className='sidebar__inner'>
                            <Menu
                                onClick={handleToolClick}
                                selectedKeys={currentTool}
                                mode='vertical'
                                items={toolbarItems}
                                expandIcon={null}
                                triggerSubMenuAction='click'
                            />
                        </div>
                    </div>

                    <AntDrawer
                        open={isSidebar}
                        onClose={() => setIsSidebar(false)}
                        placement='left'
                        closeIcon={
                            <Flex
                                justify={'center'}
                                align={'center'}
                                gap={5}
                                style={{width: '200px !important', paddingLeft: '10px !important', cursor: 'pointer !important'}}
                            ><XCircle size={32} />Close</Flex>

                        }
                        className={'left-drawer'}
                    >

                        <Space
                            direction='horizontal'
                        >
                            <Avatar
                                size={50}
                                src={<img src='http://www.gravatar.com/avatar/?d=mp' alt='avatar'/>}
                            />
                            <Flex
                                vertical
                                justify={'center'}
                                align={'left'}
                            >
                                <h4 className='user__name'>{user.user_name}</h4>
                                <span className='user__email'>{user.email}</span>

                            </Flex>
                        </Space>

                        <Divider/>


                        <Space
                            direction='vertical'
                            style={{width: '100%'}}
                        >
                            <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}>
                                <AddressBook size={32}/>Address
                            </Flex>
                            <br/>
                            <span
                                className='user__label'>{siteAddress ?? "No address found"}</span>
                        </Space>
                        <Divider/>

                        <DesignList
                            resetLayerVisibilityStateToDefault={resetLayerVisibilityStateToDefault}
                        />

                        <Divider/>
                        <Flex justify={'center'} className='sidebar_buttons'>
                            <FinalizeTable setIsSidebar={setIsSidebar}/>
                        </Flex>
                    </AntDrawer>
                </>
        :""
    );
}

export default Drawer;
