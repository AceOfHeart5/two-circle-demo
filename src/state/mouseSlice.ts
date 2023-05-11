import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface MouseState {
    x: number,
    y: number,
}

const initialState: MouseState = {
    x: 0,
    y: 0,
};

export const mouseSlice = createSlice({
    name: "mouse",
    initialState,
    reducers: {
        mouseSetPosition: (state, action: PayloadAction<{ x: number, y: number }>) => {
            state.x = action.payload.x;
            state.y = action.payload.y;
        },
    }
});

export const { mouseSetPosition } = mouseSlice.actions;

export const selectMousePositionX = (state: RootState) => state.mouse.x;
export const selectMousePositionY = (state: RootState) => state.mouse.y;

export default mouseSlice.reducer;
