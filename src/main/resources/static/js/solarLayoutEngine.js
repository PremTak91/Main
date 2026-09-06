/**
 * solarLayoutEngine.js
 * Strictly enforces physical ROOF WORLD SPACE generation and collisions.
 */

const SolarLayoutEngine = {
    /**
     * Checks if a point is inside a polygon using ray casting.
     */
    isPointInPolygon: function(point, vs) {
        let x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i].x, yi = vs[i].y;
            let xj = vs[j].x, yj = vs[j].y;
            let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },

    /**
     * Deflate polygon by setback (naive approximation using centroid scaling for convex polygons,
     * or simple edge shifting. For exactness, a robust polygon offsetting library is preferred.
     * We'll implement a simple centroid-based scaling for the prototype).
     */
    applySetback: function(polygon, setbackMeters) {
        if (!polygon || polygon.length === 0) return [];
        if (setbackMeters <= 0) return polygon;
        
        let cx = 0, cy = 0;
        polygon.forEach(p => { cx += p.x; cy += p.y; });
        cx /= polygon.length;
        cy /= polygon.length;
        
        // Approximate setback: shift points towards centroid by setback amount
        return polygon.map(p => {
            let dx = cx - p.x;
            let dy = cy - p.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < setbackMeters) return {x: cx, y: cy}; // collapsed
            let ratio = (dist - setbackMeters) / dist;
            return {
                x: cx - dx * ratio,
                y: cy - dy * ratio
            };
        });
    },
    
    inflatePolygon: function(polygon, inflateMeters) {
        if (!polygon || polygon.length === 0) return [];
        if (inflateMeters <= 0) return polygon;
        
        let cx = 0, cy = 0;
        polygon.forEach(p => { cx += p.x; cy += p.y; });
        cx /= polygon.length;
        cy /= polygon.length;
        
        return polygon.map(p => {
            let dx = p.x - cx;
            let dy = p.y - cy;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let ratio = (dist + inflateMeters) / dist;
            return {
                x: cx + dx * ratio,
                y: cy + dy * ratio
            };
        });
    },

    /**
     * Rotate a point around an origin.
     */
    rotatePoint: function(x, y, cx, cy, angleDeg) {
        let rad = angleDeg * Math.PI / 180;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);
        let dx = x - cx;
        let dy = y - cy;
        return {
            x: cx + (dx * cos - dy * sin),
            y: cy + (dx * sin + dy * cos)
        };
    },

    /**
     * Generate the physical layout based purely on DesignState physical constraints.
     */
    generateLayout: function(designState) {
        const roofWorld = designState.roof.boundaryWorldSpace;
        if (!roofWorld || roofWorld.length < 3) return [];
        
        // 1. Calculate setbacks
        const usableBoundary = this.applySetback(roofWorld, designState.roof.setbacks.edge);
        const obstaclesWithSetbacks = designState.obstacles.map(obs => {
            return this.inflatePolygon(obs.polygonWorldSpace, designState.roof.setbacks.obstacle);
        });

        const anchor = designState.solarArray.anchorWorldSpace;
        const panelW = designState.solarArray.panelSpec.width;
        const panelL = designState.solarArray.panelSpec.length;
        const reqCount = designState.solarArray.counts.requested;
        const azimuth = designState.solarArray.orientation.azimuth; // Used for physical footprint rotation

        // 2. Generate Candidate Grid (Arbitrarily large around anchor)
        // We will generate a grid going positive and negative from anchor
        const maxCols = 20;
        const maxRows = 20;
        
        let validPanels = [];
        let maxTheoretical = 0;
        
        // Logical footprint extents
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Space between panels
        const spacingX = 0.02; // 20mm gap
        const spacingY = 0.05; // 50mm row gap

        for (let row = -maxRows; row < maxRows; row++) {
            for (let col = -maxCols; col < maxCols; col++) {
                
                // Calculate raw physical center of panel candidate
                let cx = anchor.x + col * (panelW + spacingX);
                let cy = anchor.y + row * (panelL + spacingY);
                
                // 4 corners of the panel footprint (unrotated)
                let hw = panelW / 2;
                let hl = panelL / 2;
                let corners = [
                    { x: cx - hw, y: cy - hl },
                    { x: cx + hw, y: cy - hl },
                    { x: cx + hw, y: cy + hl },
                    { x: cx - hw, y: cy + hl }
                ];

                // Apply orientation (azimuth)
                corners = corners.map(pt => this.rotatePoint(pt.x, pt.y, cx, cy, azimuth));
                
                // Generate support points (e.g. 4 legs slightly inset from corners)
                let supportInsetX = panelW * 0.15;
                let supportInsetY = panelL * 0.15;
                let supports = [
                    { x: cx - hw + supportInsetX, y: cy - hl + supportInsetY },
                    { x: cx + hw - supportInsetX, y: cy - hl + supportInsetY },
                    { x: cx + hw - supportInsetX, y: cy + hl - supportInsetY },
                    { x: cx - hw + supportInsetX, y: cy + hl - supportInsetY }
                ].map(pt => this.rotatePoint(pt.x, pt.y, cx, cy, azimuth));

                // 3. Collision / Boundary Validation
                let isInsideUsable = corners.every(pt => this.isPointInPolygon(pt, usableBoundary));
                let supportsInsideUsable = supports.every(pt => this.isPointInPolygon(pt, usableBoundary));
                
                if (!isInsideUsable || !supportsInsideUsable) continue;

                let hitsObstacle = false;
                for (let obs of obstaclesWithSetbacks) {
                    let cornersInObs = corners.some(pt => this.isPointInPolygon(pt, obs));
                    let supportsInObs = supports.some(pt => this.isPointInPolygon(pt, obs));
                    if (cornersInObs || supportsInObs) {
                        hitsObstacle = true;
                        break;
                    }
                }
                if (hitsObstacle) continue;

                // Candidate is valid
                maxTheoretical++;
                
                if (validPanels.length < reqCount) {
                    validPanels.push({
                        row: row,
                        col: col,
                        center: { x: cx, y: cy },
                        footprint: corners,
                        supports: supports
                    });
                    
                    corners.forEach(p => {
                        if (p.x < minX) minX = p.x;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.y > maxY) maxY = p.y;
                    });
                }
            }
        }
        
        designState.solarArray.counts.fitted = validPanels.length;
        designState.solarArray.counts.maximum = maxTheoretical;
        
        if (validPanels.length > 0) {
            designState.solarArray.logicalFootprint = { minX, minY, maxX, maxY };
        } else {
            designState.solarArray.logicalFootprint = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }

        return validPanels;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarLayoutEngine };
} else {
    window.SolarLayoutEngine = SolarLayoutEngine;
}
