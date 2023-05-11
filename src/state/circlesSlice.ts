import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { CIRCLE_RADIUS } from "../constants";

interface Circle {
    id: string,
    x: number,
    y: number,
    radius: number,
    color: string,
}

const initialState = {
    array: new Array<Circle>(),
};

const circlesSlice = createSlice({
    name: "circles",
    initialState,
    reducers: {
        circlesAdd: (state, action: PayloadAction<{ id: string, x: number, y: number }>) => {
            state.array = [...state.array, {
                id: action.payload.id,
                x: action.payload.x,
                y: action.payload.y,
                radius: CIRCLE_RADIUS,
                color: "#aaa",
            }];
        },
        circlesUpdateAtIndex: (state, action: PayloadAction<{ index: number, circle: Circle }>) => {
            state.array = [...state.array];
            state.array[action.payload.index] = action.payload.circle;
        },
        circlesDeleteAtIndex: (state, action: PayloadAction<number>) => {
            const index = action.payload;
            state.array = state.array.filter((_v, i) => i !== index);
        },
    },
});

export const { circlesAdd, circlesUpdateAtIndex, circlesDeleteAtIndex } = circlesSlice.actions;

export const selectCircles = (state: RootState) => state.circles.array;

export default circlesSlice.reducer;
