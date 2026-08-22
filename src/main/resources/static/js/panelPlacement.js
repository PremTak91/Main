/**
 * panelPlacement.js
 * Intelligent Panel Placement Engine for Solar Rooftop Designer
 * 
 * This module now delegates to SolarGeometryEngine for all physical calculations.
 * It maintains backward compatibility with the existing API.
 */

// Import the new geometry engine (available globally via solarGeometry.js)
// SolarGeometryEngine is already declared in the global scope by solarGeometry.js
// WorldPoint2D is already declared in the global scope by solarGeometry.js

/**
 * Main placement function - backward compatible API
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
        panelDirection = 'South',
        structureHeight = 0.3,
        azimuthDeg = 0,
        rollAngleDeg = 0,
        footprint = null
    } = config;

    // Convert roof polygon to WorldPoint2D array
    const roofBoundary = roofPolygon ? roofPolygon.map(p => new WorldPoint2D(
        p.x / scalePixelsPerMeter,
        p.y / scalePixelsPerMeter
    )) : null;

    // Convert obstacles
    const obstaclePolygons = obstacles.map(obs => 
        obs.polygon.map(p => new WorldPoint2D(
            p.x / scalePixelsPerMeter,
            p.y / scalePixelsPerMeter
        ))
    );

    // Convert footprint if provided
    let footprintObj = null;
    if (footprint && footprint.center && footprint.width > 0 && footprint.height > 0) {
        footprintObj = {
            center: new WorldPoint2D(footprint.center.x, footprint.center.y),
            width: footprint.width,
            height: footprint.height,
            angle: footprint.angle || 0
        };
    }

    // Use the new geometry engine
    const engine = new SolarGeometryEngine();
    const geometry = engine.calculateArrayGeometry({
        capacityKw,
        panelWattage: panelWatt,
        panelLengthMm,
        panelWidthMm,
        orientation,
        tiltAngleDeg: tiltAngle,
        azimuthDeg,
        rollAngleDeg,
        structureHeightM: structureHeight,
        panelGapMm: 20,
        rowGapMm: rowSpacing === 'auto' ? null : parseFloat(rowSpacing) * 1000,
        roofBoundary,
        footprint: footprintObj,
        maxPanels: null,
        legExtension: config.legExtension || 0
    });

    // Convert back to legacy format for backward compatibility
    const items = geometry.panels.map((panel, index) => ({
        row: panel.row,
        col: panel.col,
        worldX: panel.corners[0].x,
        worldY: panel.corners[0].y,
        worldW: panel.width,
        worldH: panel.length,
        corners: panel.corners.map(c => ({ x: c.x, y: c.y, z: c.z })),
        centerPixel: {
            x: panel.center.x * scalePixelsPerMeter,
            y: panel.center.y * scalePixelsPerMeter
        },
        valid: panel.valid
    }));

    // Convert footprint back to legacy format
    const legacyFootprint = geometry.footprint.length > 0 ? {
        center: { x: geometry.center.x, y: geometry.center.y },
        width: geometry.totalWidth,
        height: geometry.totalDepth,
        angle: geometry.orientation
    } : { 
        center: config.footprint ? { x: config.footprint.center.x, y: config.footprint.center.y } : { x: 0, y: 0 }, 
        width: config.footprint ? config.footprint.width : 0, 
        height: config.footprint ? config.footprint.height : 0, 
        angle: config.footprint ? config.footprint.angle : 0 
    };

    // Convert roof footprint polygon
    const legacyRoofFootprintPolygon = geometry.footprint.map(p => ({
        x: p.x * scalePixelsPerMeter,
        y: p.y * scalePixelsPerMeter
    }));

    return {
        items,
        rows: Math.max(...geometry.panels.map(p => p.row), 0) + 1,
        cols: Math.max(...geometry.panels.map(p => p.col), 0) + 1,
        totalModules: geometry.panelCount,
        requiredModules: Math.ceil((capacityKw * 1000) / panelWatt),
        actualCapacityKw: geometry.capacityKw,
        usableAreaM2: roofBoundary ? calculatePolygonArea(roofBoundary) : 0,
        panelAreaM2: geometry.panels.reduce((sum, p) => sum + (p.width * p.length), 0),
        coveragePercent: 0, // Will be calculated by caller if needed
        rowSpacingM: geometry.panels.length > 0 ? 
            (geometry.panels[0].corners[3].y - geometry.panels[0].corners[0].y) : 0,
        footprint: legacyFootprint,
        roofFootprintPolygon: legacyRoofFootprintPolygon,
        insufficientSpace: geometry.insufficientSpace,
        solarPlane: {
            tiltAngle: geometry.tilt * 180 / Math.PI,
            azimuthDeg: geometry.orientation * 180 / Math.PI,
            lowSideHeight: geometry.panels.length > 0 ? geometry.panels[0].corners[0].z : structureHeight,
            highSideHeight: geometry.panels.length > 0 ? geometry.panels[0].corners[2].z : structureHeight,
            panelYProjected: geometry.panels.length > 0 ? 
                geometry.panels[0].corners[3].distanceTo(geometry.panels[0].corners[0]) : 0,
            panelZRise: geometry.panels.length > 0 ? 
                geometry.panels[0].corners[2].z - geometry.panels[0].corners[0].z : 0
        },
        // New: expose full geometry for advanced features
        _geometry: geometry,
        _engine: engine
    };
}

function createEmptyResult() {
    return {
        items: [],
        rows: 0,
        cols: 0,
        totalModules: 0,
        requiredModules: 0,
        actualCapacityKw: 0,
        usableAreaM2: 0,
        panelAreaM2: 0,
        coveragePercent: 0,
        rowSpacingM: 0,
        footprint: { center: { x: 0, y: 0 }, width: 0, height: 0, angle: 0 },
        roofFootprintPolygon: [],
        insufficientSpace: false,
        solarPlane: { tiltAngle: 0, azimuthDeg: 0, lowSideHeight: 0, highSideHeight: 0, panelYProjected: 0, panelZRise: 0 }
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

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        autoPlacePanels,
        getUsableRoofArea,
        isPointInPolygon,
        getOrientedBoundingRect,
        bufferPolygon,
        subtractPolygons,
        snapToGrid,
        calculateAutoRowSpacing,
        calculatePolygonArea
    };
}