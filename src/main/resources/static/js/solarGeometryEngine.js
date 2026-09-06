/**
 * solarGeometryEngine.js
 * Generates 3D Solar Geometry from physical 2D layout.
 * Enforces ROOF WORLD SPACE (Meters) -> 3D SOLAR GEOMETRY -> CAMERA PROJECTION pipeline.
 */

const SolarGeometryEngine = {
    
    degToRad: function(deg) { return deg * Math.PI / 180; },

    /**
     * Generate 3D coordinates for a single panel based on 2D layout and orientation parameters.
     */
    generate3DPanel: function(panel2D, orientation) {
        const cx = panel2D.center.x;
        const cy = panel2D.center.y;
        const tilt = this.degToRad(orientation.tilt);
        const azimuth = this.degToRad(orientation.azimuth);
        // We'll treat roll as 0 for this simplified model
        const heightZ = orientation.height;
        
        let vertices3D = [];
        
        panel2D.footprint.forEach(pt => {
            // Local 2D coordinates relative to center
            let dx = pt.x - cx;
            let dy = pt.y - cy;
            
            // To apply tilt, we need to know the axis of rotation. 
            // Azimuth determines the direction the panel faces.
            // Simplified: we rotate the local coordinates so panel faces "south" locally,
            // apply tilt, then rotate back by azimuth.
            
            // 1. Unrotate by azimuth
            let cosA = Math.cos(-azimuth);
            let sinA = Math.sin(-azimuth);
            let lx = dx * cosA - dy * sinA;
            let ly = dx * sinA + dy * cosA;
            
            // 2. Apply tilt (rotate around X axis)
            // local Z is initially 0
            let lz = 0;
            // standard rotation matrix around X
            let ty = ly * Math.cos(tilt) - lz * Math.sin(tilt);
            let tz = ly * Math.sin(tilt) + lz * Math.cos(tilt);
            
            // 3. Rotate back by azimuth
            let cosA2 = Math.cos(azimuth);
            let sinA2 = Math.sin(azimuth);
            let rx = lx * cosA2 - ty * sinA2;
            let ry = lx * sinA2 + ty * cosA2;
            
            // 4. Translate back to center and add height
            vertices3D.push({
                x: cx + rx,
                y: cy + ry,
                z: heightZ + tz
            });
        });

        // 3D support legs (straight down from supports to z=0)
        let supports3D = [];
        panel2D.supports.forEach(pt => {
            // Find Z on the tilted plane for this support point
            // Simplification: we'll just use the support's (x,y) and find Z by interpolating
            // the plane equation, or we can just apply the same rotation math
            let dx = pt.x - cx;
            let dy = pt.y - cy;
            let lx = dx * Math.cos(-azimuth) - dy * Math.sin(-azimuth);
            let ly = dx * Math.sin(-azimuth) + dy * Math.cos(-azimuth);
            let tz = ly * Math.sin(tilt);
            
            let topZ = heightZ + tz;
            
            supports3D.push({
                roofPoint: { x: pt.x, y: pt.y, z: 0 },
                panelPoint: { x: pt.x, y: pt.y, z: topZ }
            });
        });

        return {
            vertices: vertices3D,
            supports: supports3D
        };
    },

    /**
     * Projects 3D metrics to 2D image pixels via Homography and basic camera projection.
     */
    projectToScreen: function(pt3D, H, focalLengthScale = 1.05) {
        // Project to 2D using homography (mapping the Z=0 plane perfectly)
        // Note: Homography function is imported or provided by designState
        let w = H[6] * pt3D.x + H[7] * pt3D.y + H[8];
        if (Math.abs(w) < 1e-10) w = 1e-10;
        
        let screenX = (H[0] * pt3D.x + H[1] * pt3D.y + H[2]) / w;
        let screenY = (H[3] * pt3D.x + H[4] * pt3D.y + H[5]) / w;
        
        if (pt3D.z !== 0) {
            // Apply a simple perspective parallax shift based on Z height
            // Assuming the camera is perfectly top-down centered for the parallax effect
            // In a real robust system, we use a 4x4 camera projection matrix.
            // We'll mimic the old logic but structured correctly.
            const cx = 500; // Mock image center
            const cy = 500;
            const zScale = 1 + (pt3D.z * 0.05); // 5% expansion per meter height
            
            screenX = cx + (screenX - cx) * zScale;
            screenY = cy + (screenY - cy) * zScale;
            
            // Simple isometric extrusion
            const ny = 0.5; 
            const extrusionLength = pt3D.z * 40 * ny; // 40px per meter roughly
            screenY -= extrusionLength;
        }

        return { x: screenX, y: screenY };
    },

    generateAndProjectAll: function(designState, layoutPanels) {
        let renderData = [];
        const H = designState.camera.homographyMatrix;
        if (!H) return [];

        layoutPanels.forEach(panel2D => {
            const panel3D = this.generate3DPanel(panel2D, designState.solarArray.orientation);
            
            const projectedVertices = panel3D.vertices.map(pt => this.projectToScreen(pt, H));
            const projectedSupports = panel3D.supports.map(s => {
                return {
                    roofScreen: this.projectToScreen(s.roofPoint, H),
                    panelScreen: this.projectToScreen(s.panelPoint, H)
                };
            });

            renderData.push({
                id: `p_${panel2D.row}_${panel2D.col}`,
                poly: projectedVertices,
                supports: projectedSupports
            });
        });
        
        return renderData;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarGeometryEngine };
} else {
    window.SolarGeometryEngine = SolarGeometryEngine;
}
