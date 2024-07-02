//This function will check if the token is expired
const tokenValidationService = () => {

    // Get expiry time from local storage
    const storedExpiry = localStorage.getItem('tokenExpiry');

    if (!storedExpiry) {
        return true; // Assume expired if not stored
    }
    // Check if current time is equal or past expiry time
    const expiryDate = new Date(storedExpiry);
    return new Date() >= expiryDate;

}

export default tokenValidationService;
