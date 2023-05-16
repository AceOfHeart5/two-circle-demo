import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface Connection {
    id: string,
    circle1Index: number,
    circle2Index: number,
}

const initialState = {
    array: new Array<Connection>(),
};

const connectionsSlice = createSlice({
    name: "connections",
    initialState,
    reducers: {
        connectionAdd: (state, action: PayloadAction<{ id: string, index1: number, index2: number }>) => {
            state.array = [...state.array, {
                id: action.payload.id,
                circle1Index: action.payload.index1,
                circle2Index: action.payload.index2,
            }];
        },
        connectionDeleteContainingCircleIndex: (state, action: PayloadAction<number>) => {
            state.array = state.array.filter(c => c.circle1Index !== action.payload && c.circle2Index !== action.payload);
        },
        connectionDeleteAtIndex: (state, action: PayloadAction<number>) => {
            const index = action.payload;
            state.array = state.array.filter((_v, i) => i !== index);
        },
    },
});

export const { connectionAdd, connectionDeleteContainingCircleIndex, connectionDeleteAtIndex } = connectionsSlice.actions;

export const selectConnections = (state: RootState) => state.connections.array;

export default connectionsSlice.reducer;
