import { useEffect, useRef } from "react";
import Two from "two.js";
import { useAppDispatch, useAppSelector } from "../hooks";
import { editSetMode, selectEditMode } from "../state/editingSlice";
import { mouseSetPosition, selectMousePositionX, selectMousePositionY } from "../state/mouseSlice";
import { Circle, circlesAddOne, circlesRemoveOne, circlesUpdateOne, selectCirclesEntities } from "../state/circlesSlice";
import { CIRCLE_RADIUS, CONNECTION_COLOR } from "../constants";
import { Circle as TwoCircle } from "two.js/src/shapes/circle";
import { distance } from "../utils/utils";
import { ZUI } from "two.js/extras/jsm/zui";
import { Group } from "two.js/src/group";
import { Line } from "two.js/src/shapes/line";
import { connectionAddOne, connectionDeleteContainingCircleId, selectConnectionsAll } from "../state/connectionsSlice";
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
    const refCursor = useRef<TwoCircle | null>(null);
    if (!refCursor.current) refCursor.current = new TwoCircle(0, 0, CIRCLE_RADIUS);

    const mousePositionX = useAppSelector(selectMousePositionX);
    const mousePositionY = useAppSelector(selectMousePositionY);
    const refMousePosition = useRef({ x: mousePositionX, y: mousePositionY });

    useEffect(() => {
        refMousePosition.current = { x: mousePositionX, y: mousePositionY };
    }, [mousePositionX, mousePositionY]);

    const editMode = useAppSelector(selectEditMode);
    const refEditMode = useRef(editMode);

    useEffect(() => {
        refEditMode.current = editMode;
    }, [editMode]);

    const circles = useAppSelector(selectCirclesEntities);
    const refCircles = useRef(circles);

    const connections = useAppSelector(selectConnectionsAll);
    const refConnections = useRef(connections);

    useEffect(() => {
        refCircles.current = circles;
        refConnections.current = connections;
    }, [circles, connections]);

    const refPossibleConnectionLine = useRef(new Line(0, 0, 7, 7));
    const cursorOverlap = useRef(false);
    const refCircleHovering = useRef<Circle | null>(null);
    const refFirstConnectionCircle = useRef<Circle | null>(null);
    const refCircleMoving = useRef<Circle | null>(null);
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

        refPossibleConnectionLine.current.id = "possible-connection";
        refPossibleConnectionLine.current.stroke = CONNECTION_COLOR;
        refPossibleConnectionLine.current.visible = false;
        refGroup.current.add(refPossibleConnectionLine.current);

        if (refCursor.current) {
            refCursor.current.position.x = refMousePosition.current.x;
            refCursor.current.position.y = refMousePosition.current.y;
            refCursor.current.noFill();
            refCursor.current.id = "cursor";
            refGroup.current.add(refCursor.current);
        }

        const two = refTwo.current;
        const div = refDiv.current;
        if (div) two.appendTo(div);

        const update = () => {
            // update state aspects
            if (!refCursor.current) return;
            refCursor.current.visible = refEditMode.current === "add-circle";
            refCursor.current.position.x = refMousePosition.current.x;
            refCursor.current.position.y = refMousePosition.current.y;
            cursorOverlap.current = false;
            refCircleHovering.current = null;
            if (refEditMode.current !== "add-connection-end") refFirstConnectionCircle.current = null;
            for (const key in refCircles.current) {
                const c = refCircles.current[key];
                if (!c) continue;
                const overlapDist = distance(c.x, c.y, refMousePosition.current.x, refMousePosition.current.y);
                if (overlapDist <= (c.radius + CIRCLE_RADIUS)) cursorOverlap.current = true;
                const mouseDist = distance(refMousePosition.current.x, refMousePosition.current.y, c.x, c.y);
                if (mouseDist < c.radius) refCircleHovering.current = c;
                const hovering = mouseDist < c.radius;
                let circleColor = "#aaa";
                if (refEditMode.current === "remove-circle" && hovering) circleColor = "#ff0";
                if (refEditMode.current === "add-connection-start" && hovering) circleColor = CONNECTION_COLOR;
                if (refEditMode.current === "add-connection-end" && hovering) circleColor = CONNECTION_COLOR;
                if (refEditMode.current === "add-connection-end" && c.id === refFirstConnectionCircle.current?.id) circleColor = CONNECTION_COLOR;
                const position = {
                    x: refCircleMoving.current ? refMousePosition.current.x : c.x,
                    y: refCircleMoving.current ? refMousePosition.current.y : c.y,
                };
                if (c.color !== circleColor || refCircleMoving.current?.id === c.id) {
                    dispatch(circlesUpdateOne({
                        id: c.id,
                        changes: { ...c, color: circleColor, x: position.x, y: position.y },
                    }));
                };
            }
            
            refCursor.current.stroke = cursorOverlap.current ? "red" : "black";
            if (refEditMode.current === "add-connection-end") {
                refPossibleConnectionLine.current.visible = true;
                if (refCircleHovering.current && refFirstConnectionCircle.current) {
                    refPossibleConnectionLine.current.vertices[0].x = refFirstConnectionCircle.current.x;
                    refPossibleConnectionLine.current.vertices[0].y = refFirstConnectionCircle.current.y;
                    refPossibleConnectionLine.current.vertices[1].x = refCircleHovering.current.x;
                    refPossibleConnectionLine.current.vertices[1].y = refCircleHovering.current.y;
                } else {
                    refPossibleConnectionLine.current.vertices[1].x = refMousePosition.current.x;
                    refPossibleConnectionLine.current.vertices[1].y = refMousePosition.current.y;
                }
            } else refPossibleConnectionLine.current.visible = false;

            // update two state
            const group = refGroup.current;
            if (!group) return;
    
            // synch state and two objects
    
            // get set of circle ids from state
            const circleIds = new Set<string>();
            for (const id in refCircles.current) circleIds.add(id);
    
            // get set of connections ids from state
            const connectionIds = new Set<string>();
            refConnections.current.forEach(c => connectionIds.add(c.id));
    
            // remove circles and connections from two group that are not in updated states
            group.children.forEach((c: Shape) => {
                if (c.id.startsWith("circle") && !circleIds.has(c.id)) c.remove();
                if (c.id.startsWith("connection") && !connectionIds.has(c.id)) c.remove();
            });
    
            // iterate over state circles, add missing two circles, and update existing to new state
            for (const id in refCircles.current) {
                const c = refCircles.current[id];
                if (!c) continue;
                const check = group.getById(c.id) as TwoCircle;
                if (!check) {
                    const newCircle = new TwoCircle(c.x, c.y, c.radius);
                    newCircle.id = c.id;
                    group.add(newCircle);
                }
                const groupCircle = group.getById(c.id) as TwoCircle;
                groupCircle.position.x = c.x;
                groupCircle.position.y = c.y;
                groupCircle.fill = c.color
            }
    
            // iterate over state connections, add missing two connections, and update existing to new state
            refConnections.current.forEach(c => {
                const circle1 = refCircles.current[c.circle1Id];
                const circle2 = refCircles.current[c.circle2Id];
                if (!circle1 || !circle2) return;
                const check = group.getById(c.id) as Line;
                if (!check) {
                    const newConnection = new Line(circle1.x, circle1.y, circle2.x, circle2.y);
                    newConnection.stroke = CONNECTION_COLOR;
                    newConnection.id = c.id;
                    group.add(newConnection);
                }
                const groupConnection = group.getById(c.id) as Line;
                groupConnection.vertices[0].x = circle1.x;
                groupConnection.vertices[0].y = circle1.y;
                groupConnection.vertices[1].x = circle2.x;
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
                dispatch(circlesAddOne({
                    x: refMousePosition.current.x,
                    y: refMousePosition.current.y,
                }));
            }
            if (refEditMode.current === "remove-circle" && refCircleHovering.current) {
                dispatch(connectionDeleteContainingCircleId(refCircleHovering.current.id));
                dispatch(circlesRemoveOne(refCircleHovering.current.id));
            }
            if (refEditMode.current === "add-connection-start" && refCircleHovering.current) {
                refFirstConnectionCircle.current = refCircleHovering.current;
                dispatch(editSetMode("add-connection-end"));
            }
            if (refEditMode.current === "add-connection-end" && refCircleHovering.current && refFirstConnectionCircle.current) {
                dispatch(connectionAddOne({
                    circle1Id: refFirstConnectionCircle.current.id,
                    circle2Id: refCircleHovering.current.id,
                }));
                refCircleHovering.current = null;
                refFirstConnectionCircle.current = null;
                dispatch(editSetMode("add-connection-start"));
            }
            if (refEditMode.current === "move-circle") {            
                if (refCircleHovering.current && !refCircleMoving.current) {
                    refCircleMoving.current = refCircleHovering.current;
                } else if (refCircleMoving.current) {
                    refCircleMoving.current = null;
                }
            }
            if (refEditMode.current !== "move-circle") refCircleMoving.current = null;
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
        // click event does not work correctly in chrome, using mouseup instead
        div?.addEventListener("mousemove", onMouseMove);
        div?.addEventListener("mouseup", onClick);
        div?.addEventListener("wheel", onScroll);
        document.addEventListener("keydown", onSpace);
        document.addEventListener("keyup", onSpace);

        return () => {
            two?.unbind("update");
            const parentElement: HTMLElement = two?.renderer.domElement.parentElement;
            parentElement.removeChild(two?.renderer.domElement);
            div?.removeEventListener("mousemove", onMouseMove);
            div?.removeEventListener("mouseup", onClick);
            div?.removeEventListener("wheel", onScroll);
            document.removeEventListener("keydown", onSpace);
            document.removeEventListener("keyup", onSpace);
        };
    }, []);

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
