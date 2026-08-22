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
    MAX_TILT_DEG: 100,
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
        return new WorldPoint3D(this.x + other.x, this.y + other.y, this.z + (other.z || 0));
    }
    
    subtract(other) {
        return new WorldPoint3D(this.x - other.x, this.y - other.y, this.z - (other.z || 0));
    }
    
    multiply(scalar) {
        return new WorldPoint3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    
    cross(other) {
        return new WorldPoint3D(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }
    
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * (other.z || 0);
    }
    
    normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (len === 0) return new WorldPoint3D(0, 0, 0);
        return new WorldPoint3D(this.x / len, this.y / len, this.z / len);
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
    /**
     * DEBUG: Mathematical validation of panel geometry
     */
    debugSolarGeometry(config) {
        console.log("=== DEBUG: SOLAR GEOMETRY VALIDATION ===");
        const result = this.calculateArrayGeometry(config);
        
        console.log("Configuration:");
        console.log(`- Panel: ${config.panelWidthMm}x${config.panelLengthMm} mm`);
        console.log(`- Structure Height: ${config.structureHeightM} m`);
        console.log(`- Tilt: ${config.tiltAngleDeg}°`);
        console.log(`- Azimuth: ${config.azimuthDeg}°`);
        console.log(`- Roll: ${config.rollAngleDeg || 0}°`);
        
        if (result.panels.length > 0) {
            const panel = result.panels[0];
            const [FL, FR, RR, RL] = panel.corners;
            
            console.log("\nFirst Panel Corners (World Space):");
            console.log(`FL: (x: ${FL.x.toFixed(4)}, y: ${FL.y.toFixed(4)}, z: ${FL.z.toFixed(4)})`);
            console.log(`FR: (x: ${FR.x.toFixed(4)}, y: ${FR.y.toFixed(4)}, z: ${FR.z.toFixed(4)})`);
            console.log(`RR: (x: ${RR.x.toFixed(4)}, y: ${RR.y.toFixed(4)}, z: ${RR.z.toFixed(4)})`);
            console.log(`RL: (x: ${RL.x.toFixed(4)}, y: ${RL.y.toFixed(4)}, z: ${RL.z.toFixed(4)})`);
            
            const measuredWidth = FL.distanceTo(FR);
            const measuredDepth = FL.distanceTo(RL);
            console.log(`\nMeasured Physical Width: ${measuredWidth.toFixed(4)} m`);
            console.log(`Measured Physical Depth: ${measuredDepth.toFixed(4)} m`);
            
            const v1 = FR.subtract(FL);
            const v2 = RL.subtract(FL);
            const normal = v1.cross(v2).normalize();
            console.log(`\nPlane Normal: (x: ${normal.x.toFixed(4)}, y: ${normal.y.toFixed(4)}, z: ${normal.z.toFixed(4)})`);
            
            const roofNormal = new WorldPoint3D(0, 0, 1);
            const dot = normal.dot(roofNormal);
            const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
            console.log(`Angle to Roof Normal: ${(angleRad * 180 / Math.PI).toFixed(2)}°`);
            
            console.log("\nSupports for this panel:");
            result.supports.forEach(sup => {
                // If support is at one of these corners
                if (Math.abs(sup.position.x - FL.x) < 0.01 || Math.abs(sup.position.x - RR.x) < 0.01 || Math.abs(sup.position.x - FR.x) < 0.01 || Math.abs(sup.position.x - RL.x) < 0.01) {
                    console.log(`- Post at (x: ${sup.position.x.toFixed(4)}, y: ${sup.position.y.toFixed(4)}): baseZ=0, topZ=${sup.topHeight.toFixed(4)}, type=${sup.type}`);
                }
            });
        }
        console.log("========================================");
        return result;
    }
}

/**
 * 3D Transformation Utilities (Intrinsic Euler Rotations)
 */
class Transform3D {
    // Rotation around LOCAL X axis (Tilt/Pitch)
    static rotateX(pt, angleRad) {
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        return new WorldPoint3D(
            pt.x,
            pt.y * cosA - pt.z * sinA,
            pt.y * sinA + pt.z * cosA
        );
    }

    // Rotation around LOCAL Y axis (Roll)
    static rotateY(pt, angleRad) {
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        return new WorldPoint3D(
            pt.x * cosA + pt.z * sinA,
            pt.y,
            -pt.x * sinA + pt.z * cosA
        );
    }

    // Rotation around GLOBAL Z axis (Azimuth/Yaw)
    static rotateZ(pt, angleRad) {
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        return new WorldPoint3D(
            pt.x * cosA - pt.y * sinA,
            pt.x * sinA + pt.y * cosA,
            pt.z
        );
    }

    // Apply strict sequence: Roll(Y) -> Tilt(X) -> Azimuth(Z)
    // Pivot is assumed to be the origin (0,0,0) of the point passed in.
    static applyOrientation(pt, rollRad, tiltRad, azimuthRad) {
        let p = Transform3D.rotateY(pt, rollRad); // Roll around Local Y
        p = Transform3D.rotateX(p, tiltRad);      // Tilt around Local X
        p = Transform3D.rotateZ(p, azimuthRad);   // Yaw around Global Z
        return p;
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
        this.orientation = 0;          // Azimuth (Radians)
        this.tilt = 0;                 // Radians
        this.roll = 0;                 // Radians
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
            rollAngleDeg,
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
        
        // Step 3: Angles
        const tiltRad = tiltAngleDeg * Math.PI / 180;
        const azimuthRad = azimuthDeg * Math.PI / 180;
        const rollRad = (rollAngleDeg || 0) * Math.PI / 180;
        
        // Step 4: Determine the projected dimensions for array planning
        // To plan the footprint, we use the panel's bounding size in the XY plane after roll and tilt
        const pFR_local = Transform3D.rotateX(Transform3D.rotateY(new WorldPoint3D(panelWidth, 0, 0), rollRad), tiltRad);
        const pRL_local = Transform3D.rotateX(Transform3D.rotateY(new WorldPoint3D(0, panelDepth, 0), rollRad), tiltRad);
        
        const projectedWidth = Math.abs(pFR_local.x);
        const projectedDepth = Math.abs(pRL_local.y);
        
        const gapW = (panelGapMm || this.constants.PANEL_GAP_MM) / 1000;
        const gapH = (rowGapMm || this._calculateAutoRowSpacing(panelDepth, tiltAngleDeg)) / 1000;
        
        // Step 5: Determine footprint (array bounding box on roof)
        let arrayFootprint;
        if (footprint && footprint.width > 0 && footprint.height > 0) {
            arrayFootprint = footprint;
        } else if (roofBoundary && roofBoundary.length >= 3) {
            arrayFootprint = this._calculateOptimalFootprint(roofBoundary, panelCount, panelWidth, projectedDepth, gapW, gapH, azimuthDeg);
        } else {
            // Fallback: create a default footprint
            arrayFootprint = this._createDefaultFootprint(panelCount, panelWidth, projectedDepth, gapW, gapH);
        }
        
        // Step 6: Calculate grid dimensions
        const gridWidth = arrayFootprint.width;
        const gridHeight = arrayFootprint.height;
        const arrayAngle = arrayFootprint.angle + azimuthRad;
        
        const maxCols = Math.max(1, Math.floor(gridWidth / (projectedWidth + gapW)));
        const maxRows = Math.max(1, Math.floor(gridHeight / (projectedDepth + gapH)));
        
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
        result.roll = rollRad;
        result.orientation = arrayAngle;
        
        // Step 7: Place panels with full 3D geometry
        const baseH = structureHeightM;
        
        const totalGridW = cols * (projectedWidth + gapW) - gapW;
        const totalGridH = rows * (projectedDepth + gapH) - gapH;
        
        // Center the grid within the original footprint anchor
        const startOffsetX = (gridWidth - totalGridW) / 2 - gridWidth / 2;
        const startOffsetY = (gridHeight - totalGridH) / 2 - gridHeight / 2;
        
        let modulesPlaced = 0;
        const allCorners = [];
        
        // Let the grid search infinitely downward until we place the requested panelCount
        // or we have searched far outside the roof bounds. 
        const searchRows = 200; // sufficiently large to reflow any normal array
        const searchCols = cols; // keep width bounded by footprint width so we don't bleed sideways
        
        for (let r = 0; r < searchRows; r++) {
            let placedInRow = 0;
            for (let c = 0; c < searchCols; c++) {
                if (modulesPlaced >= panelCount) break;
                
                // Local panel origin (top-left in local grid space, Z=0)
                const localX = startOffsetX + c * (projectedWidth + gapW);
                const localY = startOffsetY + r * (projectedDepth + gapH);
                
                // 1. Build flat local panel (Origin at FL corner)
                const pFL = new WorldPoint3D(0, 0, 0);
                const pFR = new WorldPoint3D(panelWidth, 0, 0);
                const pRR = new WorldPoint3D(panelWidth, panelDepth, 0);
                const pRL = new WorldPoint3D(0, panelDepth, 0);
                
                const corners = [pFL, pFR, pRR, pRL];
                
                // Apply transformations to each corner
                const worldCorners = corners.map(corner => {
                    // 2. Apply intrinsic rotations (Roll -> Tilt)
                    let p = Transform3D.rotateY(corner, rollRad);
                    p = Transform3D.rotateX(p, tiltRad);
                    
                    // 3. Translate to grid position and structure height (Z = baseH)
                    // The pivot point for tilt is the local (0,0,0) which becomes (localX, localY, baseH)
                    p = p.add(new WorldPoint3D(localX, localY, baseH));
                    
                    // 4. Apply array Azimuth (rotates the entire array footprint around its center 0,0)
                    p = Transform3D.rotateZ(p, arrayAngle);
                    
                    // 5. Translate to World Footprint Center
                    return p.add(new WorldPoint3D(arrayFootprint.center.x, arrayFootprint.center.y, 0));
                });
                
                // Calculate center point for validation
                const centerLocal = new WorldPoint3D(panelWidth / 2, panelDepth / 2, 0);
                let centerWorld = Transform3D.rotateY(centerLocal, rollRad);
                centerWorld = Transform3D.rotateX(centerWorld, tiltRad);
                centerWorld = centerWorld.add(new WorldPoint3D(localX, localY, baseH));
                centerWorld = Transform3D.rotateZ(centerWorld, arrayAngle);
                centerWorld = centerWorld.add(new WorldPoint3D(arrayFootprint.center.x, arrayFootprint.center.y, 0));
                
                const center2D = new WorldPoint2D(centerWorld.x, centerWorld.y);
                
                // Validate against roof boundary: ALL 4 corners must be inside
                let valid = true;
                if (roofBoundary && roofBoundary.length >= 3) {
                    for (const pt of worldCorners) {
                        const pt2D = new WorldPoint2D(pt.x, pt.y);
                        if (!this._pointInPolygon(pt2D, roofBoundary)) {
                            valid = false;
                            break;
                        }
                    }
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
                    center: center2D,
                    valid
                });
                
                result.panels.push(panel);
                
                if (valid) {
                    modulesPlaced++;
                    placedInRow++;
                    allCorners.push(...worldCorners.map(corner => new WorldPoint2D(corner.x, corner.y)));
                }
            }
            
            if (modulesPlaced >= panelCount) break;
            
            // Early exit: if we are far past the original footprint AND we placed 0 panels this row,
            // we are entirely off the roof boundary and can stop searching downward.
            if (r >= maxRows + 2 && placedInRow === 0) {
                break;
            }
        }
        
        // Update capacity to match actually placed valid panels
        result.panelCount = modulesPlaced;
        result.capacityKw = (modulesPlaced * panelWattage) / 1000;
        result.insufficientSpace = modulesPlaced < panelCount;
        
        // Step 8: Calculate support posts
        result.supports = this._calculateSupports(result.panels, baseH, config.legExtension || 0);
        
        // Step 9: Calculate rails
        result.rails = this._calculateRails(result.panels, baseH, panelWidth, gapW);
        
        // Step 10: Calculate footprint polygon (2D projection on roof)
        const footprintPoly = this._calculateFootprintPolygon(result.panels);
        const footprintObr = this._getOrientedBoundingRect(footprintPoly);
        result.footprint = footprintPoly;
        
        // IMPORTANT: Preserve the original grid dimensions to prevent the array from collapsing
        // into a narrow strip if it's dragged near an edge.
        result.totalWidth = Math.max(gridWidth, footprintObr.width);
        result.totalDepth = Math.max(gridHeight, footprintObr.height);
        
        // Preserve the drag anchor as the center so the array doesn't "slip" when panels are chopped off
        result.center = arrayFootprint.center;
        
        // Step 11: Calculate bounding box
        result.boundingBox = this._calculateBoundingBox(allCorners);
        
        let maxZ = 0;
        result.panels.forEach(p => p.corners.forEach(c => {
            if (c.z > maxZ) maxZ = c.z;
        }));
        result.totalHeight = maxZ;
        
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
            rollAngleDeg: 0,
            structureHeightM: 0.3,
            panelGapMm: 20,
            rowGapMm: null,  // auto
            roofBoundary: null,
            footprint: null,
            maxPanels: null,
            legExtension: 0
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
        
        // Calculate required grid size based on physical roof limits
        let maxCols = Math.max(1, Math.floor(usableWidth / (panelWidth + gapW)));
        const maxRows = Math.max(1, Math.floor(usableHeight / (panelDepth + gapH)));
        
        // For realistic installations, we don't want a single row of 50 panels. 
        // We balance the layout into a block that is roughly 1.5x to 2x wider than it is deep.
        const idealCols = Math.ceil(Math.sqrt(panelCount));
        const balancedCols = Math.ceil(idealCols * 1.5);
        maxCols = Math.min(maxCols, balancedCols);
        
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
    
    _calculateSupports(panels, baseH, legExtension = 0) {
        const supports = [];
        const postPositions = new Map();  // Key: "x_y" -> SupportPost
        
        // Collect unique post positions from panel corners
        panels.forEach(panel => {
            if (panel.deleted) return;
            
            panel.corners.forEach((corner, cornerIndex) => {
                const key = `${corner.x.toFixed(3)}_${corner.y.toFixed(3)}`;
                if (!postPositions.has(key)) {
                    // Front edge (FL, FR) vs Rear edge (RR, RL)
                    const isFront = cornerIndex === 0 || cornerIndex === 1; 
                    
                    postPositions.set(key, new SupportPost({
                        position: new WorldPoint2D(corner.x, corner.y),
                        baseHeight: -legExtension,  // Roof level + extension downwards!
                        topHeight: corner.z, // Directly from exact 3D geometry!
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
    _calculateRails(panels, baseH, panelWidth, gapW) {
        const rails = [];
        
        // Group panels by row (similar Y coordinate before rotation)
        const rowGroups = new Map();
        panels.forEach(panel => {
            if (panel.deleted) return;
            // Use panel.localY for row grouping since it's the un-rotated local grid coordinate
            const key = panel.localY.toFixed(3);  
            if (!rowGroups.has(key)) rowGroups.set(key, []);
            rowGroups.get(key).push(panel);
        });
        
        // Front and rear rails for each row
        rowGroups.forEach((rowPanels, rowKey) => {
            // Sort panels in the row by localX to find the extremities
            rowPanels.sort((a, b) => a.localX - b.localX);
            const firstPanel = rowPanels[0];
            const lastPanel = rowPanels[rowPanels.length - 1];
            
            // Front rail connects FL of first panel to FR of last panel
            rails.push(new MountingRail({
                start: firstPanel.corners[0], // FL
                end: lastPanel.corners[1],    // FR
                type: 'main'
            }));
            
            // Rear rail connects RL of first panel to RR of last panel
            rails.push(new MountingRail({
                start: firstPanel.corners[3], // RL
                end: lastPanel.corners[2],    // RR
                type: 'main'
            }));
            
            // Cross rails (purlins) at each panel edge
            rowPanels.forEach(panel => {
                // Left edge (FL to RL)
                rails.push(new MountingRail({
                    start: panel.corners[0],
                    end: panel.corners[3],
                    type: 'cross'
                }));
                // Right edge (FR to RR)
                rails.push(new MountingRail({
                    start: panel.corners[1],
                    end: panel.corners[2],
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