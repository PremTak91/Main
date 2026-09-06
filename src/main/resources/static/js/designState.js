/**
 * DesignState.js
 * Authoritative physical source of truth for the solar design application.
 * Follows the strict unidirectional pipeline:
 * REAL PHOTO -> CALIBRATION -> ROOF WORLD SPACE -> SOLAR ARRAY LAYOUT -> 3D GEOMETRY -> CAMERA PROJECTION -> KONVA
 */

const DesignState = {
    camera: {
        homographyMatrix: null,
        inverseHomographyMatrix: null,
        pixelsPerMeter: 40 // Fallback scale
    },
    
    roof: {
        boundaryImageSpace: [], // Original pixel coordinates from the image
        boundaryWorldSpace: [], // Metric coordinates computed via homography
        setbacks: {
            edge: 0.3,      // meters
            obstacle: 0.5,  // meters
            maintenance: 0.5 // meters
        }
    },
    
    obstacles: [
        // { id: 'obs1', polygonImageSpace: [], polygonWorldSpace: [], height: 0.2 }
    ],
    
    solarArray: {
        anchorWorldSpace: { x: 0, y: 0 }, // ONLY property changed by dragging
        orientation: {
            tilt: 15,       // degrees
            azimuth: 180,   // degrees (South)
            roll: 0,        // degrees
            height: 0.1     // meters from roof surface
        },
        panelSpec: {
            length: 2.278,  // meters
            width: 1.134,   // meters
            watt: 550       // watts
        },
        counts: {
            requested: 10,  // User-defined target
            fitted: 0,      // System-calculated actual
            maximum: 0      // System-calculated theoretical max
        },
        logicalFootprint: { // Bounding box of the array in Roof World Space
            minX: 0, minY: 0, maxX: 0, maxY: 0
        }
    },
    
    // Core methods to maintain integrity
    updateCalibration: function(homographyMatrix, inverseHomographyMatrix) {
        this.camera.homographyMatrix = homographyMatrix;
        this.camera.inverseHomographyMatrix = inverseHomographyMatrix;
        this.recalculateRoofWorldSpace();
    },
    
    recalculateRoofWorldSpace: function() {
        if (!this.camera.inverseHomographyMatrix) return;
        
        // Convert boundary
        this.roof.boundaryWorldSpace = this.roof.boundaryImageSpace.map(pt => 
            this.applyHomography(this.camera.inverseHomographyMatrix, pt.x, pt.y)
        );
        
        // Convert obstacles
        this.obstacles.forEach(obs => {
            obs.polygonWorldSpace = obs.polygonImageSpace.map(pt => 
                this.applyHomography(this.camera.inverseHomographyMatrix, pt.x, pt.y)
            );
        });
    },
    
    applyHomography: function(H, x, y) {
        let w = H[6] * x + H[7] * y + H[8];
        if (Math.abs(w) < 1e-10) w = 1e-10;
        return {
            x: (H[0] * x + H[1] * y + H[2]) / w,
            y: (H[3] * x + H[4] * y + H[5]) / w
        };
    },
    
    setAnchor: function(x, y) {
        this.solarArray.anchorWorldSpace = { x, y };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DesignState };
} else {
    window.DesignState = DesignState;
}
