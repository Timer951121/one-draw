import React, {useEffect} from 'react';
import {useViewerStore} from "../../store/store";
import {X} from '@phosphor-icons/react';


const Modal = ({title, children, close, messageType}) => {


    const isSavingInProgress = useViewerStore(state => state.isSavingInProgress)


    return (
        <div className='modal top aligned'>
            <div className='modal__overlay'></div>
            <div className='modal__content'>
                <div className='modal__header'>
                    <span className={'modal__title'}>{title}</span>
                    {
                        !isSavingInProgress &&

                        <span
                            title={'Close'}
                            className={"modal__close__btn"}
                            onClick={() => {
                                close();
                            }}
                        >
                    <X size={20} weight="bold" color={"white"} />
                        </span>
                    }

                </div>
                <div className='modal__inner'>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;