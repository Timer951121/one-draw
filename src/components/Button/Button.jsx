import React from 'react';

const STYLES = [
    "btn-clear",
    "btn-primary",
    "btn-accent",
    "btn-light",
    "btn-info",
    "btn-outline",
    "btn-primary-outline"
];

const SIZES = [
    "btn-lg",
    "btn-md",
    "btn-sm",
    "btn-resize"
];

const Button = ({children, type, onClick, className, disabled, variant, size, property, icon, id, title}) => {

    const setButtonStyle = STYLES.includes(variant) ? variant : STYLES[0];
    const setButtonSize = SIZES.includes(size) ? size : SIZES[0];

    return (
        <>
            <button
                title={title}
                id={id}
                type={type}
                onClick={onClick}
                className={`btn ${className} ${setButtonStyle} ${setButtonSize} ${disabled && 'disabled'} btn${property} ${icon && 'btn-icon'}`}
                disabled={disabled}
            >
                {icon && (
                    <span className='btn__icon'>{icon}</span>
                )}
                {children}
            </button>
        </>
    );
}

export default Button;
