// Solar Roof Analyzer & Designer - Konva.js Vector Canvas & Geometry Engine

// Global State Model
let state = {
    image: null,
    imageSrc: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    tool: 'select', // 'select' | 'boundary' | 'obstacle' | 'calibrate'
    scalePixelsPerMeter: 40,
    calibration: { active: false, start: null, end: null, distance: 10 },
    
    boundary: [],
    
    obstacles: [], // [{id, type, polygon, bounds, label}]
    
    panels: {
        capacityKw: 5.0,
        watt: 550,
        length: 2278,
        width: 1134,
        orientation: 'portrait',
        tilt: 15,
        height: 1.0,
        rowSpacing: 1.2,
        autoSpacing: true,
        direction: 'South',
        rotation: 0,
        scale: 1.0,
        offset: { u: 0.5, v: 0.5 },
        deleted: {},
        items: [],
        rows: 0,
        cols: 0
    },
    
    layers: {
        image: true,
        boundary: true,
        panels: true,
        structure: true,
        obstacles: true,
        labels: true,
        compass: true,
        perspective: false
    },
    
    boundaryWalkway: 0.5,
    mountType: 'RCC-Ballast',
    history: [],
    redoStack: [],
    
    detection: {
        status: 'idle',
        confidence: 0,
        processingTimeMs: 0,
        engineReady: false
    },
    
    perspective: {
        engine: null,
        vanishingPoints: [],
        horizonLine: null,
        roofNormal: null
    },
    
    renderer: null,
    
    roof: {
        estimatedSlopeAngle: 0,
        estimatedAreaM2: 0,
        orientation: 'unknown',
        usableAreaM2: 0
    },
    
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
let perspectiveGridLayer = null;

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
            const rect = wrapper.getBoundingClientRect();
            stage.width(rect.width);
            stage.height(rect.height);
            stage.batchDraw();
        }
    });
    resizeObserver.observe(document.getElementById('canvasWorkspaceWrapper'));

    // Handle fullscreen transitions
    document.addEventListener('fullscreenchange', () => {
        // Wait a tick for ResizeObserver to update stage width/height
        setTimeout(() => {
            if (state.image.src) zoomFit();
        }, 100);
    });

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
});

// ── Konva Initialization & Interaction Setup ─────────────────────────────
function initKonva() {
    const wrapper = document.getElementById('canvasWorkspaceWrapper');
    
    // Create Konva Stage
    stage = new Konva.Stage({
        container: 'designerCanvasContainer',
        width: wrapper.getBoundingClientRect().width,
        height: wrapper.getBoundingClientRect().height
    });

    // Create Stage Layers
    roofImageLayer = new Konva.Layer();
    perspectiveGridLayer = new Konva.Layer();
    shadowsLayer = new Konva.Layer();
    structureLayer = new Konva.Layer();
    solarArrayLayer = new Konva.Layer();
    boundaryLayer = new Konva.Layer();
    obstaclesLayer = new Konva.Layer();
    measurementsLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();

    stage.add(roofImageLayer);
    stage.add(perspectiveGridLayer);
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

    let isDrawing = false;
    let tempShape = null;
    let drawStart = null;

    stage.on('mousedown', (e) => {
        const isBgClick = e.target === stage || e.target.hasName('bgImage');
        const isMiddleBtn = e.evt && (e.evt.button === 1 || e.evt.button === 4);
        
        if (isBgClick || isMiddleBtn || state.tool === 'select') {
            if (e.target.hasName('anchor') || e.target.hasName('vertex') || e.target.getParent()?.hasName('transformer')) {
                return;
            }
            stage.startDrag();
        } else if (state.tool === 'boundary') {
            if (!e.target.hasName('vertex')) {
                const pos = stage.getPointerPosition();
                const oldScale = stage.scaleX();
                const realX = (pos.x - stage.x()) / oldScale;
                const realY = (pos.y - stage.y()) / oldScale;
                state.boundary.push({x: realX, y: realY});
                saveHistory();
                recalculatePanelsLayout();
                renderKonvaWorkspace();
            }
        } else if (state.tool === 'obstacle' || state.tool === 'calibrate') {
            isDrawing = true;
            const pos = stage.getPointerPosition();
            const oldScale = stage.scaleX();
            drawStart = {
                x: (pos.x - stage.x()) / oldScale,
                y: (pos.y - stage.y()) / oldScale
            };
            
            if (state.tool === 'obstacle') {
                tempShape = new Konva.Rect({
                    x: drawStart.x, y: drawStart.y,
                    width: 0, height: 0,
                    fill: 'rgba(255, 0, 0, 0.3)',
                    stroke: 'red', strokeWidth: 2 / oldScale
                });
                obstaclesLayer.add(tempShape);
            } else if (state.tool === 'calibrate') {
                tempShape = new Konva.Line({
                    points: [drawStart.x, drawStart.y, drawStart.x, drawStart.y],
                    stroke: 'yellow', strokeWidth: 3 / oldScale, dash: [5, 5]
                });
                uiLayer.add(tempShape);
            }
        }
    });

    stage.on('mousemove', () => {
        updateCursorCoordinates();
        if (!isDrawing || !tempShape || !drawStart) return;
        
        const pos = stage.getPointerPosition();
        const oldScale = stage.scaleX();
        const currX = (pos.x - stage.x()) / oldScale;
        const currY = (pos.y - stage.y()) / oldScale;
        
        if (state.tool === 'obstacle') {
            tempShape.width(currX - drawStart.x);
            tempShape.height(currY - drawStart.y);
            obstaclesLayer.batchDraw();
        } else if (state.tool === 'calibrate') {
            tempShape.points([drawStart.x, drawStart.y, currX, currY]);
            uiLayer.batchDraw();
        }
    });

    stage.on('mouseup', () => {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (state.tool === 'obstacle' && tempShape) {
            const w = tempShape.width();
            const h = tempShape.height();
            if (Math.abs(w) > 5 && Math.abs(h) > 5) {
                const type = $('#obstacleTypeSelector').val() || 'custom';
                const x = w < 0 ? drawStart.x + w : drawStart.x;
                const y = h < 0 ? drawStart.y + h : drawStart.y;
                const aw = Math.abs(w);
                const ah = Math.abs(h);
                
                state.obstacles.push({
                    id: Date.now(),
                    type: type,
                    label: type.toUpperCase(),
                    polygon: [
                        {x: x, y: y},
                        {x: x+aw, y: y},
                        {x: x+aw, y: y+ah},
                        {x: x, y: y+ah}
                    ]
                });
                saveHistory();
                recalculatePanelsLayout();
                setCanvasTool('select');
            } else {
                tempShape.destroy();
            }
        } else if (state.tool === 'calibrate' && tempShape) {
            const pts = tempShape.points();
            const dx = pts[2] - pts[0];
            const dy = pts[3] - pts[1];
            const pixelDist = Math.sqrt(dx*dx + dy*dy);
            
            if (pixelDist > 10) {
                window.lastCalibrationPixels = pixelDist;
                $('#calibrationValueContainer').show();
            } else {
                tempShape.destroy();
            }
            setCanvasTool('select');
        }
        
        tempShape = null;
        drawStart = null;
        renderKonvaWorkspace();
    });

    solarArrayGroup = new Konva.Group({
        name: 'solarArrayGroup',
        draggable: true
    });
    solarArrayLayer.add(solarArrayGroup);

    solarArrayGroup.getClientRect = function () {
        const activePanels = (state.panels.items || []).filter(item => !state.panels.deleted[`${item.row}_${item.col}`]);
        if (activePanels.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        activePanels.forEach(item => {
            if(item.corners) {
                item.corners.forEach(pt => {
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                });
            }
            if(item.baseCorners) {
                item.baseCorners.forEach(pt => {
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                });
            }
        });

        const pad = 10;
        if(minX === Infinity) return {x:0, y:0, width:0, height:0};
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
        keepRatio: false,
        rotateAnchorOffset: 25,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']
    });
    uiLayer.add(transformer);

    solarArrayGroup.on('dragmove', () => {
        if (state.boundary.length < 3) return;
        if (!state.panels.footprint || !state.panels.footprint.center) return;

        // Smooth visual drag: translate the structure and shadows along with the panels 
        // without doing a full 3D physical recalculation 60 times a second.
        structureLayer.position(solarArrayGroup.position());
        shadowsLayer.position(solarArrayGroup.position());
        stage.batchDraw();
    });

    solarArrayGroup.on('transform', () => {
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
        if (state.boundary.length < 3) return;
        if (!state.panels.footprint || !state.panels.footprint.center) return;

        if (e.type === 'dragend') {
            // 1. Get current screen position of the footprint center
            const centerScreen = state.perspective.engine.projectToScreen(
                state.panels.footprint.center.x, 
                state.panels.footprint.center.y, 
                0
            );
            
            // 2. Add the drag pixel delta to the screen position
            const newCenterScreen = {
                x: centerScreen.x + solarArrayGroup.x(),
                y: centerScreen.y + solarArrayGroup.y()
            };
            
            // 3. Convert the new screen position back to true physical meters
            const newCenterWorld = state.perspective.engine.screenToWorld(
                newCenterScreen.x, 
                newCenterScreen.y
            );

            // Update footprint center in true physical coordinates
            state.panels.footprint.center.x = newCenterWorld.x;
            state.panels.footprint.center.y = newCenterWorld.y;

            // Boundary clamping
            clampFootprintToBoundary();

            // Reset Konva group positions
            solarArrayGroup.position({ x: 0, y: 0 });
            structureLayer.position({ x: 0, y: 0 });
            shadowsLayer.position({ x: 0, y: 0 });

            // On dragend, if the user drags it to a narrow place, the engine will automatically
            // hide panels that don't fit. We don't change the footprint dimensions so it preserves 
            // the array block shape.
            recalculatePanelsLayout();
            renderKonvaWorkspace();
        } else if (e.type === 'transformend') {
            const sX = solarArrayGroup.scaleX();
            const sY = solarArrayGroup.scaleY();
            if ((sX !== 1 || sY !== 1) && state.panels.footprint) {
                // Convert visual scale to physical footprint dimension change
                state.panels.footprint.width = Math.max(0.5, state.panels.footprint.width * sX);
                state.panels.footprint.height = Math.max(0.5, state.panels.footprint.height * sY);

                // Boundary clamping
                clampFootprintToBoundary();

                // Reset visual scale — geometry engine handles physical dimensions
                solarArrayGroup.scale({ x: 1, y: 1 });

                // IMPORTANT: Do NOT change capacity, panel count, rows, or cols here.
                // The geometry engine will fit as many panels as possible within the
                // new footprint, capped at totalModulesNeeded (from capacity).

                recalculatePanelsLayout();
                renderKonvaWorkspace();

                // Show warning if insufficient space
                if (state.panels._lastResult && state.panels._lastResult.insufficientSpace) {
                    showToast(
                        `Footprint cannot accommodate ${state.panels._lastResult.requiredModules} panels. ` +
                        `Only ${state.panels._lastResult.totalModules} fit.`,
                        'warning'
                    );
                }
            }
        }
        saveHistory();
    });
}

function getDistance(p1, p2) {
    if(!p1 || !p2) return 0;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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
            
            state.image = new Image();
            state.image.onload = function () {
                // Use natural dimensions for accurate rendering
                const natural = window.imageUtils.getNaturalSize(state.image);
                state.image.width = natural.width;
                state.image.height = natural.height;

                zoomFit();

                if (roofImageNode) roofImageNode.destroy();
                roofImageNode = new Konva.Image({
                    image: state.image,
                    width: natural.width,
                    height: natural.height,
                    name: 'bgImage'
                });
                roofImageLayer.add(roofImageNode);

                state.scalePixelsPerMeter = Math.max(15, natural.width / 12);

                state.panels.offset = { u: 0.5, v: 0.5 };
                state.panels.scale = 1.0;
                state.panels.rotation = 0;
                state.panels.deleted = {};
                state.obstacles = [];

                $('#uploadOverlay').hide();
                $('#workspaceToolbar').show();
                $('#btnExportImage').show();
                $('#btnExportPdf').show();

                hideLoader();
                
                // Trigger AI detection pipeline instead of default boundary
                startRoofDetection(state.image);
            };
            state.image.src = compressedSrc;
        };
        rawImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showLoader() {
    $('#loaderOverlay').show();
}
function hideLoader() {
    $('#loaderOverlay').hide();
}
function showToast(msg, type) {
    console.log(`[TOAST ${type}] ${msg}`);
}

// ── AI Detection Pipeline ────────────────────────────────────────────────
function showDetectionOverlay() {
    $('#detectionOverlay').show();
    $('#detectionProgressBar').css('width', '0%');
    $('#detectionStatusText').text('Initializing AI Engine...');
    for(let i=1; i<=6; i++) {
        markDetectionStep(i, 'pending');
    }
}

function hideDetectionOverlay() {
    $('#detectionOverlay').hide();
}

function markDetectionStep(stepNum, status) {
    const el = $(`#detectStep${stepNum}`);
    el.removeClass('pending active done error');
    el.addClass(status);
}

function onDetectionProgress(step, message, percent) {
    $('#detectionStatusText').text(message);
    $('#detectionProgressBar').css('width', `${percent}%`);
    markDetectionStep(step, percent >= 100 ? 'done' : 'active');
}

function startRoofDetection(imageElement) {
    showDetectionOverlay();
    
    if (typeof RoofDetection === 'undefined' || !RoofDetection.detectRoofFromImage) {
        console.warn('RoofDetection module not found, using fallback.');
        fallbackDefaultBoundary();
        hideDetectionOverlay();
        return;
    }

    state.detection.status = 'initializing';

    RoofDetection.initDetectionEngine(onDetectionProgress)
        .then(() => {
            state.detection.status = 'detecting';
            return RoofDetection.detectRoofFromImage(imageElement, { onProgress: onDetectionProgress });
        })
        .then((result) => {
            state.boundary = result.roofPolygon || result.boundary || [];
            state.obstacles = result.obstacles || [];
            state.detection.confidence = result.confidence || 0.8;
            state.detection.status = 'complete';
            
            // Calculate area if not returned directly
            let area = result.area || 0;
            if (!area && typeof calculatePolygonArea === 'function') {
                area = calculatePolygonArea(state.boundary) / (state.scalePixelsPerMeter * state.scalePixelsPerMeter);
            }
            state.roof.estimatedAreaM2 = area;
            state.roof.orientation = result.roofOrientation || 'unknown';
            
            initPerspective();
            triggerAutoPlace();
            updateDetectionUI(result);
            saveHistory();
            
            setTimeout(() => {
                hideDetectionOverlay();
            }, 500);
        })
        .catch(err => {
            console.error('AI Detection Error:', err);
            state.detection.status = 'failed';
            fallbackDefaultBoundary();
            showToast('AI detection failed. Please adjust the boundary manually.', 'warning');
            hideDetectionOverlay();
        });
}

function fallbackDefaultBoundary() {
    if(!state.image) return;
    const paddingX = state.image.width * 0.15;
    const paddingY = state.image.height * 0.15;
    state.boundary = [
        { x: paddingX, y: paddingY },
        { x: state.image.width - paddingX, y: paddingY },
        { x: state.image.width - paddingX, y: state.image.height - paddingY },
        { x: paddingX, y: state.image.height - paddingY }
    ];
    state.obstacles = [];
    initPerspective();
    triggerAutoPlace();
    saveHistory();
}

function triggerRedetect() {
    if (!state.image) return;
    if (confirm('Re-running detection will clear your current layout. Continue?')) {
        startRoofDetection(state.image);
    }
}

function updateDetectionUI(result) {
    if (!result) {
        let areaPx = getRoofArea();
        let areaM2 = areaPx / (state.scalePixelsPerMeter * state.scalePixelsPerMeter);
        result = {
            area: areaM2,
            confidence: 0.95,
            orientation: state.panels.direction
        };
    }

    $('#detectedRoofArea').text((result.area || 0).toFixed(1) + ' m²');
    
    const conf = (result.confidence || 0);
    const confBadge = $('#detectedConfidence');
    confBadge.text((conf * 100).toFixed(0) + '%');
    confBadge.removeClass('badge-success badge-warning badge-danger');
    if (conf > 0.7) confBadge.addClass('badge-success');
    else if (conf > 0.4) confBadge.addClass('badge-warning');
    else confBadge.addClass('badge-danger');

    $('#detectedOrientation').text(result.orientation || 'Unknown');
    $('#detectedVertices').text(state.boundary.length);
    
    const obsList = $('#detectedObstaclesList');
    obsList.empty();
    state.obstacles.forEach((obs, idx) => {
        obsList.append(`<li>${obs.type || 'Custom'} Obstacle (ID: ${obs.id || idx})</li>`);
    });
}

function initPerspective() {
    if (typeof PerspectiveEngine !== 'undefined') {
        const imgW = state.image ? state.image.width : (stage ? stage.width() : 800);
        const imgH = state.image ? state.image.height : (stage ? stage.height() : 600);
        state.perspective.engine = new PerspectiveEngine(state.boundary, imgW, imgH, state.scalePixelsPerMeter || 50);
        const results = state.perspective.engine.estimatePerspective();
        state.perspective.vanishingPoints = results.vanishingPoints || [];
        state.perspective.horizonLine = results.horizonLine || null;
        state.perspective.roofNormal = results.roofNormal || null;
        if (typeof SolarRenderer !== 'undefined') {
            state.renderer = new SolarRenderer(state.perspective.engine, stage);
        }
    }
}

// ── Panel Placement Engine ───────────────────────────────────────────────
function triggerAutoPlace() {
    if (typeof autoPlacePanels === 'function') {
        // Map compass direction to azimuth degrees
        let azimuthDeg = 0;
        const dir = state.panels.direction;
        if (dir === 'West') azimuthDeg = 90;
        else if (dir === 'North') azimuthDeg = 180;
        else if (dir === 'East') azimuthDeg = 270;
        // 'South' = 0

        // Unwarp the screen boundary into true physical meters, then scale to 'pixels'
        // so that panelPlacement.js (which divides by scalePixelsPerMeter) gets true meters.
        const unwarpedBoundary = state.boundary.map(p => {
            const m = state.perspective.engine.screenToWorld(p.x, p.y);
            return { x: m.x * state.scalePixelsPerMeter, y: m.y * state.scalePixelsPerMeter };
        });
        
        const unwarpedObstacles = state.obstacles.map(obs => {
             return {
                 ...obs,
                 polygon: obs.polygon.map(p => {
                     const m = state.perspective.engine.screenToWorld(p.x, p.y);
                     return { x: m.x * state.scalePixelsPerMeter, y: m.y * state.scalePixelsPerMeter };
                 })
             };
        });

        const config = {
            roofPolygon: unwarpedBoundary,
            obstacles: unwarpedObstacles,
            scalePixelsPerMeter: state.scalePixelsPerMeter,
            capacityKw: state.panels.capacityKw,
            panelWatt: state.panels.watt,
            panelLengthMm: state.panels.length,
            panelWidthMm: state.panels.width,
            orientation: state.panels.orientation,
            tiltAngle: state.panels.tilt,
            structureHeight: state.panels.height,
            legExtension: state.panels.legExtension || 0,
            rowSpacing: state.panels.autoSpacing ? 'auto' : state.panels.rowSpacing,
            walkwayMargin: state.boundaryWalkway,
            panelDirection: state.panels.direction,
            azimuthDeg: azimuthDeg,
            rollAngleDeg: state.panels.roll || 0,
            footprint: state.panels.footprint || null,
            perspectiveEngine: state.perspective.engine
        };
        const result = autoPlacePanels(config);
        state.panels.items = result.items || [];
        state.panels.rows = result.rows || 0;
        state.panels.cols = result.cols || 0;
        state.panels.footprint = result.footprint || null;
        state.panels._lastResult = result;
        state.panels._geometry = result._geometry || null;

        // Update stats metrics
        $('#statUsableArea').text((result.usableAreaM2 || 0).toFixed(1) + ' m²');
        $('#statCoverage').text((result.coveragePercent || 0).toFixed(1) + '%');

        // Show insufficient space warning
        if (result.insufficientSpace) {
            showToast(
                `Footprint cannot accommodate ${result.requiredModules} panels. Only ${result.totalModules} fit.`,
                'warning'
            );
        }
    } else {
        state.panels.items = [];
        state.panels.rows = 0;
        state.panels.cols = 0;
    }

    $('#inputCols').val(state.panels.cols);
    $('#inputRows').val(state.panels.rows);
    // Do NOT recalculate capacityKw here — it is the source of truth from the user input

    renderKonvaWorkspace();
}

function recalculatePanelsLayout() {
    triggerAutoPlace();
    updateDetectionUI();
}

/**
 * Clamps the footprint center so its bounding rectangle stays inside the usable roof boundary.
 * Uses hard clamp approach — structure stops at the boundary edge.
 */
function clampFootprintToBoundary() {
    // Intentionally removed clamping logic. 
    // The user explicitly requested to be able to drag the solar array outside the boundary to other positions.
    // The geometry engine will filter out panels that fall outside the boundary during placement, 
    // but the footprint bounding box itself should remain freely movable.
}

// ── Rendering Engine ─────────────────────────────────────────────────────
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

                vertexCircle.on('contextmenu', (e) => {
                    e.evt.preventDefault();
                    if (state.boundary.length > 3) {
                        state.boundary.splice(idx, 1);
                        saveHistory();
                        recalculatePanelsLayout();
                        renderKonvaWorkspace();
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
            let fill = 'rgba(239, 68, 68, 0.25)';
            let stroke = '#ef4444';
            if (obs.type === 'water_tank') { fill = 'rgba(59, 130, 246, 0.3)'; stroke = '#3b82f6'; }
            else if (obs.type === 'staircase') { fill = 'rgba(249, 115, 22, 0.3)'; stroke = '#f97316'; }
            else if (obs.type === 'chimney') { fill = 'rgba(239, 68, 68, 0.3)'; stroke = '#ef4444'; }
            else if (obs.type === 'vent') { fill = 'rgba(168, 85, 247, 0.3)'; stroke = '#a855f7'; }
            else if (obs.type === 'parapet') { fill = 'rgba(234, 179, 8, 0.3)'; stroke = '#eab308'; }
            
            const polyPoints = [];
            if (obs.polygon && obs.polygon.length > 0) {
                obs.polygon.forEach(pt => { polyPoints.push(pt.x, pt.y); });
            } else if (obs.bounds) {
                polyPoints.push(obs.bounds.x, obs.bounds.y, obs.bounds.x + obs.bounds.w, obs.bounds.y, obs.bounds.x + obs.bounds.w, obs.bounds.y + obs.bounds.h, obs.bounds.x, obs.bounds.y + obs.bounds.h);
            }

            const obsPoly = new Konva.Line({
                points: polyPoints,
                fill: fill,
                stroke: stroke,
                strokeWidth: 2 / stage.scaleX(),
                closed: true,
                draggable: state.tool === 'select'
            });

            obsPoly.on('dragmove', () => {
                const dx = obsPoly.x();
                const dy = obsPoly.y();
                if (obs.polygon) {
                    obs.polygon = obs.polygon.map(p => ({ x: p.x + dx, y: p.y + dy }));
                }
                if (obs.bounds) {
                    obs.bounds.x += dx;
                    obs.bounds.y += dy;
                }
                obsPoly.position({x:0, y:0});
                
                recalculatePanelsLayout();
                renderKonvaWorkspace();
            });

            obsPoly.on('dragend', () => {
                saveHistory();
            });

            obstaclesLayer.add(obsPoly);
            
            if (obs.label && state.layers.labels) {
                const text = new Konva.Text({
                    x: obs.bounds ? obs.bounds.x : (obs.polygon[0].x),
                    y: (obs.bounds ? obs.bounds.y : (obs.polygon[0].y)) - 15 / stage.scaleX(),
                    text: obs.label,
                    fontSize: 12 / stage.scaleX(),
                    fill: stroke
                });
                obstaclesLayer.add(text);
            }
        });
    }

    // 3. Clear Array and Shadows Layers children
    solarArrayGroup.destroyChildren();
    shadowsLayer.destroyChildren();
    structureLayer.destroyChildren();

    if (state.layers.panels && state.panels.items && state.panels.items.length > 0) {
        let rendererUsed = false;
        if (state.renderer) {
            try {
                const config = {
                    tiltAngle: state.panels.tilt,
                    structureHeight: state.panels.height,
                    orientation: state.panels.orientation,
                    mountType: state.mountType,
                    sunAzimuth: 220,
                    sunElevation: 45,
                    panelWatt: state.panels.watt,
                    showStructure: state.layers.structure,
                    showShadows: state.layers.structure
                };
                
                state.renderer.renderFullArray(state.panels, config, {
                    solarArrayGroup,
                    shadowsLayer,
                    structureLayer
                });
                rendererUsed = true;
            } catch (renderErr) {
                console.warn('SolarRenderer failed, using fallback:', renderErr);
                rendererUsed = false;
            }
        }
        if (!rendererUsed) {
            // Fallback rendering – panels from autoPlacePanels have centerPixel/worldW/worldH
            const activePanels = state.panels.items.filter(item =>
                !state.panels.deleted[`${item.row}_${item.col}`] && item.valid !== false
            );
            const spm = state.scalePixelsPerMeter || 50;
            activePanels.forEach(item => {
                let pts;
                if (item.corners && item.corners.length >= 4) {
                    // Pre-computed pixel corners (legacy path)
                    pts = [
                        item.corners[0].x, item.corners[0].y,
                        item.corners[1].x, item.corners[1].y,
                        item.corners[2].x, item.corners[2].y,
                        item.corners[3].x, item.corners[3].y
                    ];
                } else if (item.centerPixel) {
                    // Compute pixel rectangle from center + world dims
                    const pw = (item.worldW || 0) * spm;
                    const ph = (item.worldH || 0) * spm;
                    const cx = item.centerPixel.x;
                    const cy = item.centerPixel.y;
                    pts = [
                        cx - pw / 2, cy - ph / 2,
                        cx + pw / 2, cy - ph / 2,
                        cx + pw / 2, cy + ph / 2,
                        cx - pw / 2, cy + ph / 2
                    ];
                } else if (typeof item.worldX === 'number') {
                    // Use world coords directly (in meters) → convert to pixels
                    const px = item.worldX * spm;
                    const py = item.worldY * spm;
                    const pw = (item.worldW || 0) * spm;
                    const ph = (item.worldH || 0) * spm;
                    pts = [
                        px - pw / 2, py - ph / 2,
                        px + pw / 2, py - ph / 2,
                        px + pw / 2, py + ph / 2,
                        px - pw / 2, py + ph / 2
                    ];
                }

                if (pts) {
                    const pPoly = new Konva.Line({
                        points: pts,
                        fill: '#1e3a8a',
                        stroke: '#60a5fa',
                        strokeWidth: 1 / stage.scaleX(),
                        closed: true
                    });
                    solarArrayGroup.add(pPoly);
                }
            });
        }
    }

    // 4. Perspective layer
    perspectiveGridLayer.destroyChildren();
    if (state.layers.perspective && state.perspective.engine) {
        const vp = state.perspective.vanishingPoints || [];
        vp.forEach(v => {
            if(Math.abs(v.x) > 10000 || Math.abs(v.y) > 10000) return;
            state.boundary.forEach(b => {
                perspectiveGridLayer.add(new Konva.Line({
                    points: [v.x, v.y, b.x, b.y],
                    stroke: 'rgba(255, 255, 255, 0.4)',
                    strokeWidth: 1 / stage.scaleX(),
                    dash: [5, 5]
                }));
            });
        });
        
        if (state.perspective.horizonLine) {
            const h = state.perspective.horizonLine;
            perspectiveGridLayer.add(new Konva.Line({
                points: [h.p1.x, h.p1.y, h.p2.x, h.p2.y],
                stroke: 'rgba(0, 255, 255, 0.5)',
                strokeWidth: 2 / stage.scaleX()
            }));
        }
    }

    if (state.tool === 'select' && state.panels.items && state.panels.items.length > 0) {
        // Array is dragged freely without transformer or green handles
        transformer.nodes([]);
    } else {
        transformer.nodes([]);
    }

    updateLiveMetrics();
    stage.batchDraw();
}

function togglePerspectiveGrid() {
    state.layers.perspective = !state.layers.perspective;
    renderKonvaWorkspace();
}

// ── UI Actions & Toolbar handlers ────────────────────────────────────────
function setCanvasTool(tool) {
    state.tool = tool;
    $('.toolbar-btn').removeClass('active');
    
    if (tool === 'select') $('#toolSelect').addClass('active');
    if (tool === 'boundary') $('#toolBoundary').addClass('active');
    if (tool === 'obstacle') $('#toolObstacle').addClass('active');
    if (tool === 'calibrate') $('#toolCalibrate').addClass('active');

    stage.draggable(tool === 'select');
    
    renderKonvaWorkspace();
}

function zoomStageAtPoint(scaleFactor) {
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = oldScale * scaleFactor;
    
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

function zoomIn() { zoomStageAtPoint(1.15); }
function zoomOut() { zoomStageAtPoint(1 / 1.15); }
function triggerResetZoom() { zoomFit(); }

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
    if(layerName === 'perspective') {
        togglePerspectiveGrid();
    } else {
        state.layers[layerName] = !state.layers[layerName];
        renderKonvaWorkspace();
    }
}
// ── Parameters changed triggers ──────────────────────────────────────────
window.onPanelPresetChanged = function() {
    const select = document.getElementById('inputPanelWatt');
    const customWatt = document.getElementById('customPanelWatt');
    const lengthInput = document.getElementById('inputPanelLength');
    const widthInput = document.getElementById('inputPanelWidth');
    
    if (select.value === 'custom') {
        customWatt.style.display = 'block';
    } else {
        customWatt.style.display = 'none';
        customWatt.value = select.value;
        
        // Auto-update common dimensions based on wattage
        if (select.value === '540' || select.value === '550') {
            lengthInput.value = 2278;
            widthInput.value = 1134;
        } else if (select.value === '600') {
            lengthInput.value = 2440;
            widthInput.value = 1134;
        }
        
        if (typeof onParametersChanged === 'function') {
            onParametersChanged();
        }
    }
};
function onParametersChanged() {
    const newCapacity = parseFloat($('#inputCapacity').val()) || 5.0;
    const oldCapacity = state.panels.capacityKw;
    state.panels.capacityKw = newCapacity;

    const wattVal = $('#inputPanelWatt').val() === 'custom' ? $('#customPanelWatt').val() : $('#inputPanelWatt').val();
    state.panels.watt = parseInt(wattVal) || 550;
    state.panels.length = parseInt($('#inputPanelLength').val()) || 2278;
    state.panels.width = parseInt($('#inputPanelWidth').val()) || 1134;

    const newOrientation = $('#inputOrientation').val() || 'portrait';
    const oldOrientation = state.panels.orientation;
    state.panels.orientation = newOrientation;

    state.panels.height = parseFloat($('#inputHeight').val()) || 0.3;
    state.panels.tilt = parseInt($('#inputTilt').val()) || 15;
    state.panels.roll = parseInt($('#inputRoll').val()) || 0;
    state.panels.legExtension = parseFloat($('#inputLegExtension').val()) || 0;
    
    state.panels.rowSpacing = parseFloat($('#inputRowSpacing').val()) || 1.2;
    state.panels.autoSpacing = $('#spacingAuto').is(':checked');
    
    const newWalkway = parseFloat($('#boundaryWalkway').val()) || 0.5;
    const oldWalkway = state.boundaryWalkway;
    state.boundaryWalkway = newWalkway;
    
    const facing = $('#inputCompassFacing').val() || 'South';
    const oldFacing = state.panels.direction;
    state.panels.direction = facing;
    
    state.mountType = $('#inputMountType').val() || 'RCC-Ballast';

    let clearFootprint = false;
    if (newCapacity !== oldCapacity || newOrientation !== oldOrientation || newWalkway !== oldWalkway) {
        clearFootprint = true;
    }

    if (facing !== oldFacing) {
        let rot = 0;
        if (facing === 'West') rot = 90;
        else if (facing === 'North') rot = 180;
        else if (facing === 'East') rot = 270;
        
        state.panels.rotation = rot;
        $('#panelRotate').val(rot);
        $('#rotateVal').text(rot + '°');

        clearFootprint = true;
    }

    if (clearFootprint) {
        state.panels.footprint = null;
    }

    recalculatePanelsLayout();
    renderKonvaWorkspace();
}

// ── BOM & Metrics Calculation ────────────────────────────────────────────
function getRoofArea() {
    if (state.boundary.length < 3) return 0;
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
    const activePanels = (state.panels.items || []).filter(item => 
        !state.panels.deleted[`${item.row}_${item.col}`] && item.valid !== false
    );
    const panelCount = activePanels.length;
    const capacityKw = (panelCount * state.panels.watt) / 1000;
    const isPortrait = state.panels.orientation === 'portrait';
    const pW = (isPortrait ? state.panels.width : state.panels.length) / 1000;
    const pH = (isPortrait ? state.panels.length : state.panels.width) / 1000;
    const occupiedArea = panelCount * pW * pH;
    const roofArea = getRoofArea();
    
    let usableArea = state.roof.usableAreaM2 || roofArea;
    if (typeof getUsableRoofArea === 'function') {
        const result = getUsableRoofArea(state.boundary, state.obstacles, state.boundaryWalkway, state.scalePixelsPerMeter);
        usableArea = result ? result.areaM2 : 0;
    }
    
    const remainingArea = Math.max(0, usableArea - occupiedArea);

    $('#statCapacity').text(capacityKw.toFixed(2) + ' kW');
    $('#statPanels').text(panelCount);
    $('#statArea').text(occupiedArea.toFixed(1) + ' m²');
    $('#statRemaining').text(remainingArea.toFixed(1) + ' m²');
    
    if ($('#statUsableArea').length) $('#statUsableArea').text(usableArea.toFixed(1) + ' m²');
    if ($('#statCoverage').length) $('#statCoverage').text((usableArea > 0 ? (occupiedArea/usableArea*100) : 0).toFixed(1) + '%');

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
            deleted: state.panels.deleted,
            rows: state.panels.rows,
            cols: state.panels.cols,
            footprint: state.panels.footprint || null
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
            deleted: state.panels.deleted,
            rows: state.panels.rows,
            cols: state.panels.cols,
            footprint: state.panels.footprint || null
        },
        scalePixelsPerMeter: state.scalePixelsPerMeter,
        boundaryWalkway: state.boundaryWalkway,
        mountType: state.mountType
    });
    
    state.history.push(snapshot);
    state.redoStack = [];
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
    
    // Migrate old obstacles format to new format
    state.obstacles = (cfg.obstacles || []).map((obs, i) => {
        if (obs.w && obs.h && !obs.polygon) {
            return {
                id: obs.id || 'obs_' + i,
                type: 'custom',
                polygon: [
                    {x: obs.x, y: obs.y},
                    {x: obs.x + obs.w, y: obs.y},
                    {x: obs.x + obs.w, y: obs.y + obs.h},
                    {x: obs.x, y: obs.y + obs.h}
                ],
                bounds: {x: obs.x, y: obs.y, w: obs.w, h: obs.h},
                label: 'Custom'
            };
        }
        return obs;
    });

    state.panels = cfg.panels || {};
    state.scalePixelsPerMeter = cfg.scalePixelsPerMeter || 40;
    state.boundaryWalkway = cfg.boundaryWalkway || 0.5;
    state.mountType = cfg.mountType || 'RCC-Ballast';

    if (state.panels.scale === undefined || isNaN(state.panels.scale)) state.panels.scale = 1.0;
    if (state.panels.rotation === undefined || isNaN(state.panels.rotation)) state.panels.rotation = 0;
    if (!state.panels.offset || state.panels.offset.u === undefined) state.panels.offset = { u: 0.5, v: 0.5 };
    if (!state.panels.items) state.panels.items = [];
    // Restore footprint if saved (backward compatible — null if absent)
    if (state.panels.footprint === undefined) state.panels.footprint = null;

    $('#inputCapacity').val(state.panels.capacityKw);
    $('#inputPanelWatt').val(state.panels.watt);
    $('#inputPanelLength').val(state.panels.length);
    $('#inputPanelWidth').val(state.panels.width);
    $('#inputOrientation').val(state.panels.orientation);
    $('#inputHeight').val(state.panels.height.toFixed(1));
    $('#inputTilt').val(state.panels.tilt);
    $('#inputRoll').val(state.panels.roll || 0);
    $('#inputRowSpacing').val(state.panels.rowSpacing);
    $('#boundaryWalkway').val(state.boundaryWalkway);
    $('#inputNorthAngle').val(state.panels.direction === 'South' ? 0 : (state.panels.direction === 'West' ? 90 : (state.panels.direction === 'North' ? 180 : 270)));
    $('#inputCompassFacing').val(state.panels.direction);
    $('#inputMountType').val(state.mountType);

    $('#panelScale').val(state.panels.scale);
    $('#scaleVal').text(state.panels.scale.toFixed(1));
    $('#panelRotate').val(state.panels.rotation);
    $('#rotateVal').text(state.panels.rotation + '°');

    initPerspective();
    recalculatePanelsLayout();
    renderKonvaWorkspace();
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
        
        fallbackDefaultBoundary();

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
            compass: true,
            perspective: false
        };

        state.boundaryWalkway = 0.5;
        state.mountType = 'RCC-Ballast';
        state.obstacles = [];
        
        state.detection = {
            status: 'idle',
            confidence: 0,
            processingTimeMs: 0,
            engineReady: false
        };

        zoomFit();

        $('#inputCapacity').val(5.0);
        $('#inputPanelWatt').val(550);
        $('#inputPanelLength').val(2278);
        $('#inputPanelWidth').val(1134);
        $('#inputOrientation').val('portrait');
        $('#inputHeight').val('1.0');
        $('#inputTilt').val('15');
        $('#inputRoll').val('0');
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
            transformer.nodes([]);
            stage.batchDraw();

            const dataUrl = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'
            });

            const link = document.createElement('a');
            link.download = `solar-proposal-layout-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

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
            transformer.nodes([]);
            stage.batchDraw();

            const imageBase64 = stage.toDataURL({
                pixelRatio: 1.5,
                mimeType: 'image/jpeg',
                quality: 0.85
            });

            stage.batchDraw();

            const panelCount = activePanels.length;
            const capacityKw = (panelCount * state.panels.watt) / 1000;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            let logoUrl = window.location.origin + '/images/nrslogo.png';
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.src && s.src.includes('/js/roofDesigner.js')) {
                    logoUrl = s.src.split('?')[0].replace('/js/roofDesigner.js', '/images/nrslogo.png');
                    break;
                }
            }

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
                            <img src="${logoUrl}" style="height: 60px; width: auto;" alt="NRS Solar Solution Logo" />
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
                                <td>Solar PV Modules (${state.panels.watt}Wp)</td>
                                <td style="font-weight: bold;">${panelCount}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>End Clamps (Aluminum Alloy)</td>
                                <td style="font-weight: bold;">${Math.max(4, Math.ceil(panelCount / 10) * 4)}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>Mid Clamps (Aluminum Alloy)</td>
                                <td style="font-weight: bold;">${Math.max(0, (panelCount - 2) * 2)}</td>
                                <td>Nos</td>
                            </tr>
                            <tr>
                                <td>Galvanized Steel Leg structure sets</td>
                                <td style="font-weight: bold;">${Math.ceil(panelCount / 2)}</td>
                                <td>sets</td>
                            </tr>
                            ${state.mountType === 'RCC-Ballast' ? `
                            <tr>
                                <td>Precast Concrete Blocks</td>
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

function applyScaleCalibration() {
    if (!window.lastCalibrationPixels) return;
    const meters = parseFloat($('#calibrationDistance').val());
    if (isNaN(meters) || meters <= 0) {
        showToast('Please enter a valid positive distance in meters', 'danger');
        return;
    }
    
    // Scale = pixels / meters
    state.scalePixelsPerMeter = window.lastCalibrationPixels / meters;
    $('#calibrationValueContainer').hide();
    
    showToast(`Scale calibrated to ${state.scalePixelsPerMeter.toFixed(2)} pixels per meter.`, 'success');
    
    // Automatically recalculate everything based on the new scale
    saveHistory();
    recalculatePanelsLayout();
    renderKonvaWorkspace();
}
