import {Button} from "../index";
import {MdClose} from "react-icons/md";
import React, {useContext, useEffect} from "react";
import {ViewerContext} from "../../contexts/ViewerContext";
import {useViewerStore} from "../../store/store";

const Alert = ({icon, title, message, messageType}) => {

    const {SceneViewer} = useContext(ViewerContext);

    const viewerAlert = useViewerStore(state => state.viewerAlert);

    useEffect(() => {
        const toastElement = document.getElementById('three-js-toast');

        const removeClasses = () => {
            toastElement.classList.remove(...['three-positive', 'three-negative', 'three-warning-message', 'three-info']);
        };

        removeClasses();

        switch (messageType) {
            case 'success':
                toastElement.classList.add('three-positive');
                break;
            case 'error':
                toastElement.classList.add('three-negative');
                break;
            case 'warning':
                toastElement.classList.add('three-warning-message');
                break;
            case 'info':
                toastElement.classList.add('three-info');
                break;
            default:
                toastElement.classList.add('three-info');
                break;
        }

    }, [viewerAlert]);

    const closeThreeJSAlert = () => {
        SceneViewer.removeViewerAlert()
    }


    return (
        <div id={"three-js-toast"} className={`alert ${viewerAlert && 'open'} three-warning`}>
            <div className='alert__header alert-container'>

                <div className='alert__header--column'>
                    {icon}
                    <span className='alert__title'>{title}</span>
                </div>
                <Button variant='btn-clear' size='btn-resize' className='alert__close' onClick={closeThreeJSAlert}>
                    <MdClose size={24}/>
                </Button>

            </div>
            <p style={{whiteSpace: "pre-line"}} className='alert__content'>{message}</p>
        </div>
    )
}


export default Alert;
