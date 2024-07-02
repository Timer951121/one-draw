import React, {useContext} from "react";
import {useViewerStore} from "../../../store/store";
import { useSceneStore } from "../../../store/sceneStore";
import {ViewerContext} from "../../../contexts/ViewerContext";
import TreeCartForm from "../TreeCartForm";
import {METER, TREE, UnitContext} from "../../../contexts/UnitContext";
import { ChangeTreeDelete } from "../../Three-JS-Viewer/Controllers/ObstructionControl";
import { ImArrowUp } from "react-icons/im";
const TreeInfoTable = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const {treeUnit, convertTypeQuantityToUnit, renderUnit} = useContext(UnitContext);

    const treeColumn = [
        {title: 'Tree ID'},
        {title: 'Diameter'},
        {title: 'Height'},
        {title: 'Multiplier'},
        {title: 'Add to Cart'} 
    ];

    const treeCartItems = useViewerStore.getState().treeCartItems;

    const [, updateState] = React.useState();

    const forceUpdate = React.useCallback(() => updateState({}), []);
 
    const addToCart = (treeId) => {
        const existInCart = useViewerStore.getState().treeCartItems.find((tree) => tree.userData.treeId === treeId)
        if (existInCart){
            alert('This tree is already in cart');
            return;
        }

        const selectedTree = SceneViewer.treeGroup.children.find((tree) => tree.userData.treeId === treeId);
        selectedTree.userData.treeCartInfo = {};   
        selectedTree.userData.treeCartInfo.isFormUpdated = true;
        
        //Add Tree Form
        SceneViewer.viewerAlert({
            show: true,
            title: "Fill Tree Info",
            message: <TreeCartForm
                selectedTrees={[selectedTree]}
                onSubmit={()=> {
                    SceneViewer.refreshShade(false);
                    forceUpdate();
                }}
            />,
            messageType: "info",
            isModal: true,
        }) 
    }

    const removeFromCart = (treeId) => {
        let  treeInCart = useViewerStore.getState().treeCartItems.find((tree) => tree.userData.treeId === treeId);
        
        if (treeInCart) {
            treeInCart.userData.treeCartInfo = {};
            treeInCart.select = false;
            useSceneStore.getState().removeSelectedTree(treeInCart);
            treeInCart.children[0].material.emissive.setHex(0x000000);

            //Remove Tree from cart based on selected tree id
            let updatedCartTrees = useViewerStore.getState().treeCartItems.filter((tree) => tree.userData.treeId !== treeId);
             
            ChangeTreeDelete(treeInCart, false);
            forceUpdate(); 
            SceneViewer.refreshShade(false);
            useViewerStore.setState({treeCartItems: updatedCartTrees}); 
        }
    }

    const highLightTree = (e) => {
        
        const selectedTree = SceneViewer.treeGroup.children.filter((tree) => tree.userData.treeId === e.target.innerText);

        SceneViewer.treeGroup.children.forEach((tree) => {
            if (tree.userData.treeId === e.target.innerText) {
                tree.children[0].material.emissive.set(0x0000ff);
                setTimeout(() => {
                    tree.children[0].material.emissive.set(0x000000);
                }, 500);
            } 
        });

    }


    return (
        <>
            <table size="small" className="tab__table">
                <thead>
                <tr>
                    {treeColumn.map((item, index) => (
                        <th key={index} align="center">{item.title}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {SceneViewer?.treeGroup.children?.map((data, index) => (
                    <tr key={index}>
                        <td onClick={highLightTree} align="center">
                            {data.userData.treeId}
                        </td>
                        <td align="center">
                            {convertTypeQuantityToUnit(TREE, Number(data.userData.crown_radius), METER).toFixed(2)} {renderUnit(treeUnit)}
                        </td>
                        <td align="center">
                            {convertTypeQuantityToUnit(TREE, data.userData.height, METER).toFixed(2)} {renderUnit(treeUnit)}
                        </td>
                        <td align="center" style={{"background": '#545b61', "color": data.userData.multiplier?.color}}>M <ImArrowUp size={10}/>{data.userData.multiplier?.value}</td> 
                        <td align="center">
                            {treeCartItems?.filter((tree) => tree.userData.treeId === data.userData.treeId).length > 0 ? (
                                <button
                                    style={{width: '100px', height: '30px', scale: 0.5, backgroundColor: 'indianred'}}
                                    id={data.userData.treeId}
                                    onClick={(e) => removeFromCart(e.target.id)}
                                    className="btn-primary small">
                                    Remove
                                </button>
                            ) : (
                                <button
                                    style={{width: '100px', height: '30px', scale: 0.5, backgroundColor: 'seagreen'}}
                                    id={data.userData.treeId}
                                    onClick={(e) => addToCart(e.target.id)}
                                    className="btn-primary btn-sm">
                                    Add
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>


        </>

    )
}

export default TreeInfoTable;