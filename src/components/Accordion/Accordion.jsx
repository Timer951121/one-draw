import React, {useState} from 'react';
import {FiChevronDown} from 'react-icons/fi';

const Accordion = ({children, title, active}) => {

    const [open, setOpen] = useState(active ? true : false);
    const handleOpen = () => setOpen((prev) => !prev);

    return (
        <div className='accordian'>
            <div
                className={`accordian__title ${open ? 'open' : 'closed'}`}
                onClick={handleOpen}
            >
                {title}
                <FiChevronDown size={20}/>
            </div>
            {open && (
                <div className={`accordian__content ${open ? 'open' : 'closed'}`}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default Accordion;