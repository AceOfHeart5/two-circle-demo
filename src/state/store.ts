import { configureStore } from "@reduxjs/toolkit";
import mouseReducer from "./mouseSlice";
import editReducer from "./editingSlice";
import circlesReducer from "./circlesSlice";
import connectionsReducer from "./connectionsSlice";

export const store = configureStore({
    reducer: {
        mouse: mouseReducer,
        edit: editReducer,
        circles: circlesReducer,
        connections: connectionsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
