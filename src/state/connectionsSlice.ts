import { PayloadAction, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { RootState } from "./store";

export interface Connection {
    id: string,
    circle1Id: string,
    circle2Id: string,
}

const adapter = createEntityAdapter<Connection>({
    selectId: c => c.id,
});

const connectionsSlice = createSlice({
    name: "connections",
    initialState: adapter.getInitialState(),
    reducers: {
        connectionAddOne: (state, action: PayloadAction<{ circle1Id: string, circle2Id: string }>) => {
            const circle1Id = action.payload.circle1Id;
            const circle2Id = action.payload.circle2Id;

            if (circle1Id === circle2Id) return;

            for (const id in state.entities) {
                const c = state.entities[id];
                if (!c) continue;
                if (c.circle1Id === circle1Id && c.circle2Id === circle2Id) return;
                if (c.circle1Id === circle2Id && c.circle2Id === circle1Id) return;
            }

            adapter.addOne(state, {
                id: "connection-" + uuid(),
                circle1Id: action.payload.circle1Id,
                circle2Id: action.payload.circle2Id,
            });
        },
        connectionDeleteContainingCircleId: (state, action: PayloadAction<string>) => {
            adapter.removeMany(state, state.ids.filter(id => {
                if (state.entities[id]?.circle1Id === action.payload) return true;
                if (state.entities[id]?.circle2Id === action.payload) return true;
                return false;
            }));
        },
        connectionRemoveOne: adapter.removeOne,
    },
});

export const { connectionAddOne, connectionDeleteContainingCircleId, connectionRemoveOne } = connectionsSlice.actions;

export const selectConnectionsAll = (state: RootState) => adapter.getSelectors().selectAll(state.connections);

export default connectionsSlice.reducer;
