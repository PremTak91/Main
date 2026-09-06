/**
 * konvaAdapter.js
 * Bridges Konva UI events to the strict DesignState physical pipeline.
 */

const { DesignState } = require('./designState.js');
const { SolarLayoutEngine } = require('./solarLayoutEngine.js');
const { SolarGeometryEngine } = require('./solarGeometryEngine.js');

const KonvaAdapter = {
    
    /**
     * Triggered by Konva solarArrayGroup.on('dragmove') (Preview)
     * @param {number} screenDx - Mouse drag delta X
     * @param {number} screenDy - Mouse drag delta Y
     */
    onDragMove: function(screenDx, screenDy) {
        if (!DesignState.camera.inverseHomographyMatrix) return null;
        
        // 1. Calculate physical anchor from screen delta
        // To do this perfectly, we unproject the screen position of the anchor
        // For simplicity in this adapter, we just translate the anchor
        let anchorScreen = SolarGeometryEngine.projectToScreen(
            { x: DesignState.solarArray.anchorWorldSpace.x, y: DesignState.solarArray.anchorWorldSpace.y, z: 0 },
            DesignState.camera.homographyMatrix
        );
        
        let newScreen = { x: anchorScreen.x + screenDx, y: anchorScreen.y + screenDy };
        let newWorld = DesignState.applyHomography(DesignState.camera.inverseHomographyMatrix, newScreen.x, newScreen.y);
        
        // Temporarily set anchor for preview
        let oldAnchor = { ...DesignState.solarArray.anchorWorldSpace };
        DesignState.setAnchor(newWorld.x, newWorld.y);
        
        let previewPanels = SolarLayoutEngine.generateLayout(DesignState);
        let renderData = SolarGeometryEngine.generateAndProjectAll(DesignState, previewPanels);
        
        // Restore anchor, wait for dragEnd to commit
        DesignState.setAnchor(oldAnchor.x, oldAnchor.y);
        
        return renderData;
    },

    /**
     * Triggered by Konva solarArrayGroup.on('dragend')
     */
    onDragEnd: function(screenDx, screenDy) {
        if (!DesignState.camera.inverseHomographyMatrix) return null;
        
        let anchorScreen = SolarGeometryEngine.projectToScreen(
            { x: DesignState.solarArray.anchorWorldSpace.x, y: DesignState.solarArray.anchorWorldSpace.y, z: 0 },
            DesignState.camera.homographyMatrix
        );
        
        let newScreen = { x: anchorScreen.x + screenDx, y: anchorScreen.y + screenDy };
        let newWorld = DesignState.applyHomography(DesignState.camera.inverseHomographyMatrix, newScreen.x, newScreen.y);
        
        // COMMIT new anchor
        DesignState.setAnchor(newWorld.x, newWorld.y);
        
        let finalPanels = SolarLayoutEngine.generateLayout(DesignState);
        let renderData = SolarGeometryEngine.generateAndProjectAll(DesignState, finalPanels);
        
        return {
            designStateCounts: DesignState.solarArray.counts,
            renderData: renderData
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KonvaAdapter };
} else {
    window.KonvaAdapter = KonvaAdapter;
}
