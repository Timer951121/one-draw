import React, {useContext} from 'react';
import {Toggle} from "../../../components";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";


const TreeCarrSideBar = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const isTreeLabelVisible = useViewerStore(state => state.isTreeLabelVisible);

    const toggleTreeNameLabel = () => {

        useViewerStore.setState({isTreeLabelVisible: !isTreeLabelVisible})

        SceneViewer.toggleTreeLabel();
    }

    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text tab__title--flex">
                        Tree Cart
                    </span>
                </div>


                <div className='tab__column'>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Show Tree Label</span>
                        <Toggle
                            on={isTreeLabelVisible}
                            onChange={toggleTreeNameLabel}
                        >
                        </Toggle>
                    </div>
                </div>


            </div>
        </>
    );
}

export default TreeCarrSideBar;