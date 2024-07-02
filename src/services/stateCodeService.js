const getStateCodeFromStateName = (stateName) => {

    switch (stateName) {
        case 'California':
            return 'CA';
        case 'Connecticut':
            return 'CT';
        case 'New Jersey':
            return 'NJ';
        case 'Massachusetts':
            return 'MA';
        case 'New Hampshire':
            return 'NH';
        case 'Rhode Island':
            return 'RI';
        case 'Vermont':
            return 'VT';
        case 'Virginia':
            return 'VA';
        case 'Pennsylvania':
            return 'PA';
        case 'Maryland':
            return 'MD';
        case 'Florida':
            return 'FL';
        case 'Delaware':
            return 'DE';
        case 'New York':
            return 'NY';
        default:
            return 'CT';
    }
}

export default getStateCodeFromStateName;