import React from 'react'
import { BsInfoCircleFill } from "react-icons/bs";
import { Tooltip } from 'antd';
import Helptext from "./Helptexts.json"
const HelpText = (props) => {

  const getHelptext = () => {
    const tooltipText = Helptext[props.tooltipkey];
    return (
        <div dangerouslySetInnerHTML={{__html: tooltipText}} />
    )
  }
  return (
        <Tooltip title={getHelptext} >
        <BsInfoCircleFill  size={10} fill="#A47FF1" />
        </Tooltip>    
  )
}

export default HelpText;