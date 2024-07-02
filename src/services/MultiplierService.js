import axios from 'axios';
import { retryPromise } from '../helpers/retryPromise';

export async function getAccessMultiplier(payload) {
    const response = await retryPromise(async () => {
        const response = await fetch(process.env.REACT_APP_BASE_URL + process.env.REACT_APP_PVWATTS_MULTIPLIER_COMMON_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(response);
        }

        return response;
    }, {
        retries: 20,
        factor: 2,
        minTimeout: 200,
        maxTimeout: 60 * 1000,
        randomize: true
    });

    return await response.json();
}


export async function getIdealMultiplier(latitude, longitude, tilt, azimuth) {
    const apiUrl = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_PVWATTS_IDEAL_API_URL}?Lat=${latitude}&Lon=${longitude}&Tilt=${Math.round(tilt)}&Azimuth=${Math.round(azimuth)}`;

    const data = await retryPromise(async () => {
        const res = await axios.post(apiUrl);
        if (res.status !== 200) {
            throw new Error('API request failed');
        }

        return res.data;
    }, {
        retries: 20,
        factor: 2,
        minTimeout: 200,
        maxTimeout: 60 * 1000,
        randomize: true
    });

    return data;
}
