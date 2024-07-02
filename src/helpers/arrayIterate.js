export function* iterateCircular(arr, startIdx, increment = true) {
    const delta = increment ? 1 : -1;
    let idx = startIdx;

    do {
        yield {
            item: arr[idx],
            index: idx,
        };

        idx += delta;
        if (idx === arr.length) {
            idx = 0;
        } else if (idx === -1) {
            idx = arr.length - 1;
        }
    } while (idx !== startIdx);
}
