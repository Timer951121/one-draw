const azureLoginValidation = () => {
    const token = localStorage.getItem('token')
    return !!(token && token !== "");
}

export default azureLoginValidation