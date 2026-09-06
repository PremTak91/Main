/**
 * homographyCalibration.js
 * Handles the calculation of the IMAGE <-> ROOF WORLD SPACE homography matrix.
 */

const HomographyCalibration = {
    
    /**
     * Solves Ax = b
     */
    solveLinearSystem: function(A, b) {
        const n = b.length;
        let m = [];
        for (let i = 0; i < n; i++) m.push([...A[i], b[i]]);

        for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(m[i][i]), maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(m[k][i]) > maxEl) {
                    maxEl = Math.abs(m[k][i]); maxRow = k;
                }
            }
            for (let k = i; k < n + 1; k++) {
                let tmp = m[maxRow][k]; m[maxRow][k] = m[i][k]; m[i][k] = tmp;
            }
            if (Math.abs(m[i][i]) < 1e-10) return null;
            
            for (let k = i + 1; k < n; k++) {
                let c = -m[k][i] / m[i][i];
                for (let j = i; j < n + 1; j++) {
                    if (i === j) m[k][j] = 0;
                    else m[k][j] += c * m[i][j];
                }
            }
        }
        let x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = m[i][n] / m[i][i];
            for (let k = i - 1; k >= 0; k--) m[k][n] -= m[k][i] * x[i];
        }
        return x;
    },

    computeHomography: function(srcPoints, dstPoints) {
        let A = [], b = [];
        for (let i = 0; i < 4; i++) {
            const sx = srcPoints[i].x, sy = srcPoints[i].y;
            const dx = dstPoints[i].x, dy = dstPoints[i].y;
            A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]); b.push(dx);
            A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]); b.push(dy);
        }
        let h = this.solveLinearSystem(A, b);
        if (!h) return new Float64Array([1,0,0, 0,1,0, 0,0,1]);
        return new Float64Array([h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1]);
    },

    invertHomography: function(H) {
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
    },
    
    /**
     * Calibrate assuming a 4-point image polygon corresponds to a real-world rectangle.
     * @param {Array} imageQuad - 4 points in IMAGE SPACE [TL, TR, BR, BL]
     * @param {number} knownWidthMeters - Physical width of the top edge (TL to TR)
     * @param {number} knownHeightMeters - Physical height of the left edge (TL to BL)
     * @returns {Object} { homography, inverseHomography }
     */
    calibrateFromRectangle: function(imageQuad, knownWidthMeters, knownHeightMeters) {
        const roofWorldRect = [
            { x: 0, y: 0 },
            { x: knownWidthMeters, y: 0 },
            { x: knownWidthMeters, y: knownHeightMeters },
            { x: 0, y: knownHeightMeters }
        ];
        
        // H maps Roof World (meters) to Image Space (pixels)
        const H = this.computeHomography(roofWorldRect, imageQuad);
        // H_inv maps Image Space (pixels) to Roof World (meters)
        const H_inv = this.invertHomography(H);
        
        return { H, H_inv };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HomographyCalibration };
} else {
    window.HomographyCalibration = HomographyCalibration;
}
