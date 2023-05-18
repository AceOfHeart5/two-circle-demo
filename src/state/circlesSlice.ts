import { PayloadAction, createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { CIRCLE_RADIUS } from "../constants";
import { RootState } from "./store";

export interface Circle {
    id: string,
    x: number,
    y: number,
    radius: number,
    color: string,
}

const adapter = createEntityAdapter<Circle>({
    selectId: c => c.id,
});

const circlesSlice = createSlice({
    name: "circles",
    initialState: adapter.getInitialState(),
    reducers: {
        circlesAddOne: (state, action: PayloadAction<{ x: number, y: number }>) => {
            adapter.addOne(state, {
                id: "circle-" + uuid(),
                x: action.payload.x,
                y: action.payload.y,
                radius: CIRCLE_RADIUS,
                color: "#aaa",
            });
        },
        circlesUpdateOne: adapter.updateOne,
        circlesRemoveOne: adapter.removeOne,
    },
});

export const { circlesAddOne, circlesUpdateOne, circlesRemoveOne } = circlesSlice.actions;

const selectors = adapter.getSelectors();

export const selectCirclesAll = (state: RootState) => selectors.selectAll(state.circles);
export const selectCirclesEntities = (state: RootState) => selectors.selectEntities(state.circles);

export default circlesSlice.reducer;
