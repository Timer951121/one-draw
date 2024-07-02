import React, {useContext, useState} from 'react';
import {FiTrash2} from 'react-icons/fi';
import {Button, RangeSlider, Toggle} from '../../../components';
import {setCustomImagery} from "../../../components/Three-JS-Viewer/Controllers/MapControl";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {customMapSettingList} from '../../../components/Three-JS-Viewer/Controllers/TerrainControl';
import {useViewerStore} from "../../../store/store";
import { logger } from '../../../services/loggingService';

const CustomImageryProps = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const setIsCustomImageryAdded = useViewerStore((state) => state.setIsCustomImageryAdded)
    const isCustomImageryAdded = useViewerStore((state) => state.isCustomImageryAdded)

    const [isDragImagery, setIsDragImagery] = useState(false);


    const fileUploadHandler = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            logger.log("File Loaded");
            let image = new Image();
            image.src = reader.result;
            image.onload = function() {
                logger.log('Image Loaded');
                setCustomImagery(SceneViewer, image );
                // SceneViewer.setVisibleGroup('maps', false);
                SceneViewer.mapMesh.visible = false;
                setIsCustomImageryAdded(true);
            };
        };
    }

    const CustomImageHandler = () => {
        let fileInput = document.getElementById('customImgInput');
        fileInput.click();
    }

    const deleteCustomImage = () => {
        SceneViewer.deleteCustomImagery();
        // SceneViewer.setVisibleGroup('maps', true);
        SceneViewer.mapMesh.visible = true;
        setIsCustomImageryAdded(false)
    }

    const toggleDragImageryHandler = () =>{
        setIsDragImagery(!isDragImagery);
        SceneViewer.setMoveMode(!isDragImagery);
    }

    return (
        <div className='tab__inner'>
            <div className='tab__title'>
                <span className='tab__title--text'>Custom Imagery</span>
                <div className='tab__title--btns'>
                    <Button onClick={deleteCustomImage} variant='btn-clear' size='btn-resize'>
                        <FiTrash2/>
                    </Button>
                </div>
            </div>

            <div className='tab__column'>
                <input accept={".png,.jpg"} onChange={fileUploadHandler} id={"customImgInput"} onClick={(e)=> e.target.value=null}  hidden type={"file"}/>
                <Button className={`active`} variant='btn-primary-outline' size='btn-md' onClick={CustomImageHandler}>Upload
                    Image</Button>
            </div>

            {isCustomImageryAdded &&
                <>
                    <div className='tab__column'>
                        {customMapSettingList.map((item, idx) =>
                            <React.Fragment key={idx}>
                                <span className="tab__column--subtitle">{item.title}</span>
                                <RangeSlider property={`customImage${item.id}`} settings={item.settings}
                                             label={item.label}/>
                            </React.Fragment>
                        )}
                    </div>

                    <br/>
                    <div className='tab__column'>
                        <div className='tab__flex justify-between'>
                            <span className='tab__column--subtitle mb-0'>Move Imagery Using Mouse :</span>
                            <Toggle
                                onChange={toggleDragImageryHandler}
                                on={isDragImagery}
                                property='DragCutomImage'/>
                        </div>
                    </div>
                    {/* <div className='tab__column'>
                        <Button className={`active`} variant='btn-primary-outline' size='btn-md' onClick={autoAlignHandler}>Auto Align</Button>
                    </div> */}
                </>
            }
        </div>
    );
}

export default CustomImageryProps;
