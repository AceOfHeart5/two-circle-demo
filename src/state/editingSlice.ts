import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";

type EditType = "add-circle" | "remove-circle" | "move-circle" | "add-connection-start" | "add-connection-end";

interface EditingState {
    mode: EditType,
}

const initialState: EditingState = {
    mode: "add-circle",
};

export const editSlice = createSlice({
    name: "edit",
    initialState,
    reducers: {
        editSetMode: (state, action: PayloadAction<EditType>) => {
            state.mode = action.payload;
        },
    }
});

export const { editSetMode } = editSlice.actions;

export const selectEditMode = (state: RootState) => state.edit.mode;

export default editSlice.reducer;
