import React from 'react';
import { Button } from 'antd';
import {ArrowCounterClockwise, MagnifyingGlass} from '@phosphor-icons/react';
import {GrPowerReset} from "react-icons/gr";

const SearchBar = ({id, name, placeholder, value, className, onChange, onSearch, onReset , onKeyDown}) => {



    return (
        <>
            <div className='search-group'>
                <span className='sites-header--title'>Search Site</span>
                <input
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    className={`form-search ${className}`}
                    onChange={onChange}
                    onKeyDown={onKeyDown}

                />
                <Button
                    type='text'
                    size='large'
                    onClick={onSearch}
                    icon={<MagnifyingGlass size={18} weight='bold' />}
                    className='search-btn'
                    title={'Click to Search'}
                />
                <Button
                    type='text'
                    size='large'
                    onClick={onReset}
                    icon={<ArrowCounterClockwise size={18} weight='bold' />}
                    className='reset-sites-btn'
                    title={'Reset to Default'}
                />


            </div>
        </>
    );
}

export default SearchBar;