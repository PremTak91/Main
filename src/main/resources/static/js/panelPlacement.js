/**
 * panelPlacement.js
 * Intelligent Panel Placement Engine for Solar Rooftop Designer
 * Automatically calculates optimal solar panel layouts inside a detected roof polygon.
 */

/**
 * Main placement function
 * @param {Object} config Placement configuration
 * @returns {Object} Placement results including array of panel items
 */
function autoPlacePanels(config) {
    const {
        roofPolygon,
        obstacles = [],
        scalePixelsPerMeter = 50,
        capacityKw = 5.0,
        panelWatt = 550,
        panelLengthMm = 2278,
        panelWidthMm = 1134,
        orientation = 'portrait',
        tiltAngle = 15,
        rowSpacing = 'auto',
        walkwayMargin = 0.5,
        panelDirection = 'South'
    } = config;

    // Step 1: Calculate Panel Count
    const totalModulesNeeded = Math.ceil((capacityKw * 1000) / panelWatt);
    const panelLM = panelLengthMm / 1000;
    const panelWM = panelWidthMm / 1000;
    
    let panelW, panelH;
    if (orientation === 'landscape') {
        panelW = panelLM;
        panelH = panelWM;
    } else {
        panelW = panelWM;
        panelH = panelLM;
    }
    
    const panelGapW = 0.02; // 20mm gap between adjacent panels

    // Step 2: Calculate Row Spacing
    let actualRowSpacing;
    if (rowSpacing === 'auto') {
        actualRowSpacing = calculateAutoRowSpacing(panelH, tiltAngle, 20);
    } else {
        actualRowSpacing = parseFloat(rowSpacing);
        const minSpacing = panelH * Math.cos(tiltAngle * Math.PI / 180);
        if (actualRowSpacing < minSpacing) {
            actualRowSpacing = minSpacing;
        }
    }

    // Step 3: Get Usable Roof Area (in meters)
    // Convert roof to meters
    const roofMeters = roofPolygon.map(p => ({
        x: p.x / scalePixelsPerMeter,
        y: p.y / scalePixelsPerMeter
    }));

    // Buffer inward for walkway
    const usableRoofMeters = bufferPolygon(roofMeters, -walkwayMargin, 1);
    
    // Prepare obstacles in meters and buffer them
    const obsPolygonsMeters = obstacles.map(obs => {
        const obsM = obs.polygon.map(p => ({
            x: p.x / scalePixelsPerMeter,
            y: p.y / scalePixelsPerMeter
        }));
        // 0.3m clearance around obstacles
        return bufferPolygon(obsM, 0.3, 1);
    });

    // We don't necessarily need to perform complex boolean operations here, 
    // we can use point-in-polygon and obstacle overlap checks during grid placement.
    // But we will use subtractPolygons logic for area calculation.
    const usableAreaPolys = subtractPolygons([usableRoofMeters], obsPolygonsMeters);
    let maxPoly = usableAreaPolys[0];
    let maxArea = 0;
    for (const poly of usableAreaPolys) {
        const area = calculatePolygonArea(poly);
        if (area > maxArea) {
            maxArea = area;
            maxPoly = poly;
        }
    }
    
    if (!maxPoly || maxPoly.length < 3) {
        return createEmptyResult();
    }

    // Step 4 & 5: Determine Grid Orientation & Dimensions
    const obr = getOrientedBoundingRect(maxPoly);
    const gridWidth = obr.width;
    const gridHeight = obr.height;
    
    // Determine how many columns and rows we can fit in the bounding box
    const maxCols = Math.floor(gridWidth / (panelW + panelGapW));
    let rows = Math.ceil(totalModulesNeeded / maxCols);
    
    // Ensure it fits vertically
    const maxRows = Math.floor(gridHeight / (panelH + actualRowSpacing));
    if (rows > maxRows) {
        rows = maxRows;
    }
    const cols = Math.ceil(totalModulesNeeded / rows);

    // Grid angle
    const angleRad = obr.angle;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    // Step 6: Place Panels
    let placedPanels = [];
    let modulesPlaced = 0;
    
    // Start from top-left of the oriented bounding box
    // Centering the grid inside the bounding box
    const totalGridW = cols * (panelW + panelGapW) - panelGapW;
    const totalGridH = rows * (panelH + actualRowSpacing) - actualRowSpacing;
    
    const startOffsetX = -obr.width / 2 + (obr.width - totalGridW) / 2 + panelW / 2;
    const startOffsetY = -obr.height / 2 + (obr.height - totalGridH) / 2 + panelH / 2;

    for (let r = 0; r < rows; r++) {
        let rowPanels = [];
        for (let c = 0; c < cols; c++) {
            if (modulesPlaced >= totalModulesNeeded) break;

            // Local coordinates relative to OBR center, aligned with OBR axes
            const localX = startOffsetX + c * (panelW + panelGapW);
            const localY = startOffsetY + r * (panelH + actualRowSpacing);

            // Rotate back to world coordinates
            const worldX = obr.center.x + localX * cosA - localY * sinA;
            const worldY = obr.center.y + localX * sinA + localY * cosA;

            const centerPoint = { x: worldX, y: worldY };

            // Validity checks
            let valid = isPointInPolygon(centerPoint, maxPoly);
            
            if (valid) {
                // Check obstacle collisions
                for (const obs of obsPolygonsMeters) {
                    if (isPointInPolygon(centerPoint, obs)) {
                        valid = false;
                        break;
                    }
                }
            }

            const item = {
                row: r,
                col: c,
                worldX,
                worldY,
                worldW: panelW,
                worldH: panelH,
                centerPixel: {
                    x: worldX * scalePixelsPerMeter,
                    y: worldY * scalePixelsPerMeter
                },
                valid
            };
            
            rowPanels.push(item);
            if (valid) modulesPlaced++;
        }
        placedPanels.push(rowPanels);
    }

    // Flatten panels
    const items = placedPanels.flat();
    
    const usableAreaM2 = calculatePolygonArea(maxPoly);
    const panelAreaM2 = (panelW * panelH) * modulesPlaced;
    const actualCapacityKw = (modulesPlaced * panelWatt) / 1000;

    return {
        items,
        rows,
        cols,
        totalModules: modulesPlaced,
        actualCapacityKw,
        usableAreaM2,
        panelAreaM2,
        coveragePercent: usableAreaM2 > 0 ? (panelAreaM2 / usableAreaM2) * 100 : 0,
        rowSpacingM: actualRowSpacing
    };
}

function createEmptyResult() {
    return {
        items: [],
        rows: 0,
        cols: 0,
        totalModules: 0,
        actualCapacityKw: 0,
        usableAreaM2: 0,
        panelAreaM2: 0,
        coveragePercent: 0,
        rowSpacingM: 0
    };
}

/**
 * Gets usable roof area
 */
function getUsableRoofArea(roofPolygon, obstacles, walkwayMargin, scalePixelsPerMeter) {
    const roofMeters = roofPolygon.map(p => ({
        x: p.x / scalePixelsPerMeter,
        y: p.y / scalePixelsPerMeter
    }));
    const usable = bufferPolygon(roofMeters, -walkwayMargin, 1);
    const obsPolygons = obstacles.map(obs => obs.polygon.map(p => ({
        x: p.x / scalePixelsPerMeter,
        y: p.y / scalePixelsPerMeter
    })));
    const remaining = subtractPolygons([usable], obsPolygons);
    let maxArea = 0;
    let maxPoly = null;
    for (const p of remaining) {
        const area = calculatePolygonArea(p);
        if (area > maxArea) {
            maxArea = area;
            maxPoly = p;
        }
    }
    if (!maxPoly) return { polygon: [], areaM2: 0 };
    return {
        polygon: maxPoly.map(p => ({ x: p.x * scalePixelsPerMeter, y: p.y * scalePixelsPerMeter })),
        areaM2: maxArea
    };
}

/**
 * Ray casting algorithm for point-in-polygon test
 */
function isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

/**
 * Finds the minimum area bounding rectangle of a polygon
 */
function getOrientedBoundingRect(polygon) {
    if (!polygon || polygon.length === 0) {
        return { center: {x:0, y:0}, width: 0, height: 0, angle: 0 };
    }
    // Simplistic OBR: Just use longest edge as primary axis
    let longestEdgeLenSq = 0;
    let longestEdgeAngle = 0;
    
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx*dx + dy*dy;
        if (lenSq > longestEdgeLenSq) {
            longestEdgeLenSq = lenSq;
            longestEdgeAngle = Math.atan2(dy, dx);
        }
    }
    
    const cosA = Math.cos(-longestEdgeAngle);
    const sinA = Math.sin(-longestEdgeAngle);
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const p of polygon) {
        const rx = p.x * cosA - p.y * sinA;
        const ry = p.x * sinA + p.y * cosA;
        if (rx < minX) minX = rx;
        if (rx > maxX) maxX = rx;
        if (ry < minY) minY = ry;
        if (ry > maxY) maxY = ry;
    }
    
    const w = maxX - minX;
    const h = maxY - minY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    
    const worldCx = cx * Math.cos(longestEdgeAngle) - cy * Math.sin(longestEdgeAngle);
    const worldCy = cx * Math.sin(longestEdgeAngle) + cy * Math.cos(longestEdgeAngle);
    
    return {
        center: { x: worldCx, y: worldCy },
        width: w,
        height: h,
        angle: longestEdgeAngle
    };
}

/**
 * Shrinks or expands a polygon using edge offset
 */
function bufferPolygon(polygon, distance, scalePixelsPerMeter) {
    if (!polygon || polygon.length < 3) return [];
    if (distance === 0) return [...polygon];
    
    if (typeof window !== 'undefined' && window.turf) {
        try {
            const coords = polygon.map(p => [p.x, p.y]);
            coords.push([...coords[0]]);
            const poly = window.turf.polygon([coords]);
            const buffered = window.turf.buffer(poly, distance, {units: 'meters'});
            if (buffered && buffered.geometry && buffered.geometry.coordinates) {
                const newCoords = buffered.geometry.type === 'MultiPolygon' 
                    ? buffered.geometry.coordinates[0][0]
                    : buffered.geometry.coordinates[0];
                return newCoords.slice(0, -1).map(c => ({x: c[0], y: c[1]}));
            }
        } catch(e) {
            console.warn("Turf buffer failed, using fallback");
        }
    }

    // Manual fallback for small buffer / scale
    const distMeters = distance * scalePixelsPerMeter;
    
    // Simplistic center-scaling for fallback (assumes convex/star-shaped)
    let cx = 0, cy = 0;
    polygon.forEach(p => { cx += p.x; cy += p.y; });
    cx /= polygon.length;
    cy /= polygon.length;
    
    const area = calculatePolygonArea(polygon);
    const radius = Math.sqrt(area / Math.PI);
    const scale = (radius + distMeters) / radius;
    if (scale <= 0) return [];
    
    return polygon.map(p => ({
        x: cx + (p.x - cx) * scale,
        y: cy + (p.y - cy) * scale
    }));
}

/**
 * Subtracts clip polygons from subject polygon
 */
function subtractPolygons(subjects, clips) {
    if (typeof window !== 'undefined' && window.polygonClipping) {
        try {
            const subGeom = subjects.map(s => [s.map(p => [p.x, p.y])]);
            const clipGeom = clips.map(c => [c.map(p => [p.x, p.y])]);
            const result = window.polygonClipping.difference(subGeom, ...clipGeom);
            return result.map(poly => poly[0].map(c => ({x: c[0], y: c[1]})));
        } catch(e) {
            console.warn("Polygon clipping failed, using fallback");
        }
    }
    // Fallback: Just return subjects. Overlaps will be checked via point-in-polygon
    return subjects;
}

/**
 * Rounds a value to the nearest grid position
 */
function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Calculates optimal row spacing
 */
function calculateAutoRowSpacing(panelHeightM, tiltDeg, latitude = 20) {
    const tiltRad = tiltDeg * Math.PI / 180;
    // Winter solstice sun elevation (approx)
    const sunElevationDeg = 90 - latitude - 23.5;
    const sunElevationRad = sunElevationDeg * Math.PI / 180;
    
    const spacing = (panelHeightM * Math.sin(tiltRad) / Math.tan(sunElevationRad)) 
                  + (panelHeightM * Math.cos(tiltRad));
    return spacing > 0 ? spacing : panelHeightM;
}

/**
 * Helper to calculate area of polygon
 */
function calculatePolygonArea(polygon) {
    if (!polygon || polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
    }
    return Math.abs(area / 2.0);
}
