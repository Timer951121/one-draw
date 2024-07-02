import React, { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';
import {Button, Divider} from 'antd';
import { useViewerStore } from "../../store/store";

const Note = ({icon, title, content, close}) => {

    const [expand, setExpand] = useState(true);

    const aHJ_Township = useViewerStore(state => state.aHJ_Township);

    const setbackNotes = useViewerStore(state => state.setbackNotes);


    const handleExpand = () => setExpand(!expand);

    useEffect(() => {
        const handleMedia = () => {
            if (window.innerWidth < 1025) {
                setExpand(false);
            } else {
                setExpand(true);
            }
        }

        handleMedia();

        const timer = setTimeout(() => {
            setExpand(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, [window.innerWidth]);

    return (
        <>
            <div className={`note ${expand ? 'expand' : 'collapse'}`}>
                <div className='note__wrapper'>
                    <div className='note__header'>
                        <div className='note__header--column'>
                            {icon}
                            <span className='note__title'>{title}</span>
                        </div>

                        <div className='note__header--column gap-1'>
                            <Button type='text' size='small' className='note__expand'
                                    onClick={handleExpand}>
                                <MdClose/>
                            </Button>
                        </div>
                    </div>
                    <Divider/>
                    <div className='note__title'>AHJ Township : {aHJ_Township}</div>
                    <Divider/>
                    {setbackNotes.map((item, index) => {
                            return (
                                <ul key={index}>
                                    <li><p className='note__content' key={index}>{index + 1} - {item}</p></li>
                                    <br/>
                                </ul>

                            )
                        })
                    }
                </div>
                <Button
                    type='default'
                    size='large'
                    icon={icon}
                    className={`note__toggle ${expand && 'show'}`}
                    onClick={handleExpand}>
                </Button>
            </div>
        </>
    );
}

export default Note;