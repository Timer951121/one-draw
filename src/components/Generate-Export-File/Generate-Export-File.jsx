import React, {useContext, useEffect, useState} from "react";
import { useNavigate} from "react-router-dom";
import DirectLayoutPDFGenerator from "../Reports/PDF/Direct_Layout";
import MeasurePdfGenerator from "../Reports/PDF/Measure_Layout";
import SiteReportPdfGenerator from "../Reports/PDF/Site_Report";
import {ViewerContext} from "../../contexts/ViewerContext";
import {UserContext} from "../../contexts/UserContext";
import {Button, Divider, Flex, Select,message} from "antd";
import {FileCode, FilePdf,FileText   } from "@phosphor-icons/react";
import { MdOutlineEngineering } from "react-icons/md";
import EnggDocsButton from "../EnggDoc/EngDocsBtn";
import {useViewerStore} from "../../store/store";
import { BsShieldFillExclamation, BsShieldLockFill, BsShieldFillCheck } from "react-icons/bs";
import siteService from "../../services/siteService"
import {getDesignVersionList} from '../../services/designVersionService';


const GenerateExportFile = ({setIsSidebar}) => {
    const { Option } = Select;
    const {SceneViewer} = useContext(ViewerContext);
    const {hasCapability} = useContext(UserContext);
    const {designList, selectedDesignIndex,masterDataList,setDesignList} = useViewerStore(state => state);
    const [certification,setCertification] = useState(designList[selectedDesignIndex]?.Design_Certification_Status?getValueByLabel(designList[selectedDesignIndex].Design_Certification_Status):undefined)
    const [cerOption, setCerOption] = useState()
    const [enableEditCer] = useState(hasCapability("Pre_Installed_Certified") || hasCapability("Install_Change_Certified") || hasCapability("As_Built_Certified") || hasCapability("Certified_Design_Override"))
    const [buttonDisable,setButtonDisable] = useState(false)
    const [cerLoader, setCerLoader] = useState(false)
    const stage = sessionStorage.getItem('currentStage');
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const alertMessage = (type, content) => {
        messageApi.open({
          //type:type,
          content: content,
          className:
            type === "error"
              ? "alertError"
              : type === "success"
              ? "alertSuccess"
              : "",
        });
      };
    const exportJson = () => {
        SceneViewer.exportJson();
    }
    const onClickEngLetter = () =>{
        navigate("/configure/building/engineering-letter");
        setIsSidebar(false);
    }

    const onClickEngAffidavit = () =>{
        navigate("/configure/building/engineering-affidavit");
        setIsSidebar(false);

    }
    function getValueByLabel(label) {
        for (const item of masterDataList?.DesigCertificationStatus) {
          if (item.label === label) {
            return item.value;
          }
        }
        return undefined;
      }
      useEffect(()=>{
        if(designList[selectedDesignIndex]?.Design_Certification_Status && (getValueByLabel(designList[selectedDesignIndex].Design_Certification_Status) !== certification)){
            setButtonDisable(true)
        }
        else{
            setButtonDisable(false)
        }
      },[certification])
      useEffect(()=>{
        if(selectedDesignIndex>=0){
            setCertificationOptions()
            setCertification(designList[selectedDesignIndex]&&designList[selectedDesignIndex].Design_Certification_Status?getValueByLabel(designList[selectedDesignIndex].Design_Certification_Status):undefined)      
        }
      },[selectedDesignIndex,designList])

    const setCertificationOptions = ()=>{
        setCerOption(
            masterDataList?.DesigCertificationStatus?.map(item => {
                let newItem = {};
            
                switch (item.label) {
                    case "Pre-Install Certified":
                        newItem = {
                            value: item.value,
                            label: 'Pre-Installed Certified',
                            icon: <BsShieldFillCheck color={Number(stage) < 4 || Number(stage) > 10 || !enableEditCer?"":"#5aac5a"} />,
                            enabled: Number(stage) >= 4 && Number(stage) <= 7 && hasCapability("Pre_Installed_Certified")
                        };
                        break;
                    case "Install Change Certified":
                        newItem = {
                            value: item.value,
                            label: 'Install Change Certified',
                            icon: <BsShieldFillCheck color={Number(stage) < 4 || Number(stage) > 10 || !enableEditCer?"":"#5aac5a"} />,
                            enabled: hasCapability("Install_Change_Certified") && (Number(stage) === 7 
                                || (designList[selectedDesignIndex]?.Design_Certification_Status==="Pre-Install Certified"))
                        };
                        break;
                    case "As-Built Certified":
                        newItem = {
                            value: item.value,
                            label: 'As Built Certified',
                            icon: <BsShieldLockFill color={Number(stage) < 4 || Number(stage) > 10 || !enableEditCer?"":"#5aac5a"} />,
                            enabled: hasCapability("As_Built_Certified") && ((Number(stage) >= 7 && Number(stage) <= 10) 
                            || (designList[selectedDesignIndex]?.Design_Certification_Status==="Pre-Install Certified") 
                            || (designList[selectedDesignIndex]?.Design_Certification_Status==="Install Change Certified"))
                        };
                        break;
                    case "Certified Design Override":
                        newItem = {
                            value: item.value,
                            label: 'Certified Design Override',
                            icon: <BsShieldFillExclamation color={Number(stage) < 4 || Number(stage) > 10 || !enableEditCer?"":"#5aac5a"} />,
                            enabled: hasCapability("Certified_Design_Override") && ((Number(stage) >= 4 && Number(stage) <= 10)
                            && ((designList[selectedDesignIndex]?.Design_Certification_Status==="Pre-Install Certified") 
                            || (designList[selectedDesignIndex]?.Design_Certification_Status==="Install Change Certified")
                            || (designList[selectedDesignIndex]?.Design_Certification_Status==="As-Built Certified")))
                        };
                        break;
                    default:
                        break;
                }
            
                return newItem;
            })
        )
    } 
    const handleCertification = (value)=>{
        setCertification(value)
    }
    const handlrCertify = async()=>{
        setCerLoader(true)
        const response = await siteService.saveDesignCertification(designList[selectedDesignIndex].DesignID,certification);
        if(response ==="Design Certification Status Updated Successfully"){
            const SalesForceId = sessionStorage.getItem('SalesForceId');
            const designList = await getDesignVersionList(SalesForceId);
            setDesignList(designList);
            alertMessage("success", "Design Certification Status Updated Successfully");
        }else{
            alertMessage("error", "Something went wrong. Please try later.");
        }
        setCerLoader(false)

    }
   
    return (

        <Flex vertical gap={20} style={{width: "90%"}}>
            {selectedDesignIndex >= 0 &&(
                <>
                {contextHolder}
                <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}> <FileText  size={32}/>Design Certification</Flex>
                    <Select
                        size="large"
                        placeholder="Select Certification Status"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={certification?certification:"Not Certified"}
                        onChange={(value)=> handleCertification(value)}
                        disabled = {Number(stage) < 4 || Number(stage) > 10 || !enableEditCer}
                    >
                        {cerOption?.map((option, index) => {
                            return(
                            <Option value={option.value} key={index} disabled ={!option.enabled}>{option.label} {option.icon}</Option>
                            )
                        })}
                    </Select>
                    <Button type='primary' size='medium' block onClick={handlrCertify} disabled = {Number(stage) < 4 || !buttonDisable || certification===undefined || !enableEditCer} loading={cerLoader}>Certify</Button>
                <Divider/>
                </>
            )
            }
            <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}> <FilePdf size={32}/>Reports</Flex>

            {hasCapability('Direct_Layout') && <DirectLayoutPDFGenerator/>}

            {hasCapability('Measure_Layout') && <MeasurePdfGenerator/>}

            {(hasCapability('oneDRAW_Site_Report') || hasCapability('Genesis_Site_Report')) &&
                <SiteReportPdfGenerator/>}



            <Divider/>

            { hasCapability('.GEN') &&
                    <>
                        <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}><FileCode size={32} />.GEN
                            File</Flex>
                        <Button type='primary' size='large' block onClick={() => exportJson()}>Export .Gen File</Button>
                        
                    </>
            }

            { hasCapability('Download_Engineering') &&
                    <>
                        <Flex justify={'left'} align={'center'} gap={5} className={"sidebar-headings"}><MdOutlineEngineering size={32} />Engineering</Flex>
                        <Button type='primary' size='large' block onClick={onClickEngLetter}>Engineering Letter</Button>
                        <Button type='primary' size='large' block onClick={onClickEngAffidavit}>Final Engineering Affidavit</Button>
                        <EnggDocsButton />
                    </>
            }
        </Flex>

    )
}

export default GenerateExportFile;