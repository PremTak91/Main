/**
 * Realistic Solar Array Renderer for Solar Rooftop Designer.
 * Renders photorealistic solar installations on Konva.js canvas, with perspective projection,
 * 3D structure, and visual effects.
 */
class SolarRenderer {
    /**
     * @param {Object} perspectiveEngine - Global PerspectiveEngine instance
     * @param {Konva.Stage} stage - The Konva stage, used for reading scale factor
     */
    constructor(perspectiveEngine, stage) {
        this.perspectiveEngine = perspectiveEngine;
        this.stage = stage;
    }

    /**
     * Main rendering function that draws the complete solar installation
     * @param {Array} panelItems - Array of panel placement data
     * @param {Object} config - Array configuration
     * @param {Object} layers - Konva layers/groups {shadowsLayer, structureLayer, solarArrayGroup}
     */
    renderFullArray(panelItems, config, layers) {
        const { shadowsLayer, structureLayer, solarArrayGroup } = layers;

        if (shadowsLayer) shadowsLayer.destroyChildren();
        if (structureLayer) structureLayer.destroyChildren();
        if (solarArrayGroup) solarArrayGroup.destroyChildren();

        const activePanels = panelItems.filter(p => !p.deleted && p.valid !== false);
        if (activePanels.length === 0) return;

        if (config.showShadows !== false && shadowsLayer) {
            this.renderShadows(activePanels, config, shadowsLayer);
        }

        if (config.showStructure !== false && structureLayer) {
            this.renderStructure(activePanels, config, structureLayer);
        }

        if (solarArrayGroup) {
            this.renderPanels(activePanels, config, solarArrayGroup);
        }
    }

    /**
     * Projects shadow of panels onto the roof
     */
    renderShadows(panelItems, config, shadowsLayer) {
        const h = config.structureHeight || 0.3;
        const tilt = (config.tiltAngle || 10) * Math.PI / 180;
        const sunAzimuth = config.sunAzimuth !== undefined ? config.sunAzimuth : 220;
        const sunElevation = config.sunElevation !== undefined ? config.sunElevation : 45;

        panelItems.forEach(panel => {
            const w = panel.worldW;
            const d = panel.worldH;
            const x = panel.worldX;
            const y = panel.worldY;

            // Calculate corner heights
            const hFront = h;
            const hRear = h + d * Math.sin(tilt);
            const yRear = y + d * Math.cos(tilt);

            const corners = [
                { x: x, y: y, z: hFront },           // Front-Left
                { x: x + w, y: y, z: hFront },       // Front-Right
                { x: x + w, y: yRear, z: hRear },    // Rear-Right
                { x: x, y: yRear, z: hRear }         // Rear-Left
            ];

            const shadowPoints = corners.map(pt => 
                this.perspectiveEngine.projectShadow(pt, pt.z, sunAzimuth, sunElevation)
            );

            const flattenedPoints = shadowPoints.reduce((acc, pt) => {
                acc.push(pt.x, pt.y);
                return acc;
            }, []);

            const shadowPoly = new Konva.Line({
                points: flattenedPoints,
                fill: 'rgba(0, 0, 0, 0.25)',
                closed: true,
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 10,
                shadowOffset: { x: 0, y: 0 },
                shadowOpacity: 0.5
            });

            shadowsLayer.add(shadowPoly);

            // Ambient occlusion dots at leg bases (approximate leg positions)
            const legPositions = [
                {x: x, y: y}, {x: x + w, y: y},
                {x: x, y: yRear}, {x: x + w, y: yRear}
            ];

            legPositions.forEach(pos => {
                const screenPt = this.perspectiveEngine.projectToScreen(pos.x, pos.y, 0);
                const ao = new Konva.Ellipse({
                    x: screenPt.x,
                    y: screenPt.y,
                    radiusX: 5 * this._getScaleFactor(),
                    radiusY: 2.5 * this._getScaleFactor(),
                    fill: 'rgba(0,0,0,0.4)'
                });
                shadowsLayer.add(ao);
            });
        });
    }

    /**
     * Renders mounting structure
     */
    renderStructure(panelItems, config, structureLayer) {
        const h = config.structureHeight || 0.3;
        const tilt = (config.tiltAngle || 10) * Math.PI / 180;
        const scale = this._getScaleFactor();

        const drawnBasePlates = new Set();
        const drawnRails = new Set();

        // Base plates, Legs, and Rails
        panelItems.forEach(panel => {
            const w = panel.worldW;
            const d = panel.worldH;
            const x = panel.worldX;
            const y = panel.worldY;

            const yRear = y + d * Math.cos(tilt);
            const hRear = h + d * Math.sin(tilt);

            const legPoints = [
                {x: x, y: y, zFront: 0, zTop: h}, // FL
                {x: x + w, y: y, zFront: 0, zTop: h}, // FR
                {x: x, y: yRear, zFront: 0, zTop: hRear}, // RL
                {x: x + w, y: yRear, zFront: 0, zTop: hRear} // RR
            ];

            // Render Base Plates & Legs
            legPoints.forEach((pt, i) => {
                const key = `${pt.x.toFixed(2)}_${pt.y.toFixed(2)}`;
                if (!drawnBasePlates.has(key)) {
                    drawnBasePlates.add(key);

                    // Base plate Z=0
                    const bSize = 0.15;
                    const bRect = { x: pt.x - bSize/2, y: pt.y - bSize/2, w: bSize, h: bSize };
                    const bQuad = this.perspectiveEngine.transformQuadToRoof(bRect, 0);
                    
                    const flatBQuad = bQuad.reduce((acc, q) => { acc.push(q.x, q.y); return acc; }, []);
                    
                    if (config.mountType === 'RCC-Ballast') {
                        // Draw concrete block top face
                        const bQuadTop = this.perspectiveEngine.transformQuadToRoof(bRect, 0.15);
                        const flatBQuadTop = bQuadTop.reduce((acc, q) => { acc.push(q.x, q.y); return acc; }, []);
                        
                        structureLayer.add(new Konva.Line({
                            points: flatBQuadTop,
                            fill: '#d1d5db',
                            closed: true,
                            stroke: '#94a3b8',
                            strokeWidth: 1 * scale
                        }));
                        
                        // Draw block front face
                        const frontFace = [bQuad[2].x, bQuad[2].y, bQuad[3].x, bQuad[3].y, bQuadTop[3].x, bQuadTop[3].y, bQuadTop[2].x, bQuadTop[2].y];
                        structureLayer.add(new Konva.Line({
                            points: frontFace,
                            fill: '#94a3b8',
                            closed: true
                        }));
                    } else {
                        // Standard base plate
                        structureLayer.add(new Konva.Line({
                            points: flatBQuad,
                            fill: '#94a3b8',
                            closed: true,
                            stroke: '#475569',
                            strokeWidth: 1 * scale
                        }));
                    }

                    // Leg
                    const bot = this.perspectiveEngine.projectToScreen(pt.x, pt.y, 0);
                    const top = this.perspectiveEngine.projectToScreen(pt.x, pt.y, pt.zTop);
                    
                    structureLayer.add(new Konva.Line({
                        points: [bot.x, bot.y, top.x, top.y],
                        stroke: i < 2 ? '#94a3b8' : '#78879e', // Front lighter, Rear darker
                        strokeWidth: 3.5 * scale,
                        lineCap: 'round'
                    }));
                }
            });

            // Rails
            const rKeyF = `front_${y.toFixed(2)}`;
            if (!drawnRails.has(rKeyF)) {
                // Find all panels in this row to draw a continuous rail
                const rowPanels = panelItems.filter(p => Math.abs(p.worldY - y) < 0.1);
                const minX = Math.min(...rowPanels.map(p => p.worldX));
                const maxX = Math.max(...rowPanels.map(p => p.worldX + p.worldW));

                const pt1 = this.perspectiveEngine.projectToScreen(minX, y, h);
                const pt2 = this.perspectiveEngine.projectToScreen(maxX, y, h);

                structureLayer.add(new Konva.Line({
                    points: [pt1.x, pt1.y, pt2.x, pt2.y],
                    stroke: '#64748b',
                    strokeWidth: 5 * scale,
                    lineCap: 'round'
                }));
                drawnRails.add(rKeyF);
            }

            const rKeyR = `rear_${yRear.toFixed(2)}`;
            if (!drawnRails.has(rKeyR)) {
                const rowPanels = panelItems.filter(p => Math.abs(p.worldY - y) < 0.1);
                const minX = Math.min(...rowPanels.map(p => p.worldX));
                const maxX = Math.max(...rowPanels.map(p => p.worldX + p.worldW));

                const pt1 = this.perspectiveEngine.projectToScreen(minX, yRear, hRear);
                const pt2 = this.perspectiveEngine.projectToScreen(maxX, yRear, hRear);

                structureLayer.add(new Konva.Line({
                    points: [pt1.x, pt1.y, pt2.x, pt2.y],
                    stroke: '#64748b',
                    strokeWidth: 5 * scale,
                    lineCap: 'round'
                }));
                drawnRails.add(rKeyR);
            }

            // Cross rails (Purlins)
            const ptF1 = this.perspectiveEngine.projectToScreen(x, y, h);
            const ptR1 = this.perspectiveEngine.projectToScreen(x, yRear, hRear);
            structureLayer.add(new Konva.Line({
                points: [ptF1.x, ptF1.y, ptR1.x, ptR1.y],
                stroke: '#64748b',
                strokeWidth: 4 * scale
            }));

            const ptF2 = this.perspectiveEngine.projectToScreen(x + w, y, h);
            const ptR2 = this.perspectiveEngine.projectToScreen(x + w, yRear, hRear);
            structureLayer.add(new Konva.Line({
                points: [ptF2.x, ptF2.y, ptR2.x, ptR2.y],
                stroke: '#64748b',
                strokeWidth: 4 * scale
            }));
            
            // Diagonal bracing (simplified)
            if (panel.col % 2 === 0) {
                const pBot = this.perspectiveEngine.projectToScreen(x, y, 0);
                structureLayer.add(new Konva.Line({
                    points: [pBot.x, pBot.y, ptR2.x, ptR2.y],
                    stroke: '#475569',
                    strokeWidth: 2.5 * scale,
                    dash: [5 * scale, 5 * scale]
                }));
            }
        });
    }

    /**
     * Renders photorealistic PV panels
     */
    renderPanels(panelItems, config, solarArrayGroup) {
        const h = config.structureHeight || 0.3;
        const tilt = (config.tiltAngle || 10) * Math.PI / 180;
        const scale = this._getScaleFactor();

        panelItems.forEach(panel => {
            const w = panel.worldW;
            const d = panel.worldH;
            const x = panel.worldX;
            const y = panel.worldY;

            const hFront = h;
            const hRear = h + d * Math.sin(tilt);
            const yRear = y + d * Math.cos(tilt);

            // Screen corners for the panel face
            const corners = [
                this.perspectiveEngine.projectToScreen(x, y, hFront),         // FL
                this.perspectiveEngine.projectToScreen(x + w, y, hFront),     // FR
                this.perspectiveEngine.projectToScreen(x + w, yRear, hRear),  // RR
                this.perspectiveEngine.projectToScreen(x, yRear, hRear)       // RL
            ];

            const depthFactor = this.perspectiveEngine.getDepthFactor(corners[0].x, corners[0].y);
            const group = new Konva.Group();

            // Panel Body
            const panelShape = new Konva.Shape({
                sceneFunc: (ctx, shape) => {
                    ctx.beginPath();
                    ctx.moveTo(corners[0].x, corners[0].y);
                    ctx.lineTo(corners[1].x, corners[1].y);
                    ctx.lineTo(corners[2].x, corners[2].y);
                    ctx.lineTo(corners[3].x, corners[3].y);
                    ctx.closePath();
                    
                    // Base panel color (gradient)
                    const grad = ctx.createLinearGradient(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
                    grad.addColorStop(0, '#0f1d3a');
                    grad.addColorStop(0.5, '#13284f');
                    grad.addColorStop(1, '#081023');
                    ctx.fillStyle = grad;
                    ctx.fill();

                    // Grid lines (Cell layout)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.lineWidth = 1 * scale;
                    const cols = 6;
                    const rows = 12;

                    for (let i = 1; i < cols; i++) {
                        const pt1 = this._interpolateOnPanel(corners, i/cols, 0);
                        const pt2 = this._interpolateOnPanel(corners, i/cols, 1);
                        ctx.beginPath();
                        ctx.moveTo(pt1.x, pt1.y);
                        ctx.lineTo(pt2.x, pt2.y);
                        ctx.stroke();
                    }

                    for (let j = 1; j < rows; j++) {
                        const pt1 = this._interpolateOnPanel(corners, 0, j/rows);
                        const pt2 = this._interpolateOnPanel(corners, 1, j/rows);
                        ctx.beginPath();
                        ctx.moveTo(pt1.x, pt1.y);
                        ctx.lineTo(pt2.x, pt2.y);
                        ctx.stroke();
                    }

                    // Busbars
                    ctx.strokeStyle = 'rgba(192, 192, 192, 0.15)';
                    ctx.lineWidth = 2 * scale;
                    [0.25, 0.5, 0.75].forEach(v => {
                        const pt1 = this._interpolateOnPanel(corners, 0, v);
                        const pt2 = this._interpolateOnPanel(corners, 1, v);
                        ctx.beginPath();
                        ctx.moveTo(pt1.x, pt1.y);
                        ctx.lineTo(pt2.x, pt2.y);
                        ctx.stroke();
                    });

                    // Anti-reflective coating / shimmer
                    const shimmerGrad = ctx.createLinearGradient(corners[1].x, corners[1].y, corners[3].x, corners[3].y);
                    shimmerGrad.addColorStop(0, 'rgba(128, 0, 128, 0.05)');
                    shimmerGrad.addColorStop(0.5, 'transparent');
                    shimmerGrad.addColorStop(1, 'rgba(0, 255, 255, 0.05)');
                    ctx.fillStyle = shimmerGrad;
                    ctx.fill();

                    // Glass reflection
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                    ctx.beginPath();
                    ctx.moveTo(corners[0].x, corners[0].y);
                    ctx.lineTo(corners[1].x, corners[1].y);
                    ctx.lineTo(corners[2].x, corners[2].y);
                    ctx.fill();
                    
                    // Depth Shading Overlay
                    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(depthFactor * 0.15, 0.5)})`;
                    ctx.beginPath();
                    ctx.moveTo(corners[0].x, corners[0].y);
                    ctx.lineTo(corners[1].x, corners[1].y);
                    ctx.lineTo(corners[2].x, corners[2].y);
                    ctx.lineTo(corners[3].x, corners[3].y);
                    ctx.fill();
                }
            });

            group.add(panelShape);

            // Frame lines
            const frameThickness = 2 * scale;
            group.add(new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[1].x, corners[1].y],
                stroke: '#cbd5e1', // Light top highlight
                strokeWidth: frameThickness,
                lineCap: 'square'
            }));
            group.add(new Konva.Line({
                points: [corners[1].x, corners[1].y, corners[2].x, corners[2].y],
                stroke: '#94a3b8',
                strokeWidth: frameThickness,
                lineCap: 'square'
            }));
            group.add(new Konva.Line({
                points: [corners[2].x, corners[2].y, corners[3].x, corners[3].y],
                stroke: '#334155', // Dark bottom shadow
                strokeWidth: frameThickness,
                lineCap: 'square'
            }));
            group.add(new Konva.Line({
                points: [corners[3].x, corners[3].y, corners[0].x, corners[0].y],
                stroke: '#64748b',
                strokeWidth: frameThickness,
                lineCap: 'square'
            }));

            // Corner Bevel Details
            corners.forEach((pt, idx) => {
                const nextPt = corners[(idx + 1) % 4];
                const dx = (nextPt.x - pt.x) * 0.05;
                const dy = (nextPt.y - pt.y) * 0.05;
                group.add(new Konva.Line({
                    points: [pt.x, pt.y, pt.x + dx, pt.y + dy],
                    stroke: '#000000',
                    strokeWidth: 1 * scale,
                    opacity: 0.5
                }));
            });

            // Mid Clamps (visual detail)
            if (panel.col > 0) { // left side clamp
                const midL1 = this._interpolateOnPanel(corners, 0, 0.2);
                const midL2 = this._interpolateOnPanel(corners, 0, 0.8);
                [midL1, midL2].forEach(mpt => {
                    group.add(new Konva.Rect({
                        x: mpt.x - 4*scale,
                        y: mpt.y - 2*scale,
                        width: 8*scale,
                        height: 4*scale,
                        fill: '#c0c9d4',
                        rotation: Math.atan2(corners[3].y - corners[0].y, corners[3].x - corners[0].x) * 180 / Math.PI
                    }));
                });
            }

            // End Clamps (if it's an end panel, approximated here as col 0 or last, but we just draw them if they are edges visually)
            // Can be extended based on row data.

            // Double click to delete handler
            group.on('dblclick dbltap', () => {
                panel.deleted = true;
                // Redraw logic should be triggered outside, so we could fire an event or let parent handle it.
                // Assuming standard Konva events bubble up or handled by parent.
                group.fire('panel-deleted', { panel }, true);
            });

            // Make it interactive
            group.on('mouseenter', () => {
                document.body.style.cursor = 'pointer';
                const hl = new Konva.Line({
                    points: [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y],
                    closed: true,
                    stroke: '#38bdf8',
                    strokeWidth: 3 * scale,
                    name: 'hoverHighlight'
                });
                group.add(hl);
                group.getLayer().batchDraw();
            });

            group.on('mouseleave', () => {
                document.body.style.cursor = 'default';
                const hl = group.findOne('.hoverHighlight');
                if (hl) hl.destroy();
                group.getLayer().batchDraw();
            });

            solarArrayGroup.add(group);
        });
    }

    /**
     * Renders measurement annotations for the array
     */
    renderMeasurements(panelItems, config, measurementsLayer, state) {
        if (!measurementsLayer) return;
        measurementsLayer.destroyChildren();
        
        // This function would normally calculate the bounding box of the array and draw dimension lines.
        // Omitted complex bounding logic for brevity, but this is the structure.
        const scale = this._getScaleFactor();

        // Sample dimension rendering (Array Width)
        if (panelItems.length > 0) {
            const minX = Math.min(...panelItems.map(p => p.worldX));
            const maxX = Math.max(...panelItems.map(p => p.worldX + p.worldW));
            const minY = Math.min(...panelItems.map(p => p.worldY));
            
            const pt1 = this.perspectiveEngine.projectToScreen(minX, minY - 0.5, 0);
            const pt2 = this.perspectiveEngine.projectToScreen(maxX, minY - 0.5, 0);

            const line = new Konva.Line({
                points: [pt1.x, pt1.y, pt2.x, pt2.y],
                stroke: '#0ea5e9',
                strokeWidth: 2 * scale,
                dash: [4 * scale, 4 * scale]
            });

            const dist = Math.abs(maxX - minX).toFixed(1) + 'm';
            const text = new Konva.Text({
                x: (pt1.x + pt2.x)/2,
                y: (pt1.y + pt2.y)/2 - 15 * scale,
                text: dist,
                fontSize: 14 * scale,
                fill: '#0ea5e9',
                align: 'center'
            });
            text.offsetX(text.width() / 2);

            measurementsLayer.add(line);
            measurementsLayer.add(text);
        }
    }

    /**
     * Renders a compass on the stage (non-projected UI overlay)
     */
    renderCompass(config, layer, stageWidth, stageHeight) {
        if (!layer) return;
        layer.destroyChildren();

        const padding = 50;
        const cx = stageWidth - padding;
        const cy = padding;
        const radius = 30;

        const group = new Konva.Group({
            x: cx,
            y: cy
        });

        group.add(new Konva.Circle({
            x: 0,
            y: 0,
            radius: radius,
            fill: 'rgba(255, 255, 255, 0.8)',
            stroke: '#94a3b8',
            strokeWidth: 2
        }));

        const dirs = [
            { t: 'N', a: 0 },
            { t: 'E', a: 90 },
            { t: 'S', a: 180 },
            { t: 'W', a: 270 }
        ];

        dirs.forEach(d => {
            const rad = (d.a - 90) * Math.PI / 180;
            const text = new Konva.Text({
                x: Math.cos(rad) * (radius - 10),
                y: Math.sin(rad) * (radius - 10),
                text: d.t,
                fontSize: 12,
                fontStyle: 'bold',
                fill: d.t === 'N' ? '#ef4444' : '#334155',
                align: 'center',
                verticalAlign: 'middle'
            });
            text.offsetX(text.width() / 2);
            text.offsetY(text.height() / 2);
            group.add(text);
        });

        // Needle (pointing north)
        group.add(new Konva.Line({
            points: [0, 5, 0, -radius + 5],
            stroke: '#ef4444',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round'
        }));

        // Panel facing indicator
        const facingAzimuth = config.sunAzimuth || 180;
        const fRad = (facingAzimuth - 90) * Math.PI / 180;
        group.add(new Konva.Line({
            points: [0, 0, Math.cos(fRad) * radius * 1.2, Math.sin(fRad) * radius * 1.2],
            stroke: '#3b82f6',
            strokeWidth: 2,
            dash: [4, 4]
        }));

        layer.add(group);
    }

    /**
     * Bilinear interpolation on a quadrilateral.
     * @param {Array} corners - Array of 4 points {x, y} [FL, FR, RR, RL]
     * @param {Number} u - Normalized horizontal position (0 to 1)
     * @param {Number} v - Normalized vertical position (0 to 1)
     * @returns {Object} Interpolated {x, y} coordinate
     */
    _interpolateOnPanel(corners, u, v) {
        const topX = corners[0].x + (corners[1].x - corners[0].x) * u;
        const topY = corners[0].y + (corners[1].y - corners[0].y) * u;

        const botX = corners[3].x + (corners[2].x - corners[3].x) * u;
        const botY = corners[3].y + (corners[2].y - corners[3].y) * u;

        const x = topX + (botX - topX) * v;
        const y = topY + (botY - topY) * v;

        return { x, y };
    }

    /**
     * Gets the current scale factor of the stage for zoom-independent drawing
     * @returns {Number} Scale factor (1 / scaleX)
     */
    _getScaleFactor() {
        return 1 / (this.stage.scaleX() || 1);
    }

    /**
     * Darkens a hex color
     * @param {String} hex - Color hex
     * @param {Number} amount - Percentage to darken (0-1)
     * @returns {String} Adjusted hex color
     */
    _darkenColor(hex, amount) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        let [r, g, b] = [0, 2, 4].map(o => parseInt(hex.slice(o, o + 2), 16));
        r = Math.max(0, Math.floor(r * (1 - amount)));
        g = Math.max(0, Math.floor(g * (1 - amount)));
        b = Math.max(0, Math.floor(b * (1 - amount)));
        return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }

    /**
     * Lightens a hex color
     * @param {String} hex - Color hex
     * @param {Number} amount - Percentage to lighten (0-1)
     * @returns {String} Adjusted hex color
     */
    _lightenColor(hex, amount) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        let [r, g, b] = [0, 2, 4].map(o => parseInt(hex.slice(o, o + 2), 16));
        r = Math.min(255, Math.floor(r + (255 - r) * amount));
        g = Math.min(255, Math.floor(g + (255 - g) * amount));
        b = Math.min(255, Math.floor(b + (255 - b) * amount));
        return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }
}
