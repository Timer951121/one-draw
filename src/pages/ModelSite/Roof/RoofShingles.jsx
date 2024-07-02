import React, {useContext} from "react";
import {BiReset} from "react-icons/bi";
import {Accordion, Button, ColorPicker} from "../../../components";
import {ViewerContext} from "../../../contexts/ViewerContext";


import IKO4220199 from "../../../assets/img/roof-shingles/IKO4220199.jpg";
import IKO4973056 from "../../../assets/img/roof-shingles/IKO4973056.jpg";
import IKO4973063 from "../../../assets/img/roof-shingles/IKO4973063.jpg";
import IKO4973081 from "../../../assets/img/roof-shingles/IKO4973081.jpg";
import IKO4973086 from "../../../assets/img/roof-shingles/IKO4973086.jpg";
import IKO4973149 from "../../../assets/img/roof-shingles/IKO4973149.jpg";
import IKO4973150 from "../../../assets/img/roof-shingles/IKO4973150.jpg";
import IKO4973165 from "../../../assets/img/roof-shingles/IKO4973165.jpg";
import IKO4973166 from "../../../assets/img/roof-shingles/IKO4973166.jpg";
import IKO4973195 from "../../../assets/img/roof-shingles/IKO4973195.jpg";
import IKO4973196 from "../../../assets/img/roof-shingles/IKO4973196.jpg";
import IKO4973197 from "../../../assets/img/roof-shingles/IKO4973197.jpg";
import IKO4973198 from "../../../assets/img/roof-shingles/IKO4973198.jpg";
import IKOCABEN from "../../../assets/img/roof-shingles/IKOCABEN.jpg";
import IKOCACHGN from "../../../assets/img/roof-shingles/IKOCACHGN.jpg";
import IKOCADBKN from "../../../assets/img/roof-shingles/IKOCADBKN.jpg";
import IKOCADBKNI from "../../../assets/img/roof-shingles/IKOCADBKNI.jpg";
import IKOCADBRN from "../../../assets/img/roof-shingles/IKOCADBRN.jpg";
import IKOCADGN from "../../../assets/img/roof-shingles/IKOCADGN.jpg";
import IKOCADWN from "../../../assets/img/roof-shingles/IKOCADWN.jpg";
import IKOCAECN from "../../../assets/img/roof-shingles/IKOCAECN.jpg";
import IKOCAHRSN from "../../../assets/img/roof-shingles/IKOCAHRSN.jpg";
import IKOCAMCG from "../../../assets/img/roof-shingles/IKOCAMCG.jpg";
import IKOCAMDB from "../../../assets/img/roof-shingles/IKOCAMDB.jpg";
import IKOCAMDG from "../../../assets/img/roof-shingles/IKOCAMDG.jpg";
import IKOCAMDN from "../../../assets/img/roof-shingles/IKOCAMDN.jpg";
import IKOCAMDV from "../../../assets/img/roof-shingles/IKOCAMDV.jpg";
import IKOCAMDW from "../../../assets/img/roof-shingles/IKOCAMDW.jpg";
import IKOCAMEC from "../../../assets/img/roof-shingles/IKOCAMEC.jpg";
import IKOCAMHS from "../../../assets/img/roof-shingles/IKOCAMHS.jpg";
import IKOCAMWW from "../../../assets/img/roof-shingles/IKOCAMWW.jpg";
import IKOCAWWN from "../../../assets/img/roof-shingles/IKOCAWWN .jpg";
import IKODYNAB from "../../../assets/img/roof-shingles/IKODYNAB.jpg";
import IKODYNBI from "../../../assets/img/roof-shingles/IKODYNBI.jpg";
import IKODYNBS from "../../../assets/img/roof-shingles/IKODYNBS.jpg";
import IKODYNCG from "../../../assets/img/roof-shingles/IKODYNCG.jpg";
import IKODYNCS from "../../../assets/img/roof-shingles/IKODYNCS.jpg";
import IKODYNDS from "../../../assets/img/roof-shingles/IKODYNDS.jpg";
import IKODYNEG from "../../../assets/img/roof-shingles/IKODYNEG.jpg";
import IKODYNFSG from "../../../assets/img/roof-shingles/IKODYNFSG.jpg";
import IKODYNGB from "../../../assets/img/roof-shingles/IKODYNGB.jpg";
import IKODYNGL from "../../../assets/img/roof-shingles/IKODYNGL.jpg";
import IKODYNMR from "../../../assets/img/roof-shingles/IKODYNMR.jpg";
import IKODYNSB from "../../../assets/img/roof-shingles/IKODYNSB.jpg";
import IKOSYCAMAR from "../../../assets/img/roof-shingles/IKOSYCAMAR.jpg";
import IKOSYCAMBW from "../../../assets/img/roof-shingles/IKOSYCAMBW.jpg";
import IKOSYCAMCG from "../../../assets/img/roof-shingles/IKOSYCAMCG.jpg";
import IKOSYCAMDB from "../../../assets/img/roof-shingles/IKOSYCAMDB.jpg";
import IKOSYCAMDG from "../../../assets/img/roof-shingles/IKOSYCAMDG.jpg";
import IKOSYCAMDN from "../../../assets/img/roof-shingles/IKOSYCAMDN.jpg";
import IKOSYCAMDW from "../../../assets/img/roof-shingles/IKOSYCAMDW.jpg";
import IKOSYCAMEC from "../../../assets/img/roof-shingles/IKOSYCAMEC.jpg";
import IKOSYCAMHS from "../../../assets/img/roof-shingles/IKOSYCAMHS.jpg";
import IKOSYCAMWW from "../../../assets/img/roof-shingles/IKOSYCAMWW.jpg";
import OC617393 from "../../../assets/img/roof-shingles/OC617393.jpg";
import OC622185 from "../../../assets/img/roof-shingles/OC622185.jpg";
import OCFDTDJKAM from "../../../assets/img/roof-shingles/OCFDTDJKAM.jpg";
import OCFDTDJKBW from "../../../assets/img/roof-shingles/OCFDTDJKBW.jpg";
import OCFDTDJKCG from "../../../assets/img/roof-shingles/OCFDTDJKCG.jpg";
import OCFDTDJKDT from "../../../assets/img/roof-shingles/OCFDTDJKDT.jpg";
import OCFDTDJKDW from "../../../assets/img/roof-shingles/OCFDTDJKDW.jpg";
import OCFDTDJKEG from "../../../assets/img/roof-shingles/OCFDTDJKEG.jpg";
import OCFDTDJKHB from "../../../assets/img/roof-shingles/OCFDTDJKHB.jpg";
import OCFDTDJKOB from "../../../assets/img/roof-shingles/OCFDTDJKOB.jpg";
import OCFDTDJKQG from "../../../assets/img/roof-shingles/OCFDTDJKQG.jpg";
import OCFDTDJKSW from "../../../assets/img/roof-shingles/OCFDTDJKSW.jpg";
import OCFDTDJKTC from "../../../assets/img/roof-shingles/OCFDTDJKTC.jpg";
import OCFDTDKEAM from "../../../assets/img/roof-shingles/OCFDTDKEAM.jpg";
import OCFDTDKEBW from "../../../assets/img/roof-shingles/OCFDTDKEBW.jpg";
import OCFDTDKECG from "../../../assets/img/roof-shingles/OCFDTDKECG.jpg";
import OCFDTDKECS from "../../../assets/img/roof-shingles/OCFDTDKECS.jpg";
import OCFDTDKEDT from "../../../assets/img/roof-shingles/OCFDTDKEDT.jpg";
import OCFDTDKEDW from "../../../assets/img/roof-shingles/OCFDTDKEDW.jpg";
import OCFDTDKEEG from "../../../assets/img/roof-shingles/OCFDTDKEEG.jpg";
import OCFDTDKEHB from "../../../assets/img/roof-shingles/OCFDTDKEHB.jpg";
import OCFDTDKEOB from "../../../assets/img/roof-shingles/OCFDTDKEOB.jpg";
import OCFDTDKEQG from "../../../assets/img/roof-shingles/OCFDTDKEQG.jpg";
import OCFDTDKESG from "../../../assets/img/roof-shingles/OCFDTDKESG.jpg";
import OCFDTDKESL from "../../../assets/img/roof-shingles/OCFDTDKESL.jpg";
import OCFDTDKESW from "../../../assets/img/roof-shingles/OCFDTDKESW.jpg";
import OCFDTDKETC from "../../../assets/img/roof-shingles/OCFDTDKETC.jpg";
import OCFDTDKETK from "../../../assets/img/roof-shingles/OCFDTDKETK.jpg";


export const roofTextureList = [
    {
        id: 1,
        img: IKO4220199,
        alt: "IKO4220199",
    },
    {
        id: 2,
        img: IKO4973056,
        alt: "IKO4973056",
    },
    {
        id: 3,
        img: IKO4973063,
        alt: "IKO4973063",
    },
    {
        id: 4,
        img: IKO4973081,
        alt: "IKO4973081",
    },
    {
        id: 5,
        img: IKO4973086,
        alt: "IKO4973086",
    },
    {
        id: 6,
        img: IKO4973149,
        alt: "IKO4973149",
    },
    {
        id: 7,
        img: IKO4973150,
        alt: "IKO4973150",
    },
    {
        id: 8,
        img: IKO4973165,
        alt: "IKO4973165",
    },
    {
        id: 9,
        img: IKO4973166,
        alt: "IKO4973166",
    },
    {
        id: 10,
        img: IKO4973195,
        alt: "IKO4973195",
    },
    {
        id: 11,
        img: IKO4973196,
        alt: "IKO4973196",
    },
    {
        id: 12,
        img: IKO4973197,
        alt: "IKO4973197",
    },
    {
        id: 13,
        img: IKO4973198,
        alt: "IKO4973198",
    },
    {
        id: 14,
        img: IKOCABEN,
        alt: "IKOCABEN",
    },
    {
        id: 15,
        img: IKOCACHGN,
        alt: "IKOCACHGN",
    },
    {
        id: 16,
        img: IKOCADBKN,
        alt: "IKOCADBKN",
    },
    {
        id: 17,
        img: IKOCADBKNI,
        alt: "IKOCADBKNI",
    },
    {
        id: 18,
        img: IKOCADBRN,
        alt: "IKOCADBRN",
    },
    {
        id: 19,
        img: IKOCADGN,
        alt: "IKOCADGN",
    },
    {
        id: 20,
        img: IKOCADWN,
        alt: "IKOCADWN",
    },
    {
        id: 21,
        img: IKOCAECN,
        alt: "IKOCAECN",
    },
    {
        id: 22,
        img: IKOCAHRSN,
        alt: "IKOCAHRSN",
    },
    {
        id: 23,
        img: IKOCAMCG,
        alt: "IKOCAMCG",
    },
    {
        id: 24,
        img: IKOCAMDB,
        alt: "IKOCAMDB",
    },
    {
        id: 25,
        img: IKOCAMDG,
        alt: "IKOCAMDG",
    },
    {
        id: 26,
        img: IKOCAMDN,
        alt: "IKOCAMDN",
    },
    {
        id: 27,
        img: IKOCAMDV,
        alt: "IKOCAMDV",
    },
    {
        id: 28,
        img: IKOCAMDW,
        alt: "IKOCAMDW",
    },
    {
        id: 29,
        img: IKOCAMEC,
        alt: "IKOCAMEC",
    },
    {
        id: 30,
        img: IKOCAMHS,
        alt: "IKOCAMHS",
    },
    {
        id: 31,
        img: IKOCAMWW,
        alt: "IKOCAMWW",
    },
    {
        id: 32,
        img: IKOCAWWN,
        alt: "IKOCAWWN",
    },
    {
        id: 33,
        img: IKODYNAB,
        alt: "IKODYNAB",
    },
    {
        id: 34,
        img: IKODYNAB,
        alt: "IKODYNAB",
    },
    {
        id: 35,
        img: IKODYNBI,
        alt: "IKODYNBI",
    },
    {
        id: 36,
        img: IKODYNBS,
        alt: "IKODYNBS",
    },
    {
        id: 37,
        img: IKODYNCG,
        alt: "IKODYNCG",
    },
    {
        id: 38,
        img: IKODYNCS,
        alt: "IKODYNCS",
    },
    {
        id: 39,
        img: IKODYNDS,
        alt: "IKODYNDS",
    },
    {
        id: 40,
        img: IKODYNEG,
        alt: "IKODYNEG",
    },
    {
        id: 41,
        img: IKODYNFSG,
        alt: "IKODYNFSG",
    },
    {
        id: 42,
        img: IKODYNGB,
        alt: "IKODYNGB",
    },
    {
        id: 43,
        img: IKODYNGL,
        alt: "IKODYNGL",
    },
    {
        id: 44,
        img: IKODYNMR,
        alt: "IKODYNMR",
    },
    {
        id: 45,
        img: IKODYNSB,
        alt: "IKODYNSB",
    },
    {
        id: 46,
        img: IKOSYCAMAR,
        alt: "IKOSYCAMAR",
    },
    {
        id: 47,
        img: IKOSYCAMBW,
        alt: "IKOSYCAMBW",
    },
    {
        id: 48,
        img: IKOSYCAMCG,
        alt: "IKOSYCAMCG",
    },
    {
        id: 49,
        img: IKOSYCAMDB,
        alt: "IKOSYCAMDB",
    },
    {
        id: 50,
        img: IKOSYCAMDG,
        alt: "IKOSYCAMDG",
    },
    {
        id: 51,
        img: IKOSYCAMDN,
        alt: "IKOSYCAMDN",
    },
    {
        id: 52,
        img: IKOSYCAMDW,
        alt: "IKOSYCAMDW",
    },
    {
        id: 53,
        img: IKOSYCAMEC,
        alt: "IKOSYCAMEC",
    },
    {
        id: 54,
        img: IKOSYCAMHS,
        alt: "IKOSYCAMHS",
    },
    {
        id: 55,
        img: IKOSYCAMWW,
        alt: "IKOSYCAMWW",
    },
    {
        id: 56,
        img: OC617393,
        alt: "OC617393",
    },
    {
        id: 57,
        img: OC622185,
        alt: "OC622185",
    },
    {
        id: 58,
        img: OCFDTDJKAM,
        alt: "OCFDTDJKAM",
    },
    {
        id: 59,
        img: OCFDTDJKBW,
        alt: "OCFDTDJKBW",
    },
    {
        id: 60,
        img: OCFDTDJKCG,
        alt: "OCFDTDJKCG",
    },
    {
        id: 61,
        img: OCFDTDJKDT,
        alt: "OCFDTDJKDT",
    },
    {
        id: 62,
        img: OCFDTDJKDW,
        alt: "OCFDTDJKDW",
    },
    {
        id: 63,
        img: OCFDTDJKEG,
        alt: "OCFDTDJKEG",
    },
    {
        id: 64,
        img: OCFDTDJKHB,
        alt: "OCFDTDJKHB",
    },
    {
        id: 65,
        img: OCFDTDJKOB,
        alt: "OCFDTDJKOB",
    },
    {
        id: 66,
        img: OCFDTDJKQG,
        alt: "OCFDTDJKQG",
    },
    {
        id: 67,
        img: OCFDTDJKSW,
        alt: "OCFDTDJKSW",
    },
    {
        id: 68,
        img: OCFDTDJKTC,
        alt: "OCFDTDJKTC",
    },
    {
        id: 69,
        img: OCFDTDKEAM,
        alt: "OCFDTDKEAM",
    },
    {
        id: 70,
        img: OCFDTDKEBW,
        alt: "OCFDTDKEBW",
    },
    {
        id: 71,
        img: OCFDTDKECG,
        alt: "OCFDTDKECG",
    },
    {
        id: 72,
        img: OCFDTDKECS,
        alt: "OCFDTDKECS",
    },
    {
        id: 73,
        img: OCFDTDKEDT,
        alt: "OCFDTDKEDT",
    },
    {
        id: 74,
        img: OCFDTDKEDW,
        alt: "OCFDTDKEDW",
    },
    {
        id: 75,
        img: OCFDTDKEEG,
        alt: "OCFDTDKEEG",
    },
    {
        id: 76,
        img: OCFDTDKEHB,
        alt: "OCFDTDKEHB",
    },
    {
        id: 77,
        img: OCFDTDKEOB,
        alt: "OCFDTDKEOB",
    },
    {
        id: 78,
        img: OCFDTDKEQG,
        alt: "OCFDTDKEQG",
    },
    {
        id: 79,
        img: OCFDTDKESG,
        alt: "OCFDTDKESG",
    },
    {
        id: 80,
        img: OCFDTDKESL,
        alt: "OCFDTDKESL",
    },
    {
        id: 81,
        img: OCFDTDKESW,
        alt: "OCFDTDKESW",
    },
    {
        id: 82,
        img: OCFDTDKETC,
        alt: "OCFDTDKETC",
    },
    {
        id: 83,
        img: OCFDTDKETK,
        alt: "OCFDTDKETK",
    }
];


const RoofShingles = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const resetRoofShingleHandler = () => {
        SceneViewer.resetRoofToDefault();
    };

    const roofShingleHandler = (e) => {

        //remove active class from all li
        const li = document.querySelectorAll('.pattern__img');
        li.forEach((item) => {
                item.classList.remove('active');
            }
        );
        e.target.parentNode.classList.add('active');

        SceneViewer.setMeshTexture(SceneViewer.roofMeshArr, e.target.src, "roof", e.target.parentNode.title);
    };

    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text">Roof Shingles</span>
                    <div className="tab__title--btns">
                        <Button
                            onClick={resetRoofShingleHandler}
                            variant="btn-clear"
                            size="btn-resize"
                        >
                            <BiReset/>
                        </Button>
                    </div>
                </div>

                <div className="tab__column">
                    <Accordion title="Select Roof Shingle" active={true}>
                        <ul className="pattern">
                            {roofTextureList.map((item, index) => (
                                <li className="pattern__item" key={index}>
                                    <Button
                                        variant="btn-clear"
                                        size="btn-resize"
                                        className="pattern__img"
                                        title={item.alt}
                                    >
                                        <img onClick={roofShingleHandler} src={item.img} alt={item.alt}/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </Accordion>
                </div>

                <div className="tab__column">
                    <div className="tab__flex justify-between mb-3">
                        <span className="tab__column--subtitle">Roof Color</span>
                        <ColorPicker colorChangeObject={"roof"}/>
                    </div>
                    <div className="tab__flex justify-start gap-0">
                    </div>
                </div>

            </div>
        </>
    );
};

export default RoofShingles;
