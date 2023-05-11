import { useAppSelector } from "../hooks";
import { selectMousePositionX, selectMousePositionY } from "../state/mouseSlice";

const MouseDisplay = () => {
    const mouseX = useAppSelector(selectMousePositionX);
    const mouseY = useAppSelector(selectMousePositionY);

    return <div>{`Mouse Position: (${mouseX}, ${mouseY})`}</div>
};

export default MouseDisplay;
