import retry from 'retry';

export async function retryPromise(func, options) {
    const operation = retry.operation(options);

    return new Promise((resolve, reject) => {
        operation.attempt((currentAttempt) => {
            Promise.resolve(func(currentAttempt))
                .then(r => resolve(r))
                .catch(err => {
                    if (operation.retry(err)) {
                        return;
                    }

                    reject(operation.mainError());
                });
        })
    });
}
