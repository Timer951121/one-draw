import {create} from 'zustand';

export const useSceneStore = create((set) => ({
    selectedTrees: [],
    selectedObstruction: undefined,
    obstUpdated : false,
    setSelectedTrees: trees => set(() => ({selectedTrees: trees})),
    addSelectedTree: tree => set(state => ({ selectedTrees: [...state.selectedTrees, tree] })),
    removeSelectedTree: tree => set(state => ({ selectedTrees: state.selectedTrees.filter(t => t.obstId !== tree.obstId) })),
    toggleSelectedTree: tree => set(state => {
        const idx = state.selectedTrees.findIndex(t => t.obstId === tree.obstId);
        if (idx != -1) {
            return ({ selectedTrees: [...state.selectedTrees.slice(0, idx), ...state.selectedTrees.slice(idx + 1)] });
        } else {
            return ({ selectedTrees: [...state.selectedTrees, tree] });
        }
    }),

    setSelectedObstruction: obst => set(() => ({selectedObstruction: obst})),
}));
