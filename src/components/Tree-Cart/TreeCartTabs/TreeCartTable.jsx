import React, {useEffect, useState, useContext} from "react";
import {useViewerStore} from "../../../store/store";
import {ViewerContext} from "../../../contexts/ViewerContext";
import TreeCartItem from "../TreeCartItem";
import { Button, Col, Row } from "antd";
import TreeCartForm from "../TreeCartForm";

const TreeCartTable = () => {

    const {SceneViewer} = useContext(ViewerContext);
    const [refresher, setRefresher] = useState(false);
    const [treeCartTotalCost, setTreeCartTotalCost] = useState(0);
    const {treeCartItems} = useViewerStore((state)=>({
        treeCartItems: state.treeCartItems
    }));
    
    const treeColumn = [
        {title: 'Tree ID'},
        {title: 'Location'},
        {title: 'DBH'},
        {title: 'Height'},
        {title: 'Stump'},
        {title: 'Haul Wood'},
        {title: 'No. of Obst'},
        {title: 'Total'},
    ];
 
    
    //whenever treeCartItems changes show loader
    useEffect(() => {
        setRefresher(!refresher);
        setTreeCartTotalCost(0);  
        recalculateTreeCartTotal(); 
    }, [treeCartItems]);


    const recalculateTreeCartTotal = () => { 
        let total = 0;  
         
        treeCartItems?.map((cartTree)=>{
            total += cartTree.userData.treeCartInfo?.total | 0;
            setTreeCartTotalCost(total);   
        });   
    }
    const EditCart = (treeId) => {
        //Add Tree Form
        SceneViewer.viewerAlert({
            show: true,
            title: "Fill Tree Info",
            message: <TreeCartForm
                selectedTrees={treeCartItems}
                onSubmit={()=> {
                    // SceneViewer.refreshShade(false);
                }}
            />,
            messageType: "info",
            isModal: true,
        }) 
    }


    return (

        <>
            <div
                style={{
                    position: 'sticky',
                    left: '0',
                }}
            >
                <p
                    style={{
                        fontSize: '1.2rem',
                    }}
                >
                    Number of Trees : <b>{treeCartItems?.length}</b>
                </p>
             <Row className="mb-1" style={{alignItems:"baseline"}}>
                <Col lg={12}>
                <p
                    style={{
                        fontSize: '1.2rem',
                    }}
                >
                    <span>Tree Quote :  $ </span> 
                    <span id={"treeCartTotalCost"}>
                    <b>
                        {treeCartTotalCost}
                    </b>
                    </span>
                </p>
                </Col>
                <Col lg={12} style={{display:"flex",justifyContent:"flex-end"}}>
                    <Button type="primary" size="middle" title="Edit Cart" onClick={EditCart} >Edit Tree Cart</Button>
                </Col>
                </Row>
            </div>


            <table className={"tab__table"}>
                <thead>
                <tr>
                    {treeColumn.map((item, index) => (
                        <th key={index}>{item.title}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {treeCartItems?.map((data, index) => (
                    <tr key={index}>
                        <TreeCartItem data={data}/>
                    </tr>
                ))}
                </tbody>
            </table>


        </>
    )
}

export default TreeCartTable;