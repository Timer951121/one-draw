import { retryPromise } from '../helpers/retryPromise';

async function getLocationCode(latitude, longitude) {
    const locationCodeFetchURL = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_PVWATTS_LOCATION_CODE_URL}?Lat=${latitude}&Lon=${longitude}&Azimuth=128.8269&Tilt=18`;

    const response = await retryPromise(async () => {
        const response = await fetch(locationCodeFetchURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(response);
        }

        return response;
    }, {
        retries: 10,
        factor: 2,
        minTimeout: 200,
        maxTimeout: 60 * 1000,
        randomize: true
    });

    const json = await response.json();
    return json['LocationCode'];
}

export default getLocationCode;
