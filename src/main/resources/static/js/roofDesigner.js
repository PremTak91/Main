// Solar Roof Analyzer & Designer - Konva.js Vector Canvas & Geometry Engine

// Global State Model
let state = {
    image: null,
    imageSrc: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    tool: 'select', // 'select' | 'boundary' | 'obstacle' | 'calibrate'
    scalePixelsPerMeter: 40, // calibrated scale
    calibration: { active: false, start: null, end: null, distance: 10 },
    boundary: [], // array of {x, y} vertices
    obstacles: [], // array of {id, type, x, y, w, h}
    panels: {
        capacityKw: 5.0,
        watt: 550,
        length: 2278, // mm
        width: 1134, // mm
        orientation: 'portrait', // 'portrait' | 'landscape'
        tilt: 15, // deg
        height: 1.0, // m
        rowSpacing: 1.2, // m
        autoSpacing: true,
        direction: 'South',
        rotation: 0, // rotation relative to image (degrees)
        scale: 1.0,  // layout size scale factor
        offset: { u: 0.5, v: 0.5 }, // position offset of array center in normalized (u,v) space
        deleted: {}, // map of "${row}_${col}" to boolean (deleted panels)
        items: []
    },
    layers: {
        image: true,
        boundary: true,
        panels: true,
        structure: true,
        obstacles: true,
        labels: true,
        compass: true
    },
    boundaryWalkway: 0.5, // meters safety margin
    mountType: 'RCC-Ballast',
    history: [],
    redoStack: [],
    drag: {
        active: false,
        type: null,
        targetIndex: -1,
        lastMouseImg: { x: 0, y: 0 }
    }
};

// Konva variables
let stage = null;
let roofImageLayer = null;
let shadowsLayer = null;
let structureLayer = null;
let solarArrayLayer = null;
let boundaryLayer = null;
let obstaclesLayer = null;
let measurementsLayer = null;
let uiLayer = null;

let roofImageNode = null;
let solarArrayGroup = null;
let transformer = null;

// ── Document Lifecycle ───────────────────────────────────────────────────
$(document).ready(function () {
    initKonva();

    // Attach resize observer to auto-fit container
    const resizeObserver = new ResizeObserver(() => {
        if (stage) {
            const wrapper = document.getElementById('canvasWorkspaceWrapper');
            stage.width(wrapper.clientWidth);
            stage.height(wrapper.clientHeight);
            stage.batchDraw();
        }
    });
    resizeObserver.observe(document.getElementById('canvasWorkspaceWrapper'));

    // Prevent right click menu on workspace so we can delete points easily
    document.getElementById('designerCanvasContainer').addEventListener('contextmenu', e => e.preventDefault());

    // Drag & Drop handlers
    const overlay = document.getElementById('uploadOverlay');
    overlay.addEventListener('dragover', (e) => {
        e.preventDefault();
        overlay.classList.add('dragover');
    });
    overlay.addEventListener('dragleave', () => {
        overlay.classList.remove('dragover');
    });
    overlay.addEventListener('drop', (e) => {
        e.preventDefault();
        overlay.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    // Inputs value change triggers
    $('.form-input-dark, .form-check-input-dark').on('change input', function () {
        onParametersChanged();
    });

    // Recover layout configuration from LocalStorage autosave
    loadAutosave();
});

// ── Konva Initialization & Interaction Setup ─────────────────────────────
function initKonva() {
    const wrapper = document.getElementById('canvasWorkspaceWrapper');
    
    // Create Konva Stage
    stage = new Konva.Stage({
        container: 'designerCanvasContainer',
        width: wrapper.clientWidth,
        height: wrapper.clientHeight
    });

    // Create Stage Layers
    roofImageLayer = new Konva.Layer();
    shadowsLayer = new Konva.Layer();
    structureLayer = new Konva.Layer();
    solarArrayLayer = new Konva.Layer();
    boundaryLayer = new Konva.Layer();
    obstaclesLayer = new Konva.Layer();
    measurementsLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();

    stage.add(roofImageLayer);
    stage.add(shadowsLayer);
    stage.add(structureLayer);
    stage.add(solarArrayLayer);
    stage.add(boundaryLayer);
    stage.add(obstaclesLayer);
    stage.add(measurementsLayer);
    stage.add(uiLayer);

    // Setup stage zoom via mouse wheel
    stage.on('wheel', (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.15;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        
        // Clamp zoom factor between 0.1x and 20x
        const clampedScale = Math.max(0.1, Math.min(20, newScale));
        stage.scale({ x: clampedScale, y: clampedScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale
        };
        stage.position(newPos);
        stage.batchDraw();

        updateZoomPercentage();
    });

    // Setup stage panning (middle click, background drag, or space+drag)
    stage.on('mousedown', (e) => {
        const isBgClick = e.target === stage || e.target.hasName('bgImage');
        const isMiddleBtn = e.evt && (e.evt.button === 1 || e.evt.button === 4);
        
        if (isBgClick || isMiddleBtn || state.tool === 'select') {
            // Check if clicking directly on handles or transformer
            if (e.target.hasName('anchor') || e.target.hasName('vertex') || e.target.getParent()?.hasName('transformer')) {
                return;
            }
            stage.startDrag();
        }
    });

    // Drag move coordinates trackers
    stage.on('mousemove', () => {
        updateCursorCoordinates();
    });

    // Create SolarArray Group & Transformer controls
    solarArrayGroup = new Konva.Group({
        name: 'solarArrayGroup',
        draggable: true
    });
    solarArrayLayer.add(solarArrayGroup);

    // Override getClientRect to wrap panels, legs, and concrete footings
    solarArrayGroup.getClientRect = function () {
        const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
        if (activePanels.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        activePanels.forEach(item => {
            // Check elevated panel corners
            item.corners.forEach(pt => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            });
            // Check base footings coordinates
            item.baseCorners.forEach(pt => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            });
        });

        // Add padding for selection box bounds
        const pad = 10;
        return {
            x: minX - pad,
            y: minY - pad,
            width: (maxX - minX) + pad * 2,
            height: (maxY - minY) + pad * 2
        };
    };

    transformer = new Konva.Transformer({
        name: 'transformer',
        borderStroke: '#10b981',
        borderStrokeWidth: 2,
        anchorFill: '#ffffff',
        anchorStroke: '#10b981',
        anchorSize: 10,
        keepRatio: false, // allow non-uniform scaling (stretch width or height separately)
        rotateAnchorOffset: 25,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-middle', 'right-middle']
    });
    uiLayer.add(transformer);

    // Setup proxy drag and scale transformation behavior on the solar group
    solarArrayGroup.on('dragmove', () => {
        if (state.boundary.length < 4) return;

        // Convert Konva group offset coordinates to normalized (u, v) space
        const p0 = state.boundary[0];
        const p1 = state.boundary[1];
        const p3 = state.boundary[3];
        const quadW = Math.max(10, getDistance(p0, p1));
        const quadH = Math.max(10, getDistance(p0, p3));

        const du = solarArrayGroup.x() / quadW;
        const dv = solarArrayGroup.y() / quadH;

        state.panels.offset.u = Math.max(-0.5, Math.min(1.5, (state.panels.offset.u || 0.5) + du));
        state.panels.offset.v = Math.max(-0.5, Math.min(1.5, (state.panels.offset.v || 0.5) + dv));

        // Reset group coordinates to 0,0 since offsets are accumulated in the state
        solarArrayGroup.position({ x: 0, y: 0 });

        recalculatePanelsLayout();
        renderKonvaWorkspace();
    });

    solarArrayGroup.on('transform', () => {
        // Handle rotation changes continuously
        const dRot = solarArrayGroup.rotation();
        if (dRot !== 0) {
            state.panels.rotation = Math.round((state.panels.rotation + dRot) % 360);
            if (state.panels.rotation < 0) state.panels.rotation += 360;
            solarArrayGroup.rotation(0);
            $('#panelRotate').val(state.panels.rotation);
            $('#rotateVal').text(state.panels.rotation + '°');
            
            recalculatePanelsLayout();
            renderKonvaWorkspace();
        }
    });

    solarArrayGroup.on('dragend transformend', (e) => {
        if (e.type === 'transformend') {
            // Handle scale changes (Transformer handles resizing rows/cols) only on drag end
            const sX = solarArrayGroup.scaleX();
            const sY = solarArrayGroup.scaleY();
            if (sX !== 1 || sY !== 1) {
                const newCols = Math.max(1, Math.round((state.panels.cols || 3) * sX));
                const newRows = Math.max(1, Math.round((state.panels.rows || 2) * sY));

                if (newCols !== state.panels.cols || newRows !== state.panels.rows) {
                    state.panels.cols = newCols;
                    state.panels.rows = newRows;
                    $('#inputCols').val(newCols);
                    $('#inputRows').val(newRows);

                    // Update capacityKw
                    state.panels.capacityKw = (newCols * newRows * state.panels.watt) / 1000;
                    $('#inputCapacity').val(state.panels.capacityKw.toFixed(2));
                }
                solarArrayGroup.scale({ x: 1, y: 1 });
                
                recalculatePanelsLayout();
                renderKonvaWorkspace();
            }
        }
        saveHistory();
    });
}

// ── Image Handling & Loading ─────────────────────────────────────────────
function triggerImageUpload() {
    document.getElementById('roofImageUpload').click();
}

function loadRoofImage(event) {
    if (event.target.files && event.target.files[0]) {
        handleImageFile(event.target.files[0]);
    }
}

function handleImageFile(file) {
    showLoader();
    const reader = new FileReader();
    reader.onload = function (e) {
        const rawImg = new Image();
        rawImg.onload = function () {
            // Compress image to fit within 1400px bounds for safe storage
            const maxDim = 1400;
            let w = rawImg.width;
            let h = rawImg.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(rawImg, 0, 0, w, h);
            
            const compressedSrc = canvas.toDataURL('image/jpeg', 0.8);
            state.imageSrc = compressedSrc;
            
            // Re-load the compressed image as the active image
            state.image = new Image();
            state.image.onload = function () {
                // Fit stage coordinates to image
                zoomFit();

                // Setup background image node
                if (roofImageNode) roofImageNode.destroy();
                roofImageNode = new Konva.Image({
                    image: state.image,
                    width: state.image.width,
                    height: state.image.height,
                    name: 'bgImage'
                });
                roofImageLayer.add(roofImageNode);

                // Calibrate pixels per meter (assuming default image covers ~12m width)
                state.scalePixelsPerMeter = Math.max(15, state.image.width / 12);

                // Establish default boundary quad
                const paddingX = state.image.width * 0.15;
                const paddingY = state.image.height * 0.15;
                state.boundary = [
                    { x: paddingX, y: paddingY },
                    { x: state.image.width - paddingX, y: paddingY },
                    { x: state.image.width - paddingX, y: state.image.height - paddingY },
                    { x: paddingX, y: state.image.height - paddingY }
                ];

                state.panels.offset = { u: 0.5, v: 0.5 };
                state.panels.scale = 1.0;
                state.panels.rotation = 0;
                state.panels.deleted = {};
                state.obstacles = [];

                // UI visibility
                $('#uploadOverlay').hide();
                $('#workspaceToolbar').show();
                $('#btnExportImage').show();
                $('#btnExportPdf').show();

                saveHistory();
                recalculatePanelsLayout();
                renderKonvaWorkspace();
                hideLoader();
            };
            state.image.src = compressedSrc;
        };
        rawImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ── AI Panel Layout Generation Algorithm ──────────────────────────────────
function getHomographyMap(p0, p1, p2, p3) {
    const x0 = p0.x, y0 = p0.y;
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    
    const sx = x0 - x1 + x2 - x3;
    const sy = y0 - y1 + y2 - y3;
    
    let g, h, a, b, c, d, e, f;
    
    if (sx === 0 && sy === 0) {
        a = x1 - x0;
        b = x3 - x0;
        c = x0;
        d = y1 - y0;
        e = y3 - y0;
        f = y0;
        g = 0;
        h = 0;
    } else {
        const det = dx1 * dy2 - dx2 * dy1;
        if (det === 0) return null;
        g = (sx * dy2 - sy * dx2) / det;
        h = (sy * dx1 - sx * dy1) / det;
        a = x1 - x0 + g * x1;
        b = x3 - x0 + h * x3;
        c = x0;
        d = y1 - y0 + g * y1;
        e = y3 - y0 + h * y3;
        f = y0;
    }
    
    return function(u, v) {
        const den = g * u + h * v + 1;
        if (den === 0) return { x: 0, y: 0 };
        return {
            x: (a * u + b * v + c) / den,
            y: (d * u + e * v + f) / den
        };
    };
}

function recalculatePanelsLayout() {
    if (state.boundary.length < 4) return;

    const p0 = state.boundary[0];
    const p1 = state.boundary[1];
    const p2 = state.boundary[2];
    const p3 = state.boundary[3];

    const mapPerspective = getHomographyMap(p0, p1, p2, p3);
    if (!mapPerspective) return;

    const roofWidthM = getDistance(p0, p1) / state.scalePixelsPerMeter;
    const roofHeightM = getDistance(p0, p3) / state.scalePixelsPerMeter;

    if (isNaN(roofWidthM) || isNaN(roofHeightM) || roofWidthM <= 0.01 || roofHeightM <= 0.01) return;

    const isPortrait = state.panels.orientation === 'portrait';
    const panelWidthM = (isPortrait ? state.panels.width : state.panels.length) / 1000;
    const panelHeightM = (isPortrait ? state.panels.length : state.panels.width) / 1000;
    const rowSpacingM = state.panels.autoSpacing ? (panelHeightM * Math.cos((state.panels.tilt * Math.PI) / 180) * 1.3) : state.panels.rowSpacing;

    const pw = (panelWidthM * state.panels.scale) / roofWidthM;
    const ph = (panelHeightM * state.panels.scale) / roofHeightM;
    const gap = (0.05 * state.panels.scale) / roofWidthM;
    const rowGap = (rowSpacingM * state.panels.scale) / roofHeightM;

    if (isNaN(pw) || isNaN(ph) || !isFinite(pw) || !isFinite(ph)) return;

    if (!state.panels.cols || !state.panels.rows) {
        const targetCount = Math.ceil((state.panels.capacityKw * 1000) / state.panels.watt);
        let c = Math.ceil(Math.sqrt(targetCount * (roofWidthM / roofHeightM) * (panelHeightM / panelWidthM)));
        c = Math.max(1, Math.min(targetCount, c));
        let r = Math.ceil(targetCount / c);
        state.panels.cols = c;
        state.panels.rows = r;
        $('#inputCols').val(c);
        $('#inputRows').val(r);
    }

    const cols = state.panels.cols;
    const rows = state.panels.rows;
    const targetCount = cols * rows;

    state.panels.items = [];

    const uCenter = state.panels.offset.u || 0.5;
    const vCenter = state.panels.offset.v || 0.5;
    const rotRad = (state.panels.rotation * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);

    let placedCount = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (placedCount >= targetCount) break;

            const lx = (c - (cols - 1) / 2) * (pw + gap);
            const ly = (r - (rows - 1) / 2) * (ph + rowGap);

            const rx = lx * cos - ly * sin;
            const ry = lx * sin + ly * cos;

            const u = uCenter + rx;
            const v = vCenter + ry;

            const cornersNorm = [
                { u: u - pw/2, v: v - ph/2 }, // TL
                { u: u + pw/2, v: v - ph/2 }, // TR
                { u: u + pw/2, v: v + ph/2 }, // BR
                { u: u - pw/2, v: v + ph/2 }  // BL
            ];

            const baseCorners = cornersNorm.map(pt => mapPerspective(pt.u, pt.v));

            let isValid = true;
            for (let pt of cornersNorm) {
                if (pt.u < 0 || pt.u > 1 || pt.v < 0 || pt.v > 1) {
                    isValid = false;
                    break;
                }
            }

            const walkwayU = state.boundaryWalkway / roofWidthM;
            const walkwayV = state.boundaryWalkway / roofHeightM;
            if (isValid) {
                for (let pt of cornersNorm) {
                    if (pt.u < walkwayU || pt.u > 1 - walkwayU || pt.v < walkwayV || pt.v > 1 - walkwayV) {
                        isValid = false;
                        break;
                    }
                }
            }

            const tiltRad = (state.panels.tilt * Math.PI) / 180;
            const hFront = state.panels.height;
            const hRear = state.panels.height + panelHeightM * Math.sin(tiltRad);

            const cornersGlobal = [
                { x: baseCorners[0].x, y: baseCorners[0].y - hRear * state.scalePixelsPerMeter },
                { x: baseCorners[1].x, y: baseCorners[1].y - hRear * state.scalePixelsPerMeter },
                { x: baseCorners[2].x, y: baseCorners[2].y - hFront * state.scalePixelsPerMeter },
                { x: baseCorners[3].x, y: baseCorners[3].y - hFront * state.scalePixelsPerMeter }
            ];

            if (isValid) {
                for (let pt of cornersGlobal) {
                    for (let obs of state.obstacles) {
                        if (pt.x >= obs.x && pt.x <= obs.x + obs.w && pt.y >= obs.y && pt.y <= obs.y + obs.h) {
                            isValid = false;
                            break;
                        }
                    }
                    if (!isValid) break;
                }
            }

            if (isValid) {
                const sunAngle = (45 + 180) * Math.PI / 180;
                const shadowScale = 0.8;

                const shadowCorners = [
                    { x: baseCorners[0].x + hRear * Math.cos(sunAngle) * shadowScale * state.scalePixelsPerMeter, y: baseCorners[0].y + hRear * Math.sin(sunAngle) * shadowScale * state.scalePixelsPerMeter },
                    { x: baseCorners[1].x + hRear * Math.cos(sunAngle) * shadowScale * state.scalePixelsPerMeter, y: baseCorners[1].y + hRear * Math.sin(sunAngle) * shadowScale * state.scalePixelsPerMeter },
                    { x: baseCorners[2].x + hFront * Math.cos(sunAngle) * shadowScale * state.scalePixelsPerMeter, y: baseCorners[2].y + hFront * Math.sin(sunAngle) * shadowScale * state.scalePixelsPerMeter },
                    { x: baseCorners[3].x + hFront * Math.cos(sunAngle) * shadowScale * state.scalePixelsPerMeter, y: baseCorners[3].y + hFront * Math.sin(sunAngle) * shadowScale * state.scalePixelsPerMeter }
                ];

                state.panels.items.push({
                    row: r,
                    col: c,
                    center: mapPerspective(u, v),
                    baseCorners: baseCorners,
                    corners: cornersGlobal,
                    shadowCorners: shadowCorners,
                    normCenter: { u, v }
                });
                placedCount++;
            }
        }
    }
}

// ── Konva Vector Rendering Workspace Loader ──────────────────────────────
function renderKonvaWorkspace() {
    if (!state.image) return;

    // 1. Draw Roof Boundary Line & Vertices
    boundaryLayer.destroyChildren();
    if (state.layers.boundary && state.boundary.length > 0) {
        const polyPoints = [];
        state.boundary.forEach(pt => {
            polyPoints.push(pt.x, pt.y);
        });

        const boundaryPoly = new Konva.Line({
            points: polyPoints,
            fill: 'rgba(59, 130, 246, 0.08)',
            stroke: '#3b82f6',
            strokeWidth: 3 / stage.scaleX(),
            closed: true,
            name: 'boundaryPoly'
        });
        boundaryLayer.add(boundaryPoly);

        // Draw Interactive Anchor Nodes if tool is active
        if (state.tool === 'boundary' || state.tool === 'select') {
            state.boundary.forEach((pt, idx) => {
                const vertexCircle = new Konva.Circle({
                    x: pt.x,
                    y: pt.y,
                    radius: 7 / stage.scaleX(),
                    fill: '#ffffff',
                    stroke: '#3b82f6',
                    strokeWidth: 2 / stage.scaleX(),
                    draggable: true,
                    name: 'vertex'
                });

                vertexCircle.on('dragmove', () => {
                    state.boundary[idx] = { x: vertexCircle.x(), y: vertexCircle.y() };
                    polyPoints[idx * 2] = vertexCircle.x();
                    polyPoints[idx * 2 + 1] = vertexCircle.y();
                    boundaryPoly.points(polyPoints);
                    recalculatePanelsLayout();
                    renderKonvaWorkspace();
                });

                vertexCircle.on('dragend', () => {
                    saveHistory();
                });

                // Right click anchor deletes vertex
                vertexCircle.on('contextmenu', (e) => {
                    e.evt.preventDefault();
                    if (state.boundary.length > 3) {
                        state.boundary.splice(idx, 1);
                        saveHistory();
                        recalculatePanelsLayerAndRedraw();
                    } else {
                        showToast('Boundary must have at least 3 points.', 'warning');
                    }
                });

                boundaryLayer.add(vertexCircle);
            });
        }
    }

    // 2. Draw Obstacles Exclusion zones
    obstaclesLayer.destroyChildren();
    if (state.layers.obstacles) {
        state.obstacles.forEach((obs, idx) => {
            const obsRect = new Konva.Rect({
                x: obs.x,
                y: obs.y,
                width: obs.w,
                height: obs.h,
                fill: 'rgba(239, 68, 68, 0.25)',
                stroke: '#ef4444',
                strokeWidth: 2 / stage.scaleX(),
                draggable: state.tool === 'select'
            });

            obsRect.on('dragmove', () => {
                obs.x = obsRect.x();
                obs.y = obsRect.y();
                recalculatePanelsLayout();
                renderKonvaWorkspace();
            });

            obsRect.on('dragend', () => {
                saveHistory();
            });

            obstaclesLayer.add(obsRect);

            // Show resize handle at bottom-right corner
            if (state.tool === 'select') {
                const resizeHandle = new Konva.Circle({
                    x: obs.x + obs.w,
                    y: obs.y + obs.h,
                    radius: 5 / stage.scaleX(),
                    fill: '#ffffff',
                    stroke: '#ef4444',
                    strokeWidth: 2 / stage.scaleX(),
                    draggable: true,
                    name: 'anchor'
                });

                resizeHandle.on('dragmove', () => {
                    obs.w = Math.max(10, resizeHandle.x() - obs.x);
                    obs.h = Math.max(10, resizeHandle.y() - obs.y);
                    obsRect.width(obs.w);
                    obsRect.height(obs.h);
                    recalculatePanelsLayout();
                    renderKonvaWorkspace();
                });

                resizeHandle.on('dragend', () => {
                    saveHistory();
                });

                obstaclesLayer.add(resizeHandle);
            }
        });
    }

    // 3. Clear Array and Shadows Layers children
    solarArrayGroup.destroyChildren();
    shadowsLayer.destroyChildren();
    structureLayer.destroyChildren();

    const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);

    if (state.layers.panels && activePanels.length > 0) {
        // Draw Shadows to Shadows Layer (under everything)
        activePanels.forEach(item => {
            const shadowPoly = new Konva.Line({
                points: [
                    item.shadowCorners[0].x, item.shadowCorners[0].y,
                    item.shadowCorners[1].x, item.shadowCorners[1].y,
                    item.shadowCorners[2].x, item.shadowCorners[2].y,
                    item.shadowCorners[3].x, item.shadowCorners[3].y
                ],
                fill: 'rgba(0, 0, 0, 0.32)',
                closed: true
            });
            shadowsLayer.add(shadowPoly);
        });

        // Draw structural rails to Structure Layer
        if (state.layers.structure) {
            const rowsMap = {};
            activePanels.forEach(item => {
                if (!rowsMap[item.row]) rowsMap[item.row] = [];
                rowsMap[item.row].push(item);
            });

            // Double Rails running underneath rows
            Object.keys(rowsMap).forEach(r => {
                const rowItems = rowsMap[r];
                rowItems.sort((a, b) => a.col - b.col);
                const first = rowItems[0];
                const last = rowItems[rowItems.length - 1];

                // Back Rail
                const backRail = new Konva.Line({
                    points: [first.corners[0].x, first.corners[0].y, last.corners[1].x, last.corners[1].y],
                    stroke: '#64748b',
                    strokeWidth: 5 / stage.scaleX(),
                    lineCap: 'round'
                });
                structureLayer.add(backRail);

                // Front Rail
                const frontRail = new Konva.Line({
                    points: [first.corners[3].x, first.corners[3].y, last.corners[2].x, last.corners[2].y],
                    stroke: '#64748b',
                    strokeWidth: 5 / stage.scaleX(),
                    lineCap: 'round'
                });
                structureLayer.add(frontRail);
            });

            // Leg assemblies (A-Frames) and Bracings running vertically across the entire grid columns
            const blockH = 12 / stage.scaleX();
            const bw = 20 / stage.scaleX();
            const bd = 8 / stage.scaleX();

            const colsCount = state.panels.cols || 3;
            const rowsCount = state.panels.rows || 2;

            function getPanelAt(r, c) {
                return (state.panels.items || []).find(item => item.row === r && item.col === c && !state.panels.deleted[`${r}_${c}`]);
            }

            for (let c = 0; c <= colsCount; c++) {
                let topPanel = null;
                let botPanel = null;

                if (c < colsCount) {
                    for (let r = 0; r < rowsCount; r++) {
                        const p = getPanelAt(r, c);
                        if (p) {
                            if (!topPanel) topPanel = p;
                            botPanel = p;
                        }
                    }
                } else {
                    for (let r = 0; r < rowsCount; r++) {
                        const p = getPanelAt(r, colsCount - 1);
                        if (p) {
                            if (!topPanel) topPanel = p;
                            botPanel = p;
                        }
                    }
                }

                if (!topPanel || !botPanel) continue;

                let pTop, pBot, bTop, bBot;
                if (c < colsCount) {
                    pTop = topPanel.corners[0]; // TL
                    pBot = botPanel.corners[3]; // BL
                    bTop = topPanel.baseCorners[0]; // Rear-left base
                    bBot = botPanel.baseCorners[3]; // Front-left base
                } else {
                    pTop = topPanel.corners[1]; // TR
                    pBot = botPanel.corners[2]; // BR
                    bTop = topPanel.baseCorners[1]; // Rear-right base
                    bBot = botPanel.baseCorners[2]; // Front-right base
                }

                // Sloped rafter support beam running top-to-bottom
                const rafter = new Konva.Line({
                    points: [pTop.x, pTop.y, pBot.x, pBot.y],
                    stroke: '#64748b',
                    strokeWidth: 4 / stage.scaleX(),
                    lineCap: 'round'
                });
                structureLayer.add(rafter);

                // Rear vertical column post
                const rearLeg = new Konva.Line({
                    points: [bTop.x, bTop.y - blockH, pTop.x, pTop.y],
                    stroke: '#94a3b8',
                    strokeWidth: 3.5 / stage.scaleX()
                });
                structureLayer.add(rearLeg);

                // Front vertical column post
                const frontLeg = new Konva.Line({
                    points: [bBot.x, bBot.y - blockH, pBot.x, pBot.y],
                    stroke: '#94a3b8',
                    strokeWidth: 3.5 / stage.scaleX()
                });
                structureLayer.add(frontLeg);

                // Diagonal bracing rod
                const diagonal = new Konva.Line({
                    points: [bTop.x, bTop.y - blockH, pBot.x, pBot.y],
                    stroke: '#475569',
                    strokeWidth: 3 / stage.scaleX()
                });
                structureLayer.add(diagonal);

                // 3D Concrete footings resting flat on the roof surface
                [bTop, bBot].forEach(foot => {
                    const blockShape = new Konva.Shape({
                        sceneFunc: function (ctx, shape) {
                            drawConcreteBlock3D(ctx, foot.x, foot.y, bw, blockH, bd);
                            ctx.fillStrokeShape(shape);
                        },
                        fill: '#cbd5e1',
                        stroke: '#475569',
                        strokeWidth: 1 / stage.scaleX()
                    });
                    structureLayer.add(blockShape);
                });
            }
        }

        // Draw Solar panels to Solar Array layer Group
        activePanels.forEach(item => {
            const panelGroup = new Konva.Group();

            // Panel body with realistic dark blue cell texture gradient
            const panelBody = new Konva.Shape({
                sceneFunc: function (ctx, shape) {
                    ctx.save(); // Save state to contain clip path
                    ctx.beginPath();
                    ctx.moveTo(item.corners[0].x, item.corners[0].y);
                    ctx.lineTo(item.corners[1].x, item.corners[1].y);
                    ctx.lineTo(item.corners[2].x, item.corners[2].y);
                    ctx.lineTo(item.corners[3].x, item.corners[3].y);
                    ctx.closePath();
                    ctx.clip();

                    // Cell background gradient
                    const grad = ctx.createLinearGradient(item.corners[0].x, item.corners[0].y, item.corners[2].x, item.corners[2].y);
                    grad.addColorStop(0, '#0f1d3a');
                    grad.addColorStop(0.5, '#13284f');
                    grad.addColorStop(1, '#081023');
                    ctx.fillStyle = grad;
                    ctx.fill();

                    // Wafers grid lines (12 rows, 6 columns)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.lineWidth = 0.8 / stage.scaleX();
                    const cellCols = 6;
                    const cellRows = 12;

                    for (let col = 1; col < cellCols; col++) {
                        const ratio = col / cellCols;
                        ctx.beginPath();
                        ctx.moveTo(item.corners[0].x + (item.corners[1].x - item.corners[0].x) * ratio, item.corners[0].y + (item.corners[1].y - item.corners[0].y) * ratio);
                        ctx.lineTo(item.corners[3].x + (item.corners[2].x - item.corners[3].x) * ratio, item.corners[3].y + (item.corners[2].y - item.corners[3].y) * ratio);
                        ctx.stroke();
                    }

                    for (let r = 1; r < cellRows; r++) {
                        const ratio = r / cellRows;
                        ctx.beginPath();
                        ctx.moveTo(item.corners[0].x + (item.corners[3].x - item.corners[0].x) * ratio, item.corners[0].y + (item.corners[3].y - item.corners[0].y) * ratio);
                        ctx.lineTo(item.corners[1].x + (item.corners[2].x - item.corners[1].x) * ratio, item.corners[1].y + (item.corners[2].y - item.corners[1].y) * ratio);
                        ctx.stroke();
                    }

                    // Gloss highlight
                    const glossGrad = ctx.createLinearGradient(item.corners[0].x, item.corners[0].y, item.corners[2].x, item.corners[2].y);
                    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
                    glossGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.0)');
                    glossGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.0)');
                    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
                    ctx.fillStyle = glossGrad;
                    ctx.beginPath();
                    ctx.moveTo(item.corners[0].x, item.corners[0].y);
                    ctx.lineTo(item.corners[1].x, item.corners[1].y);
                    ctx.lineTo(item.corners[2].x, item.corners[2].y);
                    ctx.lineTo(item.corners[3].x, item.corners[3].y);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore(); // Restore context state to remove clip path
                    ctx.fillStrokeShape(shape);
                }
            });
            panelGroup.add(panelBody);

            // 3D Beveled Silver Aluminum Frame
            const panelFrame = new Konva.Shape({
                sceneFunc: function (ctx, shape) {
                    ctx.lineWidth = 1.5 / stage.scaleX();
                    
                    // Dark underside shading border
                    ctx.strokeStyle = '#334155';
                    ctx.beginPath();
                    ctx.moveTo(item.corners[2].x, item.corners[2].y);
                    ctx.lineTo(item.corners[3].x, item.corners[3].y);
                    ctx.lineTo(item.corners[0].x, item.corners[0].y);
                    ctx.stroke();

                    // Light reflecting highlighted top/right border
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.moveTo(item.corners[0].x, item.corners[0].y);
                    ctx.lineTo(item.corners[1].x, item.corners[1].y);
                    ctx.lineTo(item.corners[2].x, item.corners[2].y);
                    ctx.stroke();

                    ctx.fillStrokeShape(shape);
                }
            });
            panelGroup.add(panelFrame);

            // Double click panel deletes it
            panelGroup.on('dblclick', () => {
                state.panels.deleted[`${item.row}_${item.col}`] = true;
                saveHistory();
                recalculatePanelsLayerAndRedraw();
            });

            solarArrayGroup.add(panelGroup);
        });
    }

    // Bind Transformer to the selected node if in select tool mode
    if (state.tool === 'select' && activePanels.length > 0) {
        transformer.nodes([solarArrayGroup]);
        transformer.show();
    } else {
        transformer.nodes([]);
        transformer.hide();
    }

    // 4. Render Measurements, Walkway labels, and compass facing dial
    measurementsLayer.destroyChildren();
    if (state.layers.labels) {
        // Draw scale indicator line
        const scaleLenM = 10;
        const scaleLenPx = scaleLenM * state.scalePixelsPerMeter;
        const scaleX = 40;
        const scaleY = stage.height() - 40;

        const scaleLine = new Konva.Line({
            points: [scaleX, scaleY, scaleX + scaleLenPx, scaleY],
            stroke: '#10b981',
            strokeWidth: 3,
            lineCap: 'square'
        });
        measurementsLayer.add(scaleLine);

        const scaleText = new Konva.Text({
            x: scaleX,
            y: scaleY - 18,
            text: `Scale Calibration: ${scaleLenM} meters`,
            fontSize: 12,
            fontStyle: 'bold',
            fill: '#10b981'
        });
        measurementsLayer.add(scaleText);

        // Draw Compass Dial
        if (state.layers.compass) {
            const compX = stage.width() - 80;
            const compY = 80;
            const size = 30;

            const compassBase = new Konva.Circle({
                x: compX,
                y: compY,
                radius: size,
                fill: 'rgba(15, 23, 42, 0.85)',
                stroke: '#3b82f6',
                strokeWidth: 2
            });
            measurementsLayer.add(compassBase);

            // Labels
            const labelN = new Konva.Text({ x: compX - 4, y: compY - size + 4, text: 'N', fontSize: 10, fill: '#ef4444', fontStyle: 'bold' });
            const labelS = new Konva.Text({ x: compX - 4, y: compY + size - 12, text: 'S', fontSize: 10, fill: '#ffffff' });
            measurementsLayer.add(labelN, labelS);

            // Needle indicating direction angle
            const compAngle = state.panels.direction === 'South' ? 180 : (state.panels.direction === 'West' ? 270 : (state.panels.direction === 'North' ? 0 : 90));
            const needle = new Konva.Line({
                points: [
                    compX, compY - size + 8,
                    compX - 6, compY,
                    compX, compY + size - 8,
                    compX + 6, compY
                ],
                fill: '#ef4444',
                closed: true,
                rotation: compAngle,
                offset: { x: compX, y: compY },
                x: compX,
                y: compY
            });
            measurementsLayer.add(needle);
        }
    }

    stage.batchDraw();
    updateLiveMetrics();
}

function recalculatePanelsLayerAndRedraw() {
    recalculatePanelsLayout();
    renderKonvaWorkspace();
}

// ── Math & Geometry Helpers ──────────────────────────────────────────────
function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function drawConcreteBlock3D(ctx, x, y, w, h, d) {
    const topY = y - h;
    const botY = y;

    // Top face (lighter grey highlight)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(x - w/2, topY);
    ctx.lineTo(x + w/2, topY);
    ctx.lineTo(x + w/2 - d, topY - d);
    ctx.lineTo(x - w/2 - d, topY - d);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front face (mid tone concrete)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(x - w/2, topY);
    ctx.lineTo(x + w/2, topY);
    ctx.lineTo(x + w/2, botY);
    ctx.lineTo(x - w/2, botY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side face (dark shadow concrete)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x + w/2, topY);
    ctx.lineTo(x + w/2 - d, topY - d);
    ctx.lineTo(x + w/2 - d, botY - d);
    ctx.lineTo(x + w/2, botY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// ── UI Actions & Toolbar handlers ────────────────────────────────────────
function setCanvasTool(tool) {
    state.tool = tool;
    $('.toolbar-btn').removeClass('active');
    
    if (tool === 'select') $('#toolSelect').addClass('active');
    if (tool === 'boundary') $('#toolBoundary').addClass('active');
    if (tool === 'obstacle') $('#toolObstacle').addClass('active');
    if (tool === 'calibrate') $('#toolCalibrate').addClass('active');

    // Enable stage dragging for zoom and scroll pan
    stage.draggable(tool === 'select');
    
    renderKonvaWorkspace();
}

function zoomStageAtPoint(scaleFactor) {
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = oldScale * scaleFactor;
    
    // Center of stage viewport
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;

    const mousePointTo = {
        x: (centerX - stage.x()) / oldScale,
        y: (centerY - stage.y()) / oldScale
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
        x: centerX - mousePointTo.x * newScale,
        y: centerY - mousePointTo.y * newScale
    };
    stage.position(newPos);
    stage.batchDraw();
    updateZoomPercentage();
}

function zoomIn() {
    zoomStageAtPoint(1.15);
}

function zoomOut() {
    zoomStageAtPoint(1 / 1.15);
}

function triggerResetZoom() {
    zoomFit();
}

function zoomFit() {
    if (!state.image || !stage) return;
    const stageW = stage.width();
    const stageH = stage.height();
    const imgW = state.image.width;
    const imgH = state.image.height;

    const scale = Math.min(stageW / imgW, stageH / imgH);
    stage.scale({ x: scale, y: scale });
    
    const x = (stageW - imgW * scale) / 2;
    const y = (stageH - imgH * scale) / 2;
    stage.position({ x, y });
    
    stage.batchDraw();
    updateZoomPercentage();
}

function triggerClearAll() {
    if (confirm("Are you sure you want to clear all boundaries and exclusion zones?")) {
        state.boundary = [];
        state.obstacles = [];
        state.panels.deleted = {};
        saveHistory();
        renderKonvaWorkspace();
        showToast('Workspace cleared successfully.', 'info');
    }
}

function toggleFullscreen() {
    const el = document.getElementById('canvasWorkspaceWrapper');
    if (!document.fullscreenElement) {
        el.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleLayer(layerName) {
    state.layers[layerName] = !state.layers[layerName];
    renderKonvaWorkspace();
}

// ── Parameters changed triggers ──────────────────────────────────────────
function onParametersChanged() {
    state.panels.capacityKw = parseFloat($('#inputCapacity').val()) || 5.0;
    state.panels.watt = parseInt($('#inputPanelWatt').val()) || 550;
    state.panels.length = parseInt($('#inputPanelLength').val()) || 2278;
    state.panels.width = parseInt($('#inputPanelWidth').val()) || 1134;
    state.panels.orientation = $('#inputOrientation').val() || 'portrait';
    state.panels.height = parseFloat($('#inputHeight').val()) || 1.0;
    state.panels.tilt = parseInt($('#inputTilt').val()) || 15;
    
    state.panels.rowSpacing = parseFloat($('#inputRowSpacing').val()) || 1.2;
    state.boundaryWalkway = parseFloat($('#boundaryWalkway').val()) || 0.5;
    
    const facing = $('#inputCompassFacing').val() || 'South';
    const oldFacing = state.panels.direction;
    state.panels.direction = facing;
    state.mountType = $('#inputMountType').val() || 'RCC-Ballast';

    // If the roof direction changes, auto-align panel rotation so they face South
    if (facing !== oldFacing) {
        let rot = 0;
        if (facing === 'West') rot = 90;
        else if (facing === 'North') rot = 180;
        else if (facing === 'East') rot = 270;
        
        state.panels.rotation = rot;
        $('#panelRotate').val(rot);
        $('#rotateVal').text(rot + '°');
    }

    recalculatePanelsLayout();
    renderKonvaWorkspace();
}

// ── BOM & Metrics Calculation ────────────────────────────────────────────
function getRoofArea() {
    if (state.boundary.length < 3) return 0;
    // Calculate boundary polygon area using Shoelace formula
    let areaPx = 0;
    const n = state.boundary.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        areaPx += state.boundary[i].x * state.boundary[j].y;
        areaPx -= state.boundary[j].x * state.boundary[i].y;
    }
    areaPx = Math.abs(areaPx) / 2;
    const scale = state.scalePixelsPerMeter || 40;
    return areaPx / (scale * scale);
}

function onSliderAdjust() {
    state.panels.rotation = parseInt($('#panelRotate').val()) || 0;
    $('#rotateVal').text(state.panels.rotation + '°');

    state.panels.scale = parseFloat($('#panelScale').val()) || 1.0;
    $('#scaleVal').text(state.panels.scale.toFixed(1));

    recalculatePanelsLayout();
    renderKonvaWorkspace();
}

function updateLiveMetrics() {
    const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
    const panelCount = activePanels.length;
    const capacityKw = (panelCount * state.panels.watt) / 1000;
    const isPortrait = state.panels.orientation === 'portrait';
    const pW = (isPortrait ? state.panels.width : state.panels.length) / 1000;
    const pH = (isPortrait ? state.panels.length : state.panels.width) / 1000;
    const occupiedArea = panelCount * pW * pH;
    const roofArea = getRoofArea();
    const remainingArea = Math.max(0, roofArea - occupiedArea);

    // Update bottom status metric bar labels
    $('#statCapacity').text(capacityKw.toFixed(2) + ' kW');
    $('#statPanels').text(panelCount);
    $('#statArea').text(occupiedArea.toFixed(1) + ' m²');
    $('#statRemaining').text(remainingArea.toFixed(1) + ' m²');

    // Update Sidebar Material Estimates (BOM)
    $('#bomPlPlaced').text(panelCount);
    $('#bomRails').text(Math.ceil(panelCount * pW * 2));
    $('#bomEndClamps').text(Math.max(4, Math.ceil(panelCount / 10) * 4));
    $('#bomMidClamps').text(Math.max(0, (panelCount - 2) * 2));
    $('#bomLegSets').text(Math.ceil(panelCount / 2));
    $('#bomConcreteBlocks').text(state.mountType === 'RCC-Ballast' ? Math.ceil(panelCount / 2) * 2 : 0);
}

// ── Configurations Export & Import JSON ──────────────────────────────────
function exportProjectJSON() {
    const payload = {
        boundary: state.boundary,
        obstacles: state.obstacles,
        panels: {
            capacityKw: state.panels.capacityKw,
            watt: state.panels.watt,
            length: state.panels.length,
            width: state.panels.width,
            orientation: state.panels.orientation,
            tilt: state.panels.tilt,
            height: state.panels.height,
            rowSpacing: state.panels.rowSpacing,
            autoSpacing: state.panels.autoSpacing,
            direction: state.panels.direction,
            rotation: state.panels.rotation,
            scale: state.panels.scale,
            offset: state.panels.offset,
            deleted: state.panels.deleted
        },
        scalePixelsPerMeter: state.scalePixelsPerMeter,
        boundaryWalkway: state.boundaryWalkway,
        mountType: state.mountType
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `solar-roof-proposal-${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('Project JSON exported successfully.', 'success');
}

function triggerJSONUpload() {
    document.getElementById('projectJsonUpload').click();
}

function loadProjectJSON(event) {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const config = JSON.parse(e.target.result);
                applyStateConfig(config);
                showToast('Project JSON loaded successfully.', 'success');
            } catch (err) {
                showToast('Invalid configuration JSON file.', 'error');
            }
        };
        reader.readAsText(event.target.files[0]);
    }
}

// ── Autosave and Recovery state ──────────────────────────────────────────
function saveHistory() {
    const snapshot = JSON.stringify({
        boundary: state.boundary,
        obstacles: state.obstacles,
        panels: state.panels,
        scalePixelsPerMeter: state.scalePixelsPerMeter,
        boundaryWalkway: state.boundaryWalkway,
        mountType: state.mountType
    });
    
    state.history.push(snapshot);
    state.redoStack = []; // Clear redo stack on new action
    
    // Auto-save to LocalStorage
    try {
        localStorage.setItem('solar_designer_autosave', JSON.stringify({
            imageSrc: state.imageSrc,
            boundary: state.boundary,
            obstacles: state.obstacles,
            panels: state.panels,
            scalePixelsPerMeter: state.scalePixelsPerMeter,
            boundaryWalkway: state.boundaryWalkway,
            mountType: state.mountType
        }));
    } catch (e) {
        console.warn("Autosave storage size quota exceeded.");
    }
}

function triggerUndo() {
    if (state.history.length > 1) {
        const current = state.history.pop();
        state.redoStack.push(current);
        const prev = JSON.parse(state.history[state.history.length - 1]);
        applyStateConfig(prev);
        showToast('Undo', 'info');
    }
}

function triggerRedo() {
    if (state.redoStack.length > 0) {
        const next = JSON.parse(state.redoStack.pop());
        state.history.push(JSON.stringify(next));
        applyStateConfig(next);
        showToast('Redo', 'info');
    }
}

function applyStateConfig(cfg) {
    state.boundary = cfg.boundary || [];
    state.obstacles = cfg.obstacles || [];
    state.panels = cfg.panels || {};
    state.scalePixelsPerMeter = cfg.scalePixelsPerMeter || 40;
    state.boundaryWalkway = cfg.boundaryWalkway || 0.5;
    state.mountType = cfg.mountType || 'RCC-Ballast';

    // Safety migrations for old autosave objects
    if (state.panels.scale === undefined || isNaN(state.panels.scale)) {
        state.panels.scale = 1.0;
    }
    if (state.panels.rotation === undefined || isNaN(state.panels.rotation)) {
        state.panels.rotation = 0;
    }
    if (!state.panels.offset || state.panels.offset.u === undefined) {
        state.panels.offset = { u: 0.5, v: 0.5 };
    }
    if (!state.panels.items) {
        state.panels.items = [];
    }

    // Update UI controls to match
    $('#inputCapacity').val(state.panels.capacityKw);
    $('#inputPanelWatt').val(state.panels.watt);
    $('#inputPanelLength').val(state.panels.length);
    $('#inputPanelWidth').val(state.panels.width);
    $('#inputOrientation').val(state.panels.orientation);
    $('#inputHeight').val(state.panels.height);
    $('#inputTilt').val(state.panels.tilt);
    $('#inputRowSpacing').val(state.panels.rowSpacing);
    $('#boundaryWalkway').val(state.boundaryWalkway);
    $('#inputNorthAngle').val(state.panels.direction === 'South' ? 0 : (state.panels.direction === 'West' ? 90 : (state.panels.direction === 'North' ? 180 : 270)));
    $('#inputCompassFacing').val(state.panels.direction);
    $('#inputMountType').val(state.mountType);

    // Update slider values and text
    $('#panelScale').val(state.panels.scale);
    $('#scaleVal').text(state.panels.scale.toFixed(1));
    $('#panelRotate').val(state.panels.rotation);
    $('#rotateVal').text(state.panels.rotation + '°');

    recalculatePanelsLayout();
    renderKonvaWorkspace();
}

function loadAutosave() {
    const raw = localStorage.getItem('solar_designer_autosave');
    if (!raw) return;

    try {
        const config = JSON.parse(raw);
        if (config && config.imageSrc) {
            showLoader();
            state.imageSrc = config.imageSrc;
            state.image = new Image();
            state.image.onload = function () {
                if (roofImageNode) roofImageNode.destroy();
                roofImageNode = new Konva.Image({
                    image: state.image,
                    width: state.image.width,
                    height: state.image.height,
                    name: 'bgImage'
                });
                roofImageLayer.add(roofImageNode);

                zoomFit();
                applyStateConfig(config);
                
                $('#uploadOverlay').hide();
                $('#workspaceToolbar').show();
                $('#btnExportImage').show();
                $('#btnExportPdf').show();
                
                state.history.push(JSON.stringify(config));
                hideLoader();
                showToast('Autosave design recovered successfully.', 'info');
            };
            state.image.src = config.imageSrc;
        }
    } catch (e) {
        console.error("Autosave load failed", e);
    }
}

// ── Helper Utilities ─────────────────────────────────────────────────────
function updateZoomPercentage() {
    if (stage) {
        const pct = Math.round(stage.scaleX() * 100);
        $('#zoomPercentageVal').text(pct + '%');
    }
}

function updateCursorCoordinates() {
    if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
            const oldScale = stage.scaleX();
            const realX = Math.round((pos.x - stage.x()) / oldScale);
            const realY = Math.round((pos.y - stage.y()) / oldScale);
            $('#cursorCoordinatesVal').text(`X: ${realX}, Y: ${realY}`);
        }
    }
}

function resetLayout() {
    if (!state.image) {
        showToast('Please upload a roof image first.', 'warning');
        return;
    }

    if (confirm("Are you sure you want to reset all configurations to default parameters?")) {
        state.scalePixelsPerMeter = Math.max(15, state.image.width / 12);
        
        const paddingX = state.image.width * 0.15;
        const paddingY = state.image.height * 0.15;
        state.boundary = [
            { x: paddingX, y: paddingY },
            { x: state.image.width - paddingX, y: paddingY },
            { x: state.image.width - paddingX, y: state.image.height - paddingY },
            { x: paddingX, y: state.image.height - paddingY }
        ];

        state.panels.capacityKw = 5.0;
        state.panels.watt = 550;
        state.panels.length = 2278;
        state.panels.width = 1134;
        state.panels.orientation = 'portrait';
        state.panels.tilt = 15;
        state.panels.height = 1.0;
        state.panels.rowSpacing = 1.2;
        state.panels.autoSpacing = true;
        state.panels.direction = 'South';
        state.panels.rotation = 0;
        state.panels.scale = 1.0;
        state.panels.offset = { u: 0.5, v: 0.5 };
        state.panels.deleted = {};
        state.panels.items = [];

        state.layers = {
            image: true,
            boundary: true,
            panels: true,
            structure: true,
            obstacles: true,
            labels: true,
            compass: true
        };

        state.boundaryWalkway = 0.5;
        state.mountType = 'RCC-Ballast';
        state.obstacles = [];

        zoomFit();

        localStorage.removeItem('solar_designer_autosave');

        // Update UI controls to match updated state
        $('#inputCapacity').val(5.0);
        $('#inputPanelWatt').val(550);
        $('#inputPanelLength').val(2278);
        $('#inputPanelWidth').val(1134);
        $('#inputOrientation').val('portrait');
        $('#inputHeight').val('1.0');
        $('#inputTilt').val('15');
        $('#inputRowSpacing').val('1.2');
        $('#boundaryWalkway').val('0.5');
        $('#inputNorthAngle').val(0);
        $('#inputCompassFacing').val('South');
        $('#inputMountType').val('RCC-Ballast');
        $('#panelScale').val(1.0);
        $('#scaleVal').text('1.0');
        $('#panelRotate').val(0);
        $('#rotateVal').text('0°');

        saveHistory();
        recalculatePanelsLayout();
        renderKonvaWorkspace();

        showToast('Layout and parameters reset to default configuration.', 'success');
    }
}

// ── Export High-Res PNG Snapshots ────────────────────────────────────────
function exportProposalImage() {
    if (!state.image || !stage) return;

    showLoader();
    setTimeout(() => {
        try {
            // Deselect array to hide transform handles
            transformer.nodes([]);
            stage.batchDraw();

            // Export using stage toDataURL at high quality 2x pixel ratio
            const dataUrl = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'
            });

            const link = document.createElement('a');
            link.download = `solar-proposal-layout-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            // Restore selection if selected previously
            const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
            if (state.tool === 'select' && activePanels.length > 0) {
                transformer.nodes([solarArrayGroup]);
            }
            stage.batchDraw();

            hideLoader();
            showToast('High-resolution PNG proposal image exported successfully.', 'success');
        } catch (err) {
            hideLoader();
            showToast('PNG Export failed.', 'error');
            console.error(err);
        }
    }, 200);
}

// ── PDF Proposal Generation ──────────────────────────────────────────────
function exportProposalPdf() {
    if (!state.image || !stage) return;

    showLoader();
    setTimeout(() => {
        try {
            // Deselect to hide Transformer borders
            transformer.nodes([]);
            stage.batchDraw();

            // Export high-res image
            const imageBase64 = stage.toDataURL({
                pixelRatio: 1.5,
                mimeType: 'image/jpeg',
                quality: 0.85
            });

            // Restore selection if selected previously
            const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
            if (state.tool === 'select' && activePanels.length > 0) {
                transformer.nodes([solarArrayGroup]);
            }
            stage.batchDraw();

            const panelCount = activePanels.length;
            const capacityKw = (panelCount * state.panels.watt) / 1000;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>NRS Solar Installation Proposal</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo-title { font-size: 24px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
                        .proposal-meta { text-align: right; font-size: 14px; color: #64748b; }
                        .preview-image { width: 100%; height: auto; max-height: 480px; object-fit: contain; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 30px; }
                        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 45px; }
                        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
                        .metric-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
                        .metric-lbl { font-size: 11px; text-transform: uppercase; font-weight: 600; color: #64748b; }
                        .bom-title { font-size: 18px; font-weight: 700; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 10px; margin-bottom: 20px; }
                        .bom-table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
                        .bom-table th { background: #f1f5f9; text-align: left; padding: 12px 15px; font-size: 13px; font-weight: 600; text-transform: uppercase; }
                        .bom-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                        .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <img src="/images/nrslogo.png" style="height: 60px; width: auto;" alt="NRS Solar Solution Logo" />
                            <div style="font-size: 14px; color: #3b82f6; font-weight: 600; margin-top: 5px;">AI Rooftop Spatial Analytics Proposal</div>
                        </div>
                        <div class="proposal-meta">
                            <div>Proposal Date: <b>${dateStr}</b></div>
                            <div>System ID: <b>NRS-${Math.floor(100000 + Math.random() * 900000)}</b></div>
                        </div>
                    </div>

                    <img src="${imageBase64}" class="preview-image" alt="Roof Design Layout Preview" />

                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-lbl">Target Capacity</div>
                            <div class="metric-val" style="color: #2563eb;">${capacityKw.toFixed(2)} kW</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-lbl">PV Modules</div>
                            <div class="metric-val">${panelCount} Nos</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-lbl">Solar Module Wattage</div>
                            <div class="metric-val">${state.panels.watt} Wp</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-lbl">Rooftop Area Used</div>
                            <div class="metric-val">${(panelCount * (state.panels.width/1000) * (state.panels.length/1000)).toFixed(1)} m²</div>
                        </div>
                    </div>

                    <div class="bom-title">Bill of Materials (BOM)</div>
                    <table class="bom-table">
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Solar PV Modules (${state.panels.watt}Wp Mono-PERC Half Cut)</td>
                                <td style="font-weight: bold;">${panelCount}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>End Clamps (Aluminum Alloy, 40mm)</td>
                                <td style="font-weight: bold;">${Math.max(4, Math.ceil(panelCount / 10) * 4)}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>Mid Clamps (Aluminum Alloy)</td>
                                <td style="font-weight: bold;">${Math.max(0, (panelCount - 2) * 2)}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>Galvanized Steel Leg structure sets (${state.panels.height}m)</td>
                                <td style="font-weight: bold;">${Math.ceil(panelCount / 2)}</td>
                                <td>sets</td>
                            </tr>
                            ${state.mountType === 'RCC-Ballast' ? `
                            <tr>
                                <td>Precast Concrete Blocks (35 kg ballasts)</td>
                                <td style="font-weight: bold;">${Math.ceil(panelCount / 2) * 2}</td>
                                <td>Nos</td>
                            </tr>` : ''}
                        </tbody>
                    </table>

                    <div class="footer">
                        NRS Solar Solution &copy; 2026. This proposal has been auto-generated via AI Rooftop Spatial Analytics.
                    </div>
                    
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            hideLoader();
            showToast('PDF Proposal Report generated successfully.', 'success');
        } catch (err) {
            hideLoader();
            showToast('PDF Report generation failed.', 'error');
            console.error(err);
        }
    }, 300);
}

// ── Save Design Configuration to Server DB ───────────────────────────────
function saveDesignToServer() {
    if (!state.imageSrc) {
        showToast("Please upload a roof image and define panel boundaries first.", "warning");
        return;
    }

    showLoader();
    
    const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
    const payload = {
        capacityKw: (activePanels.length * state.panels.watt) / 1000,
        direction: state.panels.direction
    };

    $.ajax({
        url: '/roof-designer/save',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function(response) {
            hideLoader();
            if (response.success) {
                showToast(response.message, 'success');
            } else {
                showToast(response.message || 'Saving failed.', 'error');
            }
        },
        error: function(xhr, status, error) {
            hideLoader();
            showToast('Database connection failed. Design saved in local autosave.', 'warning');
            console.error(error);
        }
    });
}
