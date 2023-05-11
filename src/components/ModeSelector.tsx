import { useAppDispatch, useAppSelector } from "../hooks";
import { editSetMode, selectEditMode } from "../state/editingSlice";

const ModeSelector = () => {
    const dispatch = useAppDispatch();

    const mode = useAppSelector(selectEditMode);

    const buttonMargins = "0px 8px";
    const selectedBorder = "4px solid red";

    return <div style={{
        margin: "8px",
        height: "30px",
    }}>
        <button 
            style={{
                margin: buttonMargins,
                border: mode === "add-circle" ? selectedBorder : "",
            }}
            onClick={() => {
                dispatch(editSetMode("add-circle"));
            }}
        >
            Add Circle
        </button>
        <button
            style={{
                margin: buttonMargins,
                border: mode === "move-circle" ? selectedBorder : "",
            }}
            onClick={() => {
                dispatch(editSetMode("move-circle"));
            }}
        >
            Move Circle
        </button>
        <button
            style={{
                margin: buttonMargins,
                border: mode === "remove-circle" ? selectedBorder : "",
            }}
            onClick={() => {
                dispatch(editSetMode("remove-circle"));
            }}
        >
            Remove Circle
        </button>
        <button
            style={{
                margin: buttonMargins,
                border: mode === "add-connection-end" || mode === "add-connection-start" ? selectedBorder : "",
            }}
            onClick={() => {
                dispatch(editSetMode("add-connection-start"));
            }}
        >
            Add Connection
        </button>
    </div>;
};

export default ModeSelector;
