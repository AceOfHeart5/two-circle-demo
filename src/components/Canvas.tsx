import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { mouseSetPosition, selectMousePositionX, selectMousePositionY } from "../state/mouseSlice";
import { circlesAdd, selectCircles } from "../state/circlesSlice";
import { selectEditMode } from "../state/editingSlice";
import { distance } from "../utils/utils";
import { CIRCLE_RADIUS } from "../constants";

const Canvas = () => {
    const dispatch = useAppDispatch();
    const refCanvas = useRef<HTMLCanvasElement>(null);

    const editMode = useAppSelector(selectEditMode);

    const mouseX = useAppSelector(selectMousePositionX);
    const mouseY = useAppSelector(selectMousePositionY);

    // mouse interactions
    useEffect(() => {
        const c = refCanvas.current;
        if (!c) return;
        const rect = c.getBoundingClientRect();
        const onMouseMove = (e: MouseEvent) => {
            dispatch(mouseSetPosition({ x: e.x - rect.x, y: e.y - rect.y }));
        };
        c.addEventListener("mousemove", onMouseMove);
        const onClick = (e: MouseEvent) => {
            if (editMode !== "add-circle") return;
            dispatch(circlesAdd({ x: e.x - rect.x, y: e.y - rect.y }));
        };
        c.addEventListener("click", onClick);
        return () => {
            c.removeEventListener("mousemove", onMouseMove);
            c.removeEventListener("click", onClick);
        };
    }, [refCanvas.current, editMode]);

    const circles = useAppSelector(selectCircles);

    // drawing
    useEffect(() => {
        const canvas = refCanvas.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let circleOverlap = false;
        circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            ctx.fillStyle = circle.color;
            ctx.fill();
            if (distance(circle.x, circle.y, mouseX, mouseY) <= CIRCLE_RADIUS * 2) circleOverlap = true;
        });
        if (editMode === "add-circle") {
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, CIRCLE_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = circleOverlap ? "red" : "black";
            ctx.stroke();
        }
    }, [refCanvas.current, mouseX, mouseY, circles]);

    // canvas size
    useEffect(() => {
        if (!refCanvas.current) return;
        refCanvas.current.width = window.innerWidth * 0.5;
        refCanvas.current.height = window.innerHeight * 0.5;
    }, [refCanvas]);

    return <canvas ref={refCanvas} style={{
        border: "1px solid #aaa",
    }}/>;
};

export default Canvas;
