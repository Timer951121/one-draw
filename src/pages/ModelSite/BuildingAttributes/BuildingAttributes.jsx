import React, { useEffect, useState } from "react";
import { ClipboardText } from "@phosphor-icons/react";
import { Tab } from "../../../components";
import BuilderAtributesTab from "./BuilderAtributesTab";
import EngineeringSection from "../EngineeringSection/EngineeringSection";
import { useLocation } from "react-router-dom";

const BuildingAttributes = () => {
  const { pathname } = useLocation();
  const [type, setType] = useState("building");
  const bitems = [
    {
      icon: <ClipboardText size={24} weight="fill" />,
      content: <BuilderAtributesTab />,
      title: "Building Attributes",
      is_active: true,
      is_multimenu: false,
    },
  ];
  const engitems = [
    {
      icon: <ClipboardText size={24} weight="fill" />,
      content: <BuilderAtributesTab />,
      title: "Building Attributes",
      is_active: true,
      is_multimenu: true,
      secondcontent: <EngineeringSection />,
    },
  ];

  useEffect(() => {
    if (pathname.includes("engineering-letter")) {
      setType("engineering-letter");
    } else if (pathname.includes("engineering-affidavit")) {
      setType("engineering-affidavit");
    } else {
      setType("building");
    }
  }, [pathname]);

  return (
    <>
      {type === "building" && <Tab items={bitems} />}
      {(type === "engineering-letter" || type === "engineering-affidavit") && (
        <Tab items={engitems} isMultiMenu={true} />
      )}
    </>
  );
};

export default BuildingAttributes;
