import React from 'react';
import {useNavigate} from "react-router-dom";

const SitesHeader = ({children}) => {

    return (
        <>
            <div className='sites-header'>
                <div className='sites-header--search'>
                    {children}
                </div>
            </div>
        </>
    );
}

export default SitesHeader;
