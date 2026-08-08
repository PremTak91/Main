/**
 * solarGeometry.js
 * Core Geometry Engine for Solar Rooftop Designer
 * 
 * This module is the SINGLE SOURCE OF TRUTH for all physical geometry calculations.
 * It handles:
 * - Panel dimensions and orientation
 * - Array layout (rows, columns, spacing)
 * - Tilt and azimuth transformations
 * - Support structure heights
 * - Footprint calculation
 * - Boundary validation
 * - Coordinate system conversions
 * 
 * All calculations are done in METERS (world coordinates).
 * Pixel conversions happen ONLY in the rendering layer.
 */

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

const SOLAR_CONSTANTS = {
    // Panel spacing (meters)
    PANEL_GAP_MM: 20,           // Gap between adjacent panels in a row
    ROW_GAP_MM: 0,              // Additional gap between rows (calculated dynamically)
    EDGE_MARGIN_MM: 100,        // Margin from array edge to roof boundary
    RAIL_OFFSET_MM: 50,         // Rail extension beyond panel edge
    
    // Support structure
    BASE_PLATE_SIZE_M: 0.15,    // 150mm base plate
    LEG_DIAMETER_M: 0.05,       // 50mm leg diameter
    RAIL_WIDTH_M: 0.05,         // 50mm rail width
    
    // Visual
    MIN_PANELS: 1,
    MAX_PANELS: 1000,
    
    // Validation
    MIN_TILT_DEG: 0,
    MAX_TILT_DEG: 60,
    MIN_STRUCTURE_HEIGHT_M: 0.1,
    MAX_STRUCTURE_HEIGHT_M: 3.0
};

// ==========================================
// CORE GEOMETRY CLASSES
// ==========================================

/**
 * Represents a 3D point in world coordinates (meters)
 */
class WorldPoint3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - (other.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    clone() {
        return new WorldPoint3D(this.x, this.y, this.z);
    }
    
    add(other) {
        return new WorldPoint3D(this.x + other.x, this.y + other.z);
    }
    
    subtract(other) {
        return new WorldPoint3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    multiply(scalar) {
        return new WorldPoint3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    
    rotateZ(angleRad, center = new WorldPoint3D(0, 0, 0)) {
        const dx = this.x - center.x;
        const dy = this.y - center.y;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        return new WorldPoint3D(
            center.x + dx * cosA - dy * sinA,
            center.y + dx * sinA + dy * cosA,
            this.z
        );
    }
    
    toArray() {
        return [this.x, this.y, this.z];
    }
}

/**
 * Represents a 2D point in world coordinates (meters)
 */
class WorldPoint2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    clone() {
        return new WorldPoint2D(this.x, this.y);
    }
    
    add(other) {
        return new WorldPoint2D(this.x + other.x, this.y + other.y);
    }
    
    subtract(other) {
        return new WorldPoint2D(this.x - other.x, this.y - other.y);
    }
    
    multiply(scalar) {
        return new WorldPoint2D(this.x * scalar, this.y * scalar);
    }
    
    rotate(angleRad, center = new WorldPoint2D(0, 0)) {
        const dx = this.x - center.x;
        const dy = this.y - center.y;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        return new WorldPoint2D(
            center.x + dx * cosA - dy * sinA,
            center.y + dx * sinA + dy * cosA
        );
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Represents a solar panel with full 3D geometry
 */
class SolarPanel {
    constructor(config = {}) {
        this.id = config.id || `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.row = config.row || 0;
        this.col = config.col || 0;
        
        // Physical dimensions (meters)
        this.length = config.length || 2.278;  // 2278mm
        this.width = config.width || 1.134;    // 1134mm
        this.wattage = config.wattage || 550;
        
        // Position in array local coordinates (before tilt/azimuth)
        this.localX = config.localX || 0;
        this.localY = config.localY || 0;
        
        // 3D corners in WORLD coordinates (after all transformations)
        this.corners = config.corners || [];  // Array of 4 WorldPoint3D [FL, FR, RR, RL]
        
        // Center point in world coordinates (for boundary validation)
        this.center = config.center || new WorldPoint2D(0, 0);
        
        // Validation
        this.valid = config.valid !== false;
        this.deleted = config.deleted || false;
    }
    
    getWorldWidth() {
        if (this.corners.length < 2) return this.width;
        return this.corners[0].distanceTo(this.corners[1]);
    }
    
    getWorldDepth() {
        if (this.corners.length < 4) return this.length;
        return this.corners[0].distanceTo(this.corners[3]);
    }
    
    getProjectedArea() {
        // Area projected onto roof plane (Z=0)
        if (this.corners.length < 4) return this.length * this.width;
        const w = this.corners[0].distanceTo(this.corners[1]);
        const d = this.corners[0].distanceTo(this.corners[3]);
        return w * d;
    }
}

/**
 * Represents a support post
 */
class SupportPost {
    constructor(config = {}) {
        this.position = config.position || new WorldPoint2D(0, 0);  // Base position on roof
        this.baseHeight = config.baseHeight || 0.3;                 // Height at roof level
        this.topHeight = config.topHeight || 0.3;                   // Height at panel level
        this.type = config.type || 'standard';                      // 'front', 'rear', 'corner'
        this.basePlateSize = config.basePlateSize || SOLAR_CONSTANTS.BASE_PLATE_SIZE_M;
    }
    
    getHeightDifference() {
        return this.topHeight - this.baseHeight;
    }
}

/**
 * Represents a mounting rail
 */
class MountingRail {
    constructor(config = {}) {
        this.start = config.start || new WorldPoint3D(0, 0, 0);
        this.end = config.end || new WorldPoint3D(0, 0, 0);
        this.type = config.type || 'main';  // 'main', 'cross', 'purlin'
    }
    
    getLength() {
        return this.start.distanceTo(this.end);
    }
    
    getMidPoint() {
        return new WorldPoint3D(
            (this.start.x + this.end.x) / 2,
            (this.start.y + this.end.y) / 2,
            (this.start.z + this.end.z) / 2
        );
    }
}

/**
 * Complete solar array geometry result
 */
class SolarArrayGeometry {
    constructor() {
        this.panels = [];              // SolarPanel[]
        this.supports = [];            // SupportPost[]
        this.rails = [];               // MountingRail[]
        this.footprint = [];           // WorldPoint2D[] - 4 corners of array footprint on roof
        this.boundingBox = null;       // { minX, maxX, minY, maxY } in world meters
        this.center = new WorldPoint2D(0, 0);
        this.orientation = 0;          // Radians
        this.tilt = 0;                 // Radians
        this.totalWidth = 0;           // Meters
        this.totalDepth = 0;           // Meters
        this.totalHeight = 0;          // Meters (max Z)
        this.panelCount = 0;
        this.capacityKw = 0;
        this.insufficientSpace = false;
        this.validationErrors = [];
    }
}

// ==========================================
// GEOMETRY CALCULATION ENGINE
// ==========================================

class SolarGeometryEngine {
    constructor() {
        this.constants = SOLAR_CONSTANTS;
    }
    
    /**
     * MAIN ENTRY POINT: Calculate complete solar array geometry
     * @param {Object} config - Configuration object
     * @returns {SolarArrayGeometry} Complete geometry result
     */
    calculateArrayGeometry(config) {
        const result = new SolarArrayGeometry();
        
        // Extract and validate config
        const validatedConfig = this._validateConfig(config);
        if (validatedConfig.errors.length > 0) {
            result.validationErrors = validatedConfig.errors;
            return result;
        }
        
        const {
            capacityKw,
            panelWattage,
            panelLengthMm,
            panelWidthMm,
            orientation,        // 'portrait' | 'landscape'
            tiltAngleDeg,
            azimuthDeg,
            structureHeightM,
            panelGapMm,
            rowGapMm,
            roofBoundary,       // WorldPoint2D[] - usable roof polygon
            footprint,          // Optional: { center, width, height, angle } for drag/resize persistence
            maxPanels
        } = validatedConfig;
        
        // Step 1: Calculate required panel count from capacity
        const totalModulesNeeded = Math.ceil((capacityKw * 1000) / panelWattage);
        const panelCount = maxPanels ? Math.min(totalModulesNeeded, maxPanels) : totalModulesNeeded;
        
        // Step 2: Panel dimensions in meters
        const panelL = panelLengthMm / 1000;
        const panelW = panelWidthMm / 1000;
        
        let panelWidth, panelDepth;
        if (orientation === 'landscape') {
            panelWidth = panelL;
            panelDepth = panelW;
        } else {
            panelWidth = panelW;
            panelDepth = panelL;
        }
        
        // Step 3: Tilt geometry
        const tiltRad = tiltAngleDeg * Math.PI / 180;
        const panelYProjected = panelDepth * Math.cos(tiltRad);  // Depth on roof plane
        const panelZRise = panelDepth * Math.sin(tiltRad);       // Height gain rear vs front
        
        // Step 4: Spacing
        const gapW = (panelGapMm || this.constants.PANEL_GAP_MM) / 1000;
        const gapH = (rowGapMm || this._calculateAutoRowSpacing(panelDepth, tiltAngleDeg)) / 1000;
        
        // Step 5: Determine footprint (array bounding box on roof)
        let arrayFootprint;
        if (footprint && footprint.width > 0 && footprint.height > 0) {
            arrayFootprint = footprint;
        } else if (roofBoundary && roofBoundary.length >= 3) {
            arrayFootprint = this._calculateOptimalFootprint(roofBoundary, panelCount, panelWidth, panelYProjected, gapW, gapH, azimuthDeg);
        } else {
            // Fallback: create a default footprint
            arrayFootprint = this._createDefaultFootprint(panelCount, panelWidth, panelYProjected, gapW, gapH);
        }
        
        // Step 6: Calculate grid dimensions
        const gridWidth = arrayFootprint.width;
        const gridHeight = arrayFootprint.height;
        const arrayAngle = arrayFootprint.angle + (azimuthDeg * Math.PI / 180);
        
        const maxCols = Math.max(1, Math.floor(gridWidth / (panelWidth + gapW)));
        const maxRows = Math.max(1, Math.floor(gridHeight / (panelYProjected + gapH)));
        
        // Panel count driven by capacity
        let rows = Math.ceil(panelCount / maxCols);
        if (rows > maxRows) rows = maxRows;
        if (rows < 1) rows = 1;
        let cols = Math.ceil(panelCount / rows);
        if (cols > maxCols) cols = maxCols;
        
        const actualPanelCount = rows * cols;
        result.insufficientSpace = actualPanelCount < panelCount;
        result.panelCount = actualPanelCount;
        result.capacityKw = (actualPanelCount * panelWattage) / 1000;
        result.tilt = tiltRad;
        result.orientation = arrayAngle;
        
        // Step 7: Place panels with full 3D geometry
        const cosA = Math.cos(arrayAngle);
        const sinA = Math.sin(arrayAngle);
        const baseH = structureHeightM;
        
        const totalGridW = cols * (panelWidth + gapW) - gapW;
        const totalGridH = rows * (panelYProjected + gapH) - gapH;
        
        // Center the grid within the footprint
        const startOffsetX = (gridWidth - totalGridW) / 2 - gridWidth / 2;
        const startOffsetY = (gridHeight - totalGridH) / 2 - gridHeight / 2;
        
        let modulesPlaced = 0;
        const allCorners = [];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (modulesPlaced >= panelCount) break;
                
                // Local panel origin (top-left in local grid space)
                const localX = startOffsetX + c * (panelWidth + gapW);
                const localY = startOffsetY + r * (panelYProjected + gapH);
                
                // 3D corners in LOCAL space (before azimuth rotation)
                // FL = Front-Left, FR = Front-Right, RR = Rear-Right, RL = Rear-Left
                const localCorners = [
                    new WorldPoint3D(localX, localY, baseH),                                    // FL
                    new WorldPoint3D(localX + panelWidth, localY, baseH),                        // FR
                    new WorldPoint3D(localX + panelWidth, localY + panelYProjected, baseH + panelZRise), // RR
                    new WorldPoint3D(localX, localY + panelYProjected, baseH + panelZRise)       // RL
                ];
                
                // Rotate by combined angle and translate to world
                const worldCorners = localCorners.map(pt => {
                    const rotated = pt.rotateZ(arrayAngle);
                    return new WorldPoint3D(
                        arrayFootprint.center.x + rotated.x,
                        arrayFootprint.center.y + rotated.y,
                        rotated.z
                    );
                });
                
                // Center point for boundary validation
                const pCx = localX + panelWidth / 2;
                const pCy = localY + panelYProjected / 2;
                const worldCenter = new WorldPoint2D(
                    arrayFootprint.center.x + pCx * cosA - pCy * sinA,
                    arrayFootprint.center.y + pCx * sinA + pCy * cosA
                );
                
                // Validate against roof boundary
                let valid = true;
                if (roofBoundary && roofBoundary.length >= 3) {
                    valid = this._pointInPolygon(worldCenter, roofBoundary);
                }
                
                const panel = new SolarPanel({
                    id: `panel_${r}_${c}`,
                    row: r,
                    col: c,
                    length: panelDepth,
                    width: panelWidth,
                    wattage: panelWattage,
                    localX,
                    localY,
                    corners: worldCorners,
                    center: worldCenter,
                    valid
                });
                
                result.panels.push(panel);
                allCorners.push(...worldCorners.map(c => new WorldPoint2D(c.x, c.y)));
                
                if (valid) modulesPlaced++;
            }
        }
        
        // Step 8: Calculate support structure
        result.supports = this._calculateSupports(result.panels, baseH, panelYProjected, panelZRise, arrayAngle, arrayFootprint.center);
        
        // Step 9: Calculate rails
        result.rails = this._calculateRails(result.panels, baseH, panelYProjected, panelZRise, arrayAngle, arrayFootprint.center, panelWidth, gapW);
        
        // Step 10: Calculate footprint polygon (2D projection on roof)
        result.footprint = this._calculateFootprintPolygon(result.panels);
        
        // Step 11: Calculate bounding box
        result.boundingBox = this._calculateBoundingBox(allCorners);
        result.center = arrayFootprint.center;
        result.totalWidth = gridWidth;
        result.totalDepth = gridHeight;
        result.totalHeight = baseH + panelZRise;
        
        return result;
    }
    
    /**
     * Validate and normalize configuration
     */
    _validateConfig(config) {
        const errors = [];
        const defaults = {
            capacityKw: 5.0,
            panelWattage: 550,
            panelLengthMm: 2278,
            panelWidthMm: 1134,
            orientation: 'portrait',
            tiltAngleDeg: 15,
            azimuthDeg: 0,
            structureHeightM: 0.3,
            panelGapMm: 20,
            rowGapMm: null,  // auto
            roofBoundary: null,
            footprint: null,
            maxPanels: null
        };
        
        const validated = { ...defaults, ...config };
        
        // Validate ranges
        if (validated.capacityKw <= 0) errors.push('Capacity must be positive');
        if (validated.panelWattage <= 0) errors.push('Panel wattage must be positive');
        if (validated.panelLengthMm <= 0 || validated.panelWidthMm <= 0) errors.push('Panel dimensions must be positive');
        if (validated.tiltAngleDeg < this.constants.MIN_TILT_DEG || validated.tiltAngleDeg > this.constants.MAX_TILT_DEG) {
            errors.push(`Tilt angle must be between ${this.constants.MIN_TILT_DEG}° and ${this.constants.MAX_TILT_DEG}°`);
        }
        if (validated.structureHeightM < this.constants.MIN_STRUCTURE_HEIGHT_M || validated.structureHeightM > this.constants.MAX_STRUCTURE_HEIGHT_M) {
            errors.push(`Structure height must be between ${this.constants.MIN_STRUCTURE_HEIGHT_M}m and ${this.constants.MAX_STRUCTURE_HEIGHT_M}m`);
        }
        if (!['portrait', 'landscape'].includes(validated.orientation)) {
            errors.push('Orientation must be "portrait" or "landscape"');
        }
        
        return { ...validated, errors };
    }
    
    /**
     * Calculate automatic row spacing based on tilt and latitude
     */
    _calculateAutoRowSpacing(panelHeightM, tiltDeg, latitude = 20) {
        const tiltRad = tiltDeg * Math.PI / 180;
        const sunElevationDeg = 90 - latitude - 23.5;  // Winter solstice
        const sunElevationRad = Math.max(0.01, sunElevationDeg * Math.PI / 180);
        
        const spacing = (panelHeightM * Math.sin(tiltRad) / Math.tan(sunElevationRad)) 
                      + (panelHeightM * Math.cos(tiltRad));
        return Math.max(spacing, panelHeightM) * 1000;  // Return in mm
    }
    
    /**
     * Calculate optimal footprint from roof boundary
     */
    _calculateOptimalFootprint(roofBoundary, panelCount, panelWidth, panelDepth, gapW, gapH, azimuthDeg) {
        // Get oriented bounding rectangle of roof boundary
        const obr = this._getOrientedBoundingRect(roofBoundary);
        
        // Apply walkway margin
        const margin = this.constants.EDGE_MARGIN_MM / 1000;
        const usableWidth = Math.max(0, obr.width - 2 * margin);
        const usableHeight = Math.max(0, obr.height - 2 * margin);
        
        // Calculate required grid size
        const maxCols = Math.max(1, Math.floor(usableWidth / (panelWidth + gapW)));
        const maxRows = Math.max(1, Math.floor(usableHeight / (panelDepth + gapH)));
        
        let rows = Math.ceil(panelCount / maxCols);
        if (rows > maxRows) rows = maxRows;
        if (rows < 1) rows = 1;
        let cols = Math.ceil(panelCount / rows);
        if (cols > maxCols) cols = maxCols;
        
        const totalGridW = cols * (panelWidth + gapW) - gapW;
        const totalGridH = rows * (panelDepth + gapH) - gapH;
        
        return {
            center: obr.center,
            width: Math.min(usableWidth, totalGridW + 2 * margin),
            height: Math.min(usableHeight, totalGridH + 2 * margin),
            angle: obr.angle
        };
    }
    
    /**
     * Create default footprint when no roof boundary
     */
    _createDefaultFootprint(panelCount, panelWidth, panelDepth, gapW, gapH) {
        const maxCols = Math.ceil(Math.sqrt(panelCount));
        const maxRows = Math.ceil(panelCount / maxCols);
        
        const totalGridW = maxCols * (panelWidth + gapW) - gapW;
        const totalGridH = maxRows * (panelDepth + gapH) - gapH;
        
        return {
            center: new WorldPoint2D(0, 0),
            width: totalGridW,
            height: totalGridH,
            angle: 0
        };
    }
    
    /**
     * Get oriented bounding rectangle of polygon
     */
    _getOrientedBoundingRect(polygon) {
        if (!polygon || polygon.length < 3) {
            return { center: new WorldPoint2D(0, 0), width: 0, height: 0, angle: 0 };
        }
        
        // Find longest edge as primary axis
        let longestEdgeLenSq = 0;
        let longestEdgeAngle = 0;
        
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx * dx + dy * dy;
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
            minX = Math.min(minX, rx);
            maxX = Math.max(maxX, rx);
            minY = Math.min(minY, ry);
            maxY = Math.max(maxY, ry);
        }
        
        const w = maxX - minX;
        const h = maxY - minY;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        
        const worldCx = cx * Math.cos(longestEdgeAngle) - cy * Math.sin(longestEdgeAngle);
        const worldCy = cx * Math.sin(longestEdgeAngle) + cy * Math.cos(longestEdgeAngle);
        
        return {
            center: new WorldPoint2D(worldCx, worldCy),
            width: w,
            height: h,
            angle: longestEdgeAngle
        };
    }
    
    /**
     * Calculate support posts for the array
     */
    _calculateSupports(panels, baseH, panelYProjected, panelZRise, arrayAngle, arrayCenter) {
        const supports = [];
        const postPositions = new Map();  // Key: "x_y" -> SupportPost
        
        // Collect unique post positions from panel corners
        panels.forEach(panel => {
            if (panel.deleted) return;
            
            panel.corners.forEach((corner, cornerIndex) => {
                const key = `${corner.x.toFixed(3)}_${corner.y.toFixed(3)}`;
                if (!postPositions.has(key)) {
                    const isFront = cornerIndex === 0 || cornerIndex === 1;  // FL, FR
                    const topHeight = isFront ? baseH : baseH + panelZRise;
                    
                    postPositions.set(key, new SupportPost({
                        position: new WorldPoint2D(corner.x, corner.y),
                        baseHeight: 0,  // Roof level
                        topHeight: topHeight,
                        type: isFront ? 'front' : 'rear'
                    }));
                }
            });
        });
        
        return Array.from(postPositions.values());
    }
    
    /**
     * Calculate mounting rails
     */
    _calculateRails(panels, baseH, panelYProjected, panelZRise, arrayAngle, arrayCenter, panelWidth, gapW) {
        const rails = [];
        const railMap = new Map();  // Key: "type_y" -> { minX, maxX, y, z }
        
        // Group panels by row (similar Y coordinate)
        const rowGroups = new Map();
        panels.forEach(panel => {
            if (panel.deleted) return;
            const key = panel.localY.toFixed(3);  // Using local Y before rotation for reliable row grouping
            if (!rowGroups.has(key)) rowGroups.set(key, []);
            rowGroups.get(key).push(panel);
        });
        
        // Front and rear rails for each row
        rowGroups.forEach((rowPanels, rowKey) => {
            const minX = Math.min(...rowPanels.map(p => p.corners[0].x));
            const maxX = Math.max(...rowPanels.map(p => p.corners[1].x));
            const y = rowPanels[0].corners[0].y;
            const yRear = rowPanels[0].corners[3].y;
            const hFront = baseH;
            const hRear = baseH + panelZRise;
            
            // Front rail
            rails.push(new MountingRail({
                start: new WorldPoint3D(minX, y, hFront),
                end: new WorldPoint3D(maxX, y, hFront),
                type: 'main'
            }));
            
            // Rear rail
            rails.push(new MountingRail({
                start: new WorldPoint3D(minX, yRear, hRear),
                end: new WorldPoint3D(maxX, yRear, hRear),
                type: 'main'
            }));
            
            // Cross rails (purlins) at each panel edge
            rowPanels.forEach(panel => {
                const x1 = panel.corners[0].x;
                const x2 = panel.corners[1].x;
                
                rails.push(new MountingRail({
                    start: new WorldPoint3D(x1, y, hFront),
                    end: new WorldPoint3D(x1, yRear, hRear),
                    type: 'cross'
                }));
                
                rails.push(new MountingRail({
                    start: new WorldPoint3D(x2, y, hFront),
                    end: new WorldPoint3D(x2, yRear, hRear),
                    type: 'cross'
                }));
            });
        });
        
        return rails;
    }
    
    /**
     * Calculate footprint polygon (2D projection on roof)
     */
    _calculateFootprintPolygon(panels) {
        if (panels.length === 0) return [];
        
        // Get all corner points projected to Z=0
        const points = [];
        panels.forEach(panel => {
            if (panel.deleted) return;
            panel.corners.forEach(corner => {
                points.push(new WorldPoint2D(corner.x, corner.y));
            });
        });
        
        if (points.length < 3) return [];
        
        // Compute convex hull
        return this._convexHull(points);
    }
    
    /**
     * Convex hull (Monotone chain algorithm)
     */
    _convexHull(points) {
        // Sort points
        points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
        
        // Cross product
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        
        // Lower hull
        const lower = [];
        for (const p of points) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }
        
        // Upper hull
        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }
        
        // Concatenate (removing duplicate endpoints)
        lower.pop();
        upper.pop();
        return lower.concat(upper);
    }
    
    /**
     * Calculate bounding box of points
     */
    _calculateBoundingBox(points) {
        if (points.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        
        return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    }
    
    /**
     * Point in polygon test (ray casting)
     */
    _pointInPolygon(point, polygon) {
        if (!polygon || polygon.length < 3) return false;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    /**
     * Validate array footprint against roof boundary
     * @returns {Object} { valid: boolean, errors: string[], clippedFootprint: WorldPoint2D[] }
     */
    validateFootprint(footprint, roofBoundary) {
        const result = { valid: true, errors: [], clippedFootprint: null };
        
        if (!roofBoundary || roofBoundary.length < 3) {
            return result;  // No boundary to validate against
        }
        
        // Check if all footprint points are inside roof boundary
        let allInside = true;
        for (const pt of footprint) {
            if (!this._pointInPolygon(pt, roofBoundary)) {
                allInside = false;
                break;
            }
        }
        
        if (!allInside) {
            result.valid = false;
            result.errors.push('Array footprint extends beyond roof boundary');
            
            // Attempt to clip footprint to boundary
            result.clippedFootprint = this._clipPolygonToBoundary(footprint, roofBoundary);
        }
        
        return result;
    }
    
    /**
     * Clip polygon to boundary (Sutherland-Hodgman)
     */
    _clipPolygonToBoundary(subjectPolygon, clipPolygon) {
        // Simplified: just return points that are inside
        return subjectPolygon.filter(pt => this._pointInPolygon(pt, clipPolygon));
    }
    
    /**
     * Calculate new geometry when resizing footprint
     * @param {Object} currentGeometry - Current SolarArrayGeometry
     * @param {Object} newFootprint - { center, width, height, angle }
     * @param {Object} config - Original configuration
     * @returns {SolarArrayGeometry} New geometry
     */
    resizeFootprint(currentGeometry, newFootprint, config) {
        // Recalculate with new footprint
        const newConfig = {
            ...config,
            footprint: newFootprint
        };
        return this.calculateArrayGeometry(newConfig);
    }
    
    /**
     * Calculate new geometry when dragging (translating) array
     * @param {Object} currentGeometry - Current SolarArrayGeometry
     * @param {WorldPoint2D} delta - Translation vector in world meters
     * @param {Object} config - Original configuration
     * @returns {SolarArrayGeometry} New geometry
     */
    translateArray(currentGeometry, delta, config) {
        const newFootprint = {
            ...currentGeometry.footprint,
            center: new WorldPoint2D(
                currentGeometry.center.x + delta.x,
                currentGeometry.center.y + delta.y
            )
        };
        
        const newConfig = {
            ...config,
            footprint: newFootprint
        };
        return this.calculateArrayGeometry(newConfig);
    }
    
    /**
     * Calculate new geometry when rotating array
     * @param {Object} currentGeometry - Current SolarArrayGeometry
     * @param {number} deltaAngle - Angle change in radians
     * @param {Object} config - Original configuration
     * @returns {SolarArrayGeometry} New geometry
     */
    rotateArray(currentGeometry, deltaAngle, config) {
        const newFootprint = {
            ...currentGeometry.footprint,
            angle: currentGeometry.orientation + deltaAngle
        };
        
        const newConfig = {
            ...config,
            footprint: newFootprint,
            azimuthDeg: (config.azimuthDeg || 0) + (deltaAngle * 180 / Math.PI)
        };
        return this.calculateArrayGeometry(newConfig);
    }
}

// ==========================================
// EXPORT
// ==========================================

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.SolarGeometryEngine = SolarGeometryEngine;
    window.SolarArrayGeometry = SolarArrayGeometry;
    window.SolarPanel = SolarPanel;
    window.SupportPost = SupportPost;
    window.MountingRail = MountingRail;
    window.WorldPoint2D = WorldPoint2D;
    window.WorldPoint3D = WorldPoint3D;
    window.SOLAR_CONSTANTS = SOLAR_CONSTANTS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SolarGeometryEngine,
        SolarArrayGeometry,
        SolarPanel,
        SupportPost,
        MountingRail,
        WorldPoint2D,
        WorldPoint3D,
        SOLAR_CONSTANTS
    };
}