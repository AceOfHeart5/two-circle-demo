import { useCallback, useEffect, useRef, useState } from "react";
import Two from "two.js";
import { useAppDispatch, useAppSelector } from "../hooks";
import { editSetMode, selectEditMode } from "../state/editingSlice";
import { mouseSetPosition, selectMousePositionX, selectMousePositionY } from "../state/mouseSlice";
import { circlesAdd, circlesDeleteAtIndex, circlesUpdateAtIndex, selectCircles } from "../state/circlesSlice";
import { CIRCLE_RADIUS, CONNECTION_COLOR } from "../constants";
import { Circle } from "two.js/src/shapes/circle";
import { useSelector } from "react-redux";
import { distance } from "../utils/utils";
import { ZUI } from "two.js/extras/jsm/zui";
import { Group } from "two.js/src/group";
import { Line } from "two.js/src/shapes/line";
import { connectionAdd, selectConnections } from "../state/connectionsSlice";
import { Shape } from "two.js/src/shape";

const twoAreaDimensions = {
    width: 700,
    height: 700,
};

const TwoArea = () => {
    const dispatch = useAppDispatch();
    const refDiv = useRef<HTMLDivElement>(null);
    const refTwo = useRef<Two>();
    const refGroup = useRef<Group>();
    const refZui = useRef<ZUI>();
    const refCursor = useRef<Circle>();

    const mousePositionX = useSelector(selectMousePositionX);
    const mousePositionY = useSelector(selectMousePositionY);
    const refMousePosition = useRef({ x: mousePositionX, y: mousePositionY });

    useEffect(() => {
        refMousePosition.current = { x: mousePositionX, y: mousePositionY };
    }, [mousePositionX, mousePositionY]);

    const editMode = useAppSelector(selectEditMode);
    const refEditMode = useRef(editMode);

    useEffect(() => {
        refEditMode.current = editMode;
    }, [editMode]);

    const circles = useSelector(selectCircles);
    const refCircles = useRef(circles);

    const connections = useSelector(selectConnections);
    const refConnections = useRef(connections);

    const refPossibleConnectionLine = useRef(new Line(0, 0, 7, 7));

    const cursorOverlap = useRef(false);
    const refIndexHovering = useRef(-1); // index of circle in state array, not id
    const refFirstConnectionIndex = useRef(-1); // also index of circle in array
    const refCircleMovingIndex = useRef(-1);

    const refPanning = useRef(false);

    useEffect(() => {
        refTwo.current = new Two(twoAreaDimensions);
        refGroup.current = refTwo.current.makeGroup();
        refZui.current = new ZUI(refGroup.current);

        const lineStart = -5000;
        const lineEnd = lineStart * -1;
        const lineColor = "#ADD8E6";
        for (let i = lineStart; i <= lineEnd; i += 50) {
            const lineX = new Line(lineStart, i, lineEnd, i);
            const lineY = new Line(i, lineStart, i, lineEnd);
            lineX.stroke = lineColor;
            lineY.stroke = lineColor;
            lineX.id = "line-x-" + i;
            lineY.id = "line-y-" + i;
            refGroup.current.add(lineX, lineY);    
        }

        refPossibleConnectionLine.current.stroke = CONNECTION_COLOR;
        refPossibleConnectionLine.current.visible = false;
        refGroup.current.add(refPossibleConnectionLine.current);

        refCursor.current = new Circle(refMousePosition.current.x, refMousePosition.current.y, CIRCLE_RADIUS);
        refCursor.current.noFill();
        refCursor.current.id = "cursor";
        refGroup.current.add(refCursor.current);

        const two = refTwo.current;
        const div = refDiv.current;
        if (div) two.appendTo(div);

        const update = () => {
            if (!refCursor.current) return;
            refCursor.current.visible = refEditMode.current === "add-circle";
            refCursor.current.position.x = refMousePosition.current.x;
            refCursor.current.position.y = refMousePosition.current.y;
            cursorOverlap.current = false;
            refIndexHovering.current = -1;
            if (refEditMode.current !== "add-connection-end") refFirstConnectionIndex.current = -1;
            refCircles.current.forEach((c, i) => {
                const overlapDist = distance(c.x, c.y, refMousePosition.current.x, refMousePosition.current.y);
                if (overlapDist <= (c.radius + CIRCLE_RADIUS)) cursorOverlap.current = true;
                const mouseDist = distance(refMousePosition.current.x, refMousePosition.current.y, c.x, c.y);
                if (mouseDist < c.radius) refIndexHovering.current = i;
                const hovering = mouseDist < c.radius;
                let circleColor = "#aaa";
                if (refEditMode.current === "remove-circle" && hovering) circleColor = "#ff0";
                if (refEditMode.current === "add-connection-start" && hovering) circleColor = CONNECTION_COLOR;
                if (refEditMode.current === "add-connection-end" && hovering) circleColor = CONNECTION_COLOR;
                if (refEditMode.current === "add-connection-end" && i === refFirstConnectionIndex.current) circleColor = CONNECTION_COLOR;
                const position = {
                    x: refCircleMovingIndex.current >= 0 ? refMousePosition.current.x : c.x,
                    y: refCircleMovingIndex.current >= 0 ? refMousePosition.current.y : c.y,
                };
                if (c.color !== circleColor || refCircleMovingIndex.current === i) {
                    dispatch(circlesUpdateAtIndex({
                        index: i,
                        circle: {...c, color: circleColor, x: position.x, y: position.y },
                    }));
                };
            });
            refCursor.current.stroke = cursorOverlap.current ? "red" : "black";
            if (refIndexHovering.current >= 0 && refFirstConnectionIndex.current >= 0 && refEditMode.current === "add-connection-end") {
                refPossibleConnectionLine.current.vertices[0].x = refCircles.current[refFirstConnectionIndex.current].x;
                refPossibleConnectionLine.current.vertices[0].y = refCircles.current[refFirstConnectionIndex.current].y;
                refPossibleConnectionLine.current.vertices[1].x = refCircles.current[refIndexHovering.current].x;
                refPossibleConnectionLine.current.vertices[1].y = refCircles.current[refIndexHovering.current].y;
                refPossibleConnectionLine.current.visible = true;
            } else refPossibleConnectionLine.current.visible = false;
        };

        two.bind("update", update);
        two.play();

        const onMouseMove = (e: MouseEvent) => {
            if (refPanning.current) {
                refZui.current?.translateSurface(e.movementX, e.movementY);
            }
            const bodyMargin = parseFloat(window.getComputedStyle(document.body).getPropertyValue("margin"));
            const surface = refZui.current?.clientToSurface(e.offsetX + bodyMargin, e.offsetY + bodyMargin);
            const zoomed = { x: Math.round(surface.x), y: Math.round(surface.y) };
            dispatch(mouseSetPosition({
                x: zoomed.x,
                y: zoomed.y,
            }));
        };
        const onClick = (e: MouseEvent) => {
            if (refEditMode.current === "add-circle" && !cursorOverlap.current) {
                dispatch(circlesAdd({
                    id: "circle-" + Date.now().toString(),
                    x: refMousePosition.current.x,
                    y: refMousePosition.current.y,
                }));
            }
            if (refEditMode.current === "remove-circle" && refIndexHovering.current >= 0) dispatch(circlesDeleteAtIndex(refIndexHovering.current));
            if (refEditMode.current === "add-connection-start" && refIndexHovering.current >= 0) {
                refFirstConnectionIndex.current = refIndexHovering.current;
                dispatch(editSetMode("add-connection-end"));
            }
            if (refEditMode.current === "add-connection-end" && refIndexHovering.current >= 0 && refFirstConnectionIndex.current >= 0) {
                dispatch(connectionAdd({
                    id: "connection-" + Date.now(),
                    index1: refFirstConnectionIndex.current, 
                    index2: refIndexHovering.current,
                }));
                refIndexHovering.current = -1;
                refFirstConnectionIndex.current = -1;
                dispatch(editSetMode("add-connection-start"));
            }
            if (refEditMode.current === "move-circle") {            
                if (refIndexHovering.current >= 0 && refCircleMovingIndex.current === -1) {
                    refCircleMovingIndex.current = refIndexHovering.current;
                } else if (refCircleMovingIndex.current >= 0) {
                    refCircleMovingIndex.current = -1;
                }
            }
            if (refEditMode.current !== "move-circle") refCircleMovingIndex.current = -1;
        };
        const onScroll = (e: WheelEvent) => {
            const dy = (e.deltaY) / 1000;
            refZui.current?.zoomBy(dy, e.clientX, e.clientY);
            onMouseMove(e);
        };
        const onSpace = (e: KeyboardEvent) => {
            if (e.code === "Space" && e.type === "keydown") refPanning.current = true;
            if (e.code === "Space" && e.type === "keyup") refPanning.current = false;
        };
        div?.addEventListener("mousemove", onMouseMove);
        div?.addEventListener("click", onClick);
        div?.addEventListener("wheel", onScroll);
        document.addEventListener("keydown", onSpace);
        document.addEventListener("keyup", onSpace);

        return () => {
            two?.unbind("update");
            const parentElement: HTMLElement = two?.renderer.domElement.parentElement;
            parentElement.removeChild(two?.renderer.domElement);
            div?.removeEventListener("mousemove", onMouseMove);
            div?.removeEventListener("click", onClick);
            div?.removeEventListener("wheel", onScroll);
            document.removeEventListener("keydown", onSpace);
            document.removeEventListener("keyup", onSpace);
        };
    }, []);

    useEffect(() => {
        refCircles.current = circles;
        refConnections.current = connections;
        const group = refGroup.current;
        if (!group) return;

        // synch state and two objects

        // get set of circle ids from state
        const circleIds = new Set<string>();
        circles.forEach(c => circleIds.add(c.id));

        // get set of connections ids from state
        const connectionIds = new Set<string>();
        connections.forEach(c => connectionIds.add(c.id));

        // remove circles and connections from two group that are not in updated states
        // and build set of ids of circles and connections already in group
        const twoCircleIds = new Set<string>();
        const twoConnectionIds = new Set<string>();
        group.children.forEach((c: Shape) => {
            if (c.id.startsWith("circle")) {
                twoCircleIds.add(c.id);
                if (!circleIds.has(c.id)) c.remove();
            }
            if (c.id.startsWith("connection")) {
                twoConnectionIds.add(c.id);
                if (!connectionIds.has(c.id)) c.remove();
            }
        });

        // iterate over state circles, add missing two circles, and update existing to new state
        circles.forEach(c => {
            if (!twoCircleIds.has(c.id)) {
                const newCircle = new Circle(c.x, c.y, c.radius);
                newCircle.id = c.id;
                group.add(newCircle);
            }
            const groupCircle = group.getById(c.id);
            groupCircle.position.x = c.x;
            groupCircle.position.y = c.y;
            // @ts-ignore
            groupCircle.fill = c.color
        });

        // iterate over state connections, add missing two connections, and update existing to new state
        connections.forEach(c => {
            if (!twoConnectionIds.has(c.id)) {
                const newConnection = new Line(circles[c.circle1Index].x, circles[c.circle1Index].y, circles[c.circle2Index].x, circles[c.circle2Index].y);
                newConnection.stroke = CONNECTION_COLOR;
                newConnection.id = c.id;
                group.add(newConnection);
            }
            const groupConnection = group.getById(c.id);
            const circle1 = circles[c.circle1Index];
            const circle2 = circles[c.circle2Index];
            // @ts-ignore two typing is incorrect here
            groupConnection.vertices[0].x = circle1.x;
            // @ts-ignore
            groupConnection.vertices[0].y = circle1.y;
            // @ts-ignore
            groupConnection.vertices[1].x = circle2.x;
            // @ts-ignore
            groupConnection.vertices[1].y = circle2.y;
        });

        const getShapeValue = (shapeId: string) => {
            if (shapeId.startsWith("connection")) return 1;
            if (shapeId.startsWith("circle")) return 2;
            if (shapeId === "cursor") return 3;
            return -1;
        };

        group.children.sort((a: Shape, b: Shape) => {
            return getShapeValue(a.id) - getShapeValue(b.id);
        });
    }, [circles, connections]);

    return <div 
        ref={refDiv}
        style={{
            border: "2px solid black",
            width: twoAreaDimensions.width,
            height: twoAreaDimensions.height,
            cursor: editMode === "add-circle" ? "none" : "default",
        }} 
    />;
};

export default TwoArea;
