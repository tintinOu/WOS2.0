import React from 'react';

/**
 * A floating label input component.
 * Label starts inside the input and floats to top-left on focus or when value exists.
 */
const FloatingLabelInput = ({
    label,
    value,
    onChange,
    type = "text",
    isMissing = false,
    className = "",
    ...props
}) => {
    return (
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" "
                className={`
                    block px-5 pb-2.5 pt-6 w-full text-base font-bold text-gray-900 bg-gray-50 rounded-xl border-2 appearance-none focus:outline-none focus:ring-0 peer transition-all
                    ${isMissing
                        ? 'border-yellow-400 bg-yellow-50 focus:border-yellow-400 placeholder-yellow-600/50'
                        : 'border-transparent focus:border-blue-600/10 focus:bg-white'
                    }
                    ${className}
                `}
                {...props}
            />
            <label
                className={`
                    absolute text-[10px] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-5 
                    peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-xs peer-focus:scale-75 peer-focus:-translate-y-3 font-black uppercase tracking-widest pointer-events-none
                    ${isMissing ? 'text-yellow-600' : 'text-gray-400'}
                `}
            >
                {label}
            </label>
        </div>
    );
};

export default FloatingLabelInput;
