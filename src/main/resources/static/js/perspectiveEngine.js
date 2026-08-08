/**
 * Perspective Estimation & Projection Engine for Solar Rooftop Designer
 * Estimates 3D perspective from a roof polygon and provides functions to project 
 * world coordinates to screen and vice versa.
 */

// ==========================================
// HELPER FUNCTIONS (STANDALONE GLOBALS)
// ==========================================

/**
 * Solves a system of linear equations Ax = b using Gaussian elimination.
 * @param {Float64Array|Array<Array<number>>} A - Matrix A
 * @param {Array<number>} b - Vector b
 * @returns {Array<number>|null} - Solution vector x, or null if singular
 */
function solveLinearSystem(A, b) {
    const n = b.length;
    let m = [];
    for (let i = 0; i < n; i++) {
        m.push([...A[i], b[i]]);
    }

    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxEl = Math.abs(m[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(m[k][i]) > maxEl) {
                maxEl = Math.abs(m[k][i]);
                maxRow = k;
            }
        }

        // Swap
        for (let k = i; k < n + 1; k++) {
            let tmp = m[maxRow][k];
            m[maxRow][k] = m[i][k];
            m[i][k] = tmp;
        }

        if (Math.abs(m[i][i]) < 1e-10) {
            return null; // Singular
        }

        // Make all rows below this one 0 in current column
        for (let k = i + 1; k < n; k++) {
            let c = -m[k][i] / m[i][i];
            for (let j = i; j < n + 1; j++) {
                if (i === j) {
                    m[k][j] = 0;
                } else {
                    m[k][j] += c * m[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = m[i][n] / m[i][i];
        for (let k = i - 1; k >= 0; k--) {
            m[k][n] -= m[k][i] * x[i];
        }
    }
    return x;
}

/**
 * Computes the 3x3 projective transformation matrix from 4 source points to 4 destination points.
 * @param {Array<{x:number, y:number}>} srcPoints 
 * @param {Array<{x:number, y:number}>} dstPoints 
 * @returns {Float64Array} 9-element array (3x3 matrix) in row-major order
 */
function computeHomography3x3(srcPoints, dstPoints) {
    if (srcPoints.length !== 4 || dstPoints.length !== 4) {
        throw new Error("Exactly 4 points are required to compute homography.");
    }
    
    let A = [];
    let b = [];
    
    for (let i = 0; i < 4; i++) {
        const sx = srcPoints[i].x;
        const sy = srcPoints[i].y;
        const dx = dstPoints[i].x;
        const dy = dstPoints[i].y;
        
        A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
        b.push(dx);
        
        A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
        b.push(dy);
    }
    
    let h = solveLinearSystem(A, b);
    if (!h) {
        // Fallback to identity matrix if singular
        return new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
    
    return new Float64Array([h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1]);
}

/**
 * Inverts a 3x3 homography matrix.
 * @param {Float64Array} H - 9-element array
 * @returns {Float64Array|null}
 */
function invertHomography3x3(H) {
    let det = H[0]*(H[4]*H[8] - H[5]*H[7]) - H[1]*(H[3]*H[8] - H[5]*H[6]) + H[2]*(H[3]*H[7] - H[4]*H[6]);
    if (Math.abs(det) < 1e-10) return null;
    
    let inv = new Float64Array(9);
    inv[0] = (H[4]*H[8] - H[5]*H[7]) / det;
    inv[1] = (H[2]*H[7] - H[1]*H[8]) / det;
    inv[2] = (H[1]*H[5] - H[2]*H[4]) / det;
    
    inv[3] = (H[5]*H[6] - H[3]*H[8]) / det;
    inv[4] = (H[0]*H[8] - H[2]*H[6]) / det;
    inv[5] = (H[2]*H[3] - H[0]*H[5]) / det;
    
    inv[6] = (H[3]*H[7] - H[4]*H[6]) / det;
    inv[7] = (H[1]*H[6] - H[0]*H[7]) / det;
    inv[8] = (H[0]*H[4] - H[1]*H[3]) / det;
    
    return inv;
}

/**
 * Applies a 3x3 homography to a 2D point.
 * @param {Float64Array} H - 3x3 homography matrix
 * @param {number} x 
 * @param {number} y 
 * @returns {{x:number, y:number}}
 */
function applyHomography(H, x, y) {
    let w = H[6] * x + H[7] * y + H[8];
    if (Math.abs(w) < 1e-10) w = 1e-10;
    
    return {
        x: (H[0] * x + H[1] * y + H[2]) / w,
        y: (H[3] * x + H[4] * y + H[5]) / w
    };
}

/**
 * Finds the intersection point of two lines.
 * @returns {{x:number, y:number, parallel:boolean}}
 */
function findLineIntersection(line1Start, line1End, line2Start, line2End) {
    const x1 = line1Start.x, y1 = line1Start.y;
    const x2 = line1End.x, y2 = line1End.y;
    const x3 = line2Start.x, y3 = line2Start.y;
    const x4 = line2End.x, y4 = line2End.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    // If angle < ~2 degrees, treat as parallel
    // We can check denominator and vector dot products
    const v1 = {x: x2-x1, y: y2-y1};
    const v2 = {x: x4-x3, y: y4-y3};
    const len1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y);
    const len2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y);
    const cross = (v1.x*v2.y - v1.y*v2.x) / (len1*len2);
    
    if (Math.abs(cross) < 0.035 || Math.abs(denom) < 1e-6) { // ~2 degrees
        return { x: 1e9, y: 1e9, parallel: true };
    }
    
    const px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
    const py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;
    
    return { x: px, y: py, parallel: false };
}

/**
 * Fits a 4-point quadrilateral to a polygon of any size.
 * Returns [TL, TR, BR, BL]
 */
function fitQuadrilateral(polygon) {
    if (!polygon || polygon.length < 3) return null;
    if (polygon.length === 3) {
        // Degenerate quad
        return [polygon[0], polygon[1], polygon[2], polygon[0]];
    }
    if (polygon.length === 4) {
        // Order as TL, TR, BR, BL heuristically
        let pts = [...polygon];
        let center = pts.reduce((acc, p) => ({x: acc.x + p.x/4, y: acc.y + p.y/4}), {x:0, y:0});
        pts.sort((a,b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
        return [pts[0], pts[1], pts[2], pts[3]];
    }
    
    // Find extremes
    let tl = polygon[0], tr = polygon[0], br = polygon[0], bl = polygon[0];
    let minSum = Infinity, maxSum = -Infinity, minDiff = Infinity, maxDiff = -Infinity;
    
    for (let p of polygon) {
        const sum = p.x + p.y;
        const diff = p.x - p.y;
        
        if (sum < minSum) { minSum = sum; tl = p; }
        if (sum > maxSum) { maxSum = sum; br = p; }
        if (diff > maxDiff) { maxDiff = diff; tr = p; }
        if (diff < minDiff) { minDiff = diff; bl = p; }
    }
    
    return [tl, tr, br, bl];
}

// ==========================================
// PERSPECTIVE ENGINE CLASS
// ==========================================

class PerspectiveEngine {
    constructor(roofPolygon, imageWidth, imageHeight, scalePixelsPerMeter) {
        this.roofPolygon = roofPolygon;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.scalePixelsPerMeter = scalePixelsPerMeter;
        
        this.roofQuad = null;
        this.homographyMatrix = null;
        this.inverseHomographyMatrix = null;
        
        this.vanishingPoints = [];
        this.horizonAngle = 0;
        this.horizonY = 0;
        this.roofNormal = {nx: 0, ny: 0, nz: 1};
        this.isPerspectiveEstimated = false;
        
        this.estimatePerspective();
    }
    
    estimatePerspective() {
        if (!this.roofPolygon || this.roofPolygon.length < 3) {
            console.warn("Invalid polygon for perspective estimation");
            return { success: false, vanishingPoints: [], horizonAngle: 0, roofNormal: {nx:0, ny:0, nz:1} };
        }
        
        this.roofQuad = fitQuadrilateral(this.roofPolygon);
        
        // Calculate physical dimensions based on the top and left edges of the quad
        // This gives us a local physical coordinate system for the roof in meters
        const topEdgePx = Math.sqrt(Math.pow(this.roofQuad[1].x - this.roofQuad[0].x, 2) + Math.pow(this.roofQuad[1].y - this.roofQuad[0].y, 2));
        const leftEdgePx = Math.sqrt(Math.pow(this.roofQuad[3].x - this.roofQuad[0].x, 2) + Math.pow(this.roofQuad[3].y - this.roofQuad[0].y, 2));
        
        this.physicalWidthM = Math.max(1, topEdgePx / this.scalePixelsPerMeter);
        this.physicalHeightM = Math.max(1, leftEdgePx / this.scalePixelsPerMeter);
        
        const srcPhysical = [
            {x: 0, y: 0},
            {x: this.physicalWidthM, y: 0},
            {x: this.physicalWidthM, y: this.physicalHeightM},
            {x: 0, y: this.physicalHeightM}
        ];
        
        this.homographyMatrix = computeHomography3x3(srcPhysical, this.roofQuad);
        this.inverseHomographyMatrix = invertHomography3x3(this.homographyMatrix);
        
        // Detect vanishing points
        // Line 1: TL-TR and BL-BR
        const vp1 = findLineIntersection(this.roofQuad[0], this.roofQuad[1], this.roofQuad[3], this.roofQuad[2]);
        // Line 2: TL-BL and TR-BR
        const vp2 = findLineIntersection(this.roofQuad[0], this.roofQuad[3], this.roofQuad[1], this.roofQuad[2]);
        
        this.vanishingPoints = [vp1, vp2];
        
        // Calculate horizon line
        if (vp1.parallel && vp2.parallel) {
            this.horizonAngle = 0;
            this.horizonY = -1e6; // very far up
            this.roofNormal = {nx: 0, ny: 0, nz: 1};
        } else if (vp1.parallel) {
            this.horizonAngle = 0;
            this.horizonY = vp2.y;
            this.roofNormal = {nx: 0, ny: Math.sin(Math.PI/4), nz: Math.cos(Math.PI/4)};
        } else if (vp2.parallel) {
            this.horizonAngle = 0;
            this.horizonY = vp1.y;
            this.roofNormal = {nx: 0, ny: Math.sin(Math.PI/4), nz: Math.cos(Math.PI/4)};
        } else {
            const dx = vp2.x - vp1.x;
            const dy = vp2.y - vp1.y;
            this.horizonAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            this.horizonY = (vp1.y + vp2.y) / 2; // Approximation of the horizon line center
            
            // Approximate roof normal based on perspective foreshortening
            // This is a simplified estimation
            let tilt = Math.min(Math.PI/2, Math.max(0, (this.imageHeight - this.horizonY) / this.imageHeight * (Math.PI/2)));
            this.roofNormal = {nx: 0, ny: Math.sin(tilt), nz: Math.cos(tilt)};
        }
        
        this.isPerspectiveEstimated = true;
        
        return {
            success: true,
            vanishingPoints: this.vanishingPoints,
            horizonAngle: this.horizonAngle,
            roofNormal: this.roofNormal
        };
    }
    
    getHomographyMatrix() {
        return this.homographyMatrix;
    }
    
    getInverseHomography() {
        return this.inverseHomographyMatrix;
    }
    
    projectToScreen(worldX, worldY, worldZ = 0) {
        if (!this.homographyMatrix) return {
            x: worldX * this.scalePixelsPerMeter, 
            y: worldY * this.scalePixelsPerMeter
        };
        
        // Map true physical meters (worldX, worldY) to screen pixels using Homography
        let pt = applyHomography(this.homographyMatrix, worldX, worldY);
        
        if (worldZ !== 0) {
            // Apply vertical displacement in screen space
            const depthFactor = this.getDepthFactor(pt.x, pt.y);
            const verticalShift = -worldZ * this.scalePixelsPerMeter * depthFactor;
            pt.y += verticalShift;
        }
        
        return pt;
    }
    
    screenToWorld(screenX, screenY) {
        if (!this.inverseHomographyMatrix) return {
            x: screenX / this.scalePixelsPerMeter, 
            y: screenY / this.scalePixelsPerMeter
        };
        
        // Map screen pixels to true physical meters on the roof plane
        let pt = applyHomography(this.inverseHomographyMatrix, screenX, screenY);
        return pt;
    }
    
    transformQuadToRoof(worldRect, height = 0) {
        const {x, y, w, h} = worldRect;
        const pts = [
            {x: x, y: y},
            {x: x + w, y: y},
            {x: x + w, y: y + h},
            {x: x, y: y + h}
        ];
        
        return pts.map(p => this.projectToScreen(p.x, p.y, height));
    }
    
    getVanishingPoints() {
        return this.vanishingPoints;
    }
    
    getHorizonLine() {
        return { angle: this.horizonAngle, y: this.horizonY };
    }
    
    getRoofNormal() {
        return this.roofNormal;
    }
    
    getDepthFactor(screenX, screenY) {
        if (!this.roofQuad) return 1.0;
        
        // Find bottom-most and top-most Y of the quad
        let minY = Math.min(...this.roofQuad.map(p => p.y));
        let maxY = Math.max(...this.roofQuad.map(p => p.y));
        let h = maxY - minY;
        if (h <= 0) return 1.0;
        
        // 0.0 at bottom (maxY), 1.0 at top (minY) - in standard screen coords, Y goes down
        let factor = (maxY - screenY) / h;
        
        // Clamp
        return Math.max(0.1, Math.min(1.0, factor + 0.2)); 
    }
    
    getRoofQuad() {
        return this.roofQuad;
    }
    
    getUsableQuadNormalized(walkwayMeters) {
        const offset = walkwayMeters; 
        return [
            {x: offset, y: offset},
            {x: 1 - offset, y: offset},
            {x: 1 - offset, y: 1 - offset},
            {x: offset, y: 1 - offset}
        ];
    }
    
    projectShadow(worldPt, height, sunAzimuth, sunElevation) {
        if (height <= 0) return this.projectToScreen(worldPt.x, worldPt.y, 0);
        
        // Simple shadow projection model
        const shadowLength = height / Math.tan(Math.max(0.01, sunElevation * Math.PI / 180));
        const azRad = sunAzimuth * Math.PI / 180;
        
        // In this simplistic model, map shadow on normalized plane
        // A more rigorous model would project through 3D space
        const shadowDx = Math.sin(azRad) * shadowLength;
        const shadowDy = -Math.cos(azRad) * shadowLength;
        
        return this.projectToScreen(worldPt.x + shadowDx, worldPt.y + shadowDy, 0);
    }
}
