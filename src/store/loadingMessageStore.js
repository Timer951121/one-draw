import {create} from 'zustand';

export const useLoadingMessageStore = create((set) => ({
    loadingMessages: [],

    addLoadingMessage: message => set(state => ({loadingMessages: [...state.loadingMessages, message]})),
    removeLoadingMessage: message => set(state => ({
        loadingMessages: state.loadingMessages
            .filter(m => (message.id && m.id !== message.id)
                || !message.id && !(m.title === message.title && m.message == message.message))
    })),

    clearLoadingMessages: () => set(() => ({loadingMessages: []})),
}));

export async function withLoadingMessage(func, message) {
    try {
        useLoadingMessageStore.getState().addLoadingMessage(message);
        await Promise.resolve(func());
    } finally {
        useLoadingMessageStore.getState().removeLoadingMessage(message);
    }
}

export function beginLoadingMessage(message) {
    useLoadingMessageStore.getState().addLoadingMessage(message);
    return {
        end: () => useLoadingMessageStore.getState().removeLoadingMessage(message),
    };
}

export class LoadingContext {
    constructor() {
        this.id = Math.random();
        this.defaultTitle = null;
    }

    setDefaultTitle(title) {
        this.defaultTitle = title;
    }

    setMessage(message) {
        useLoadingMessageStore.getState().removeLoadingMessage({ id: this.id });
        useLoadingMessageStore.getState().addLoadingMessage({
            title: this.defaultTitle,
            ...message,
            id: this.id,
        });
    }

    dispose() {
        useLoadingMessageStore.getState().removeLoadingMessage({ id: this.id });
    }
}
