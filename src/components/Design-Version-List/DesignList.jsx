import {Flex} from 'antd';
import siteService from "../../services/siteService";
import {LoadModelJson} from "../Three-JS-Viewer/Controllers/Loader";
import {useViewerStore} from "../../store/store";
import React, {useContext, useState} from "react";
import {ViewerContext} from "../../contexts/ViewerContext";
import {HouseLine, TreeStructure} from "@phosphor-icons/react";
import {VscNewFolder} from "react-icons/vsc";
import {FiChevronUp} from "react-icons/fi";
import { IoIosLock, IoIosUnlock  } from "react-icons/io";
import { BsShieldFillExclamation, BsShieldLockFill, BsShieldFillCheck  } from "react-icons/bs";

const DesignList = ({resetLayerVisibilityStateToDefault}) => {

    const {SceneViewer} = useContext(ViewerContext);
    const {designList, selectedDesignIndex, setSelectedDesign} = useViewerStore(state => state);
    const [toggle, setToggle] = useState(false);
    const stage = sessionStorage.getItem('currentStage');
    const toggleDesign = () => setToggle(!toggle);
    const onClickDesign = async (index) => {
        SceneViewer.mapView = true;
        resetLayerVisibilityStateToDefault()
        setSelectedDesign(index);
        designList.map((design) => {
            if(design.Active_Ind === false){
                //For New Design
                useViewerStore.setState({designID: 0});
                useViewerStore.setState({isInActiveDesign: true});
            }
        });
        const opId = sessionStorage.getItem('SalesForceId');
        const designNo = designList[index].Design_No;
        const versionNo = designList[index].Version_No;
        const data = await siteService.retrieveSiteDesignDetailsWithDesignData(opId, designNo, versionNo);
        const designData = JSON.parse(data.DesignDataList[0].Design_Data);
        await LoadModelJson(SceneViewer, designData, 'glb');
    };

    const loadOriginalSite = async () => {
        SceneViewer.mapView = true;
        resetLayerVisibilityStateToDefault()
        useViewerStore.setState({designID: 0});
        setSelectedDesign(-1);
        await SceneViewer.getSite();
    };

    const getLocalTime = (isoString) => {
        const globalTime = new Date(isoString);
        const localTime = new Date(globalTime.getTime() - (globalTime.getTimezoneOffset() * 60000 ));
        return localTime.toLocaleString();
    }

    return (
        <Flex vertical>
            <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}><TreeStructure
                size={32}/>Design & Versioning</Flex>
            <br/>
            <div className={`user__design--toggle ${toggle && 'active'}`} onClick={toggleDesign}>
                <VscNewFolder size={24}/>
                <span className='user__label'>Designs</span>
                <FiChevronUp className='user__design--arrow' size={24}/>
            </div>
            <div className={`user__design--menu menu ${toggle && 'open'}`}>
                <ul className='menu__list'>
                    {
                        designList?.map((design, index) => {

                            return (
                                <li key={index}
                                    className={`menu__item ${selectedDesignIndex == index && 'active'}`}
                                    onClick={() => onClickDesign(index)}>
                                    <HouseLine size={18} className={selectedDesignIndex == index && 'svg_active'} />
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width:"180px"
                                    }}>
                                        <span className='menu__label'>Design : {design.Design_No} - Version : {design.Version_No}</span>
                                        <span>{design.User_Created_Id} - {design.User_Department}
                                            {design.Active_Ind?"": design.Design_Certification_Status !== "Not Certified" && design.Design_Certification_Status !== null?" - Not Active":""}
                                        </span>
                                        <span>{getLocalTime(design.User_Created_Timestamp)}</span>
                                        {Number(stage) >= 4 && Number(stage) <= 10 && design.Design_Certification_Status !== "Not Certified" && design.Design_Certification_Status !== null && (
                                        <div className={`certify ${selectedDesignIndex == index && 'active'}`}> {design.Design_Certification_Status} 
                                        {design.Design_Certification_Status==="As-Built Certified"?<BsShieldLockFill size={14} style={{marginLeft:"10px"}} />
                                        : design.Design_Certification_Status==="Certified Design Override"?<BsShieldFillExclamation size={14} style={{marginLeft:"10px"}}/>
                                        :<BsShieldFillCheck size={14} style={{marginLeft:"10px"}}/>}</div>
                                        )}
                                     
                                    </div>
                                    {design.Design_Certification_Status !== "Not Certified" && design.Design_Certification_Status !== null &&(
                                    <div className={`lock-design ${selectedDesignIndex === index && 'active'}`}>
                                        {design.Design_Certification_Status==="Certified Design Override"?<IoIosUnlock size={25}/>:<IoIosLock  size={25}/>}
                                    </div>
                                    )}
                                </li>
                            )
                        })
                    }
                    <li className={`menu__item ${selectedDesignIndex == -1 && 'active'}`}
                        onClick={() => loadOriginalSite()}>
                        <HouseLine size={18} className={selectedDesignIndex == -1&&'svg_active'}/>
                        <span className='menu__label'>Original Site</span>
                    </li>
                </ul>
            </div>
        </Flex>
    );
}

export default DesignList;