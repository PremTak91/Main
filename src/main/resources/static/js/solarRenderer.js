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
    renderFullArray(panelsData, config, layers) {
        const { shadowsLayer, structureLayer, solarArrayGroup } = layers;

        if (shadowsLayer) shadowsLayer.destroyChildren();
        if (structureLayer) structureLayer.destroyChildren();
        if (solarArrayGroup) solarArrayGroup.destroyChildren();

        // Check if panelsData has the full geometry attached
        let panelItems = [];
        let geometry = null;
        if (panelsData.items && panelsData._geometry) {
            panelItems = panelsData.items;
            geometry = panelsData._geometry;
        } else {
            // Fallback for older interface
            panelItems = Array.isArray(panelsData) ? panelsData : (panelsData.items || []);
        }

        const activePanels = panelItems.filter(p => !p.deleted && p.valid !== false);
        if (activePanels.length === 0) return;

        if (config.showShadows !== false && shadowsLayer) {
            this.renderShadows(activePanels, config, shadowsLayer);
        }

        if (config.showStructure !== false && structureLayer) {
            this.renderStructure(geometry, config, structureLayer);
        }

        if (solarArrayGroup) {
            this.renderPanels(activePanels, config, solarArrayGroup);
        }
    }

    /**
     * Projects shadow of panels onto the roof
     */
    renderShadows(panelItems, config, shadowsLayer) {
        const sunAzimuth = config.sunAzimuth !== undefined ? config.sunAzimuth : 220;
        const sunElevation = config.sunElevation !== undefined ? config.sunElevation : 45;

        panelItems.forEach(panel => {
            if (!panel.corners || panel.corners.length < 4) return;
            
            const shadowPoints = panel.corners.map(pt => 
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
            panel.corners.forEach(pos => {
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
     * Renders mounting structure using exact geometry
     */
    renderStructure(geometry, config, structureLayer) {
        if (!geometry || !geometry.supports || !geometry.rails) return;
        const scale = this._getScaleFactor();

        // 1. Render Supports (Posts)
        geometry.supports.forEach((support, i) => {
            const pt = {
                x: support.position.x, 
                y: support.position.y, 
                zTop: support.topHeight
            };

            const legBaseZ = support.baseHeight || 0;

            // Base plate at the bottom of the leg
            const bSize = 0.15;
            const bRect = { x: pt.x - bSize/2, y: pt.y - bSize/2, w: bSize, h: bSize };
            const bQuad = this.perspectiveEngine.transformQuadToRoof(bRect, legBaseZ);
            
            const flatBQuad = bQuad.reduce((acc, q) => { acc.push(q.x, q.y); return acc; }, []);
            
            if (config.mountType === 'RCC-Ballast') {
                // Draw concrete block top face
                const bQuadTop = this.perspectiveEngine.transformQuadToRoof(bRect, legBaseZ + 0.15);
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

            // Leg - from base (bottom) to panel corner (top)
            const bot = this.perspectiveEngine.projectToScreen(pt.x, pt.y, legBaseZ);
            const top = this.perspectiveEngine.projectToScreen(pt.x, pt.y, support.topHeight);
            
            structureLayer.add(new Konva.Line({
                points: [bot.x, bot.y, top.x, top.y],
                stroke: support.type === 'front' ? '#94a3b8' : '#78879e',
                strokeWidth: 3.5 * scale,
                lineCap: 'round'
            }));
        });

        // 2. Render Rails
        geometry.rails.forEach(rail => {
            const pt1 = this.perspectiveEngine.projectToScreen(rail.start.x, rail.start.y, rail.start.z);
            const pt2 = this.perspectiveEngine.projectToScreen(rail.end.x, rail.end.y, rail.end.z);

            structureLayer.add(new Konva.Line({
                points: [pt1.x, pt1.y, pt2.x, pt2.y],
                stroke: '#64748b',
                strokeWidth: rail.type === 'main' ? (5 * scale) : (4 * scale),
                lineCap: 'round'
            }));
        });
    }

    /**
     * Renders photorealistic PV panels
     */
    renderPanels(panelItems, config, solarArrayGroup) {
        const scale = this._getScaleFactor();

        panelItems.forEach(panel => {
            if (!panel.corners || panel.corners.length < 4) return;
            
            // Screen corners for the panel face
            const corners = [
                this.perspectiveEngine.projectToScreen(panel.corners[0].x, panel.corners[0].y, panel.corners[0].z), // FL
                this.perspectiveEngine.projectToScreen(panel.corners[1].x, panel.corners[1].y, panel.corners[1].z), // FR
                this.perspectiveEngine.projectToScreen(panel.corners[2].x, panel.corners[2].y, panel.corners[2].z), // RR
                this.perspectiveEngine.projectToScreen(panel.corners[3].x, panel.corners[3].y, panel.corners[3].z)  // RL
            ];

            const depthFactor = this.perspectiveEngine.getDepthFactor(panel.corners[0].x, panel.corners[0].y);
            const group = new Konva.Group();

            // 3D Frame Edge (Thickness) to prevent flat billboard look
            const th = 8 * scale; // Pixel thickness
            
            // Bottom Lip
            group.add(new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[0].x, corners[0].y + th, corners[1].x, corners[1].y + th, corners[1].x, corners[1].y],
                fill: '#1e293b',
                closed: true
            }));
            
            // Left Lip
            group.add(new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[0].x, corners[0].y + th, corners[3].x, corners[3].y + th, corners[3].x, corners[3].y],
                fill: '#0f172a',
                closed: true
            }));

            // Panel Body using standard Konva.Line (guarantees hit detection and rendering)
            const panelPoly = new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y],
                fillLinearGradientStartPoint: { x: corners[0].x, y: corners[0].y },
                fillLinearGradientEndPoint: { x: corners[2].x, y: corners[2].y },
                fillLinearGradientColorStops: [0, '#0f1d3a', 0.5, '#13284f', 1, '#081023'],
                closed: true
            });
            group.add(panelPoly);

            // Grid lines (Cell layout)
            const cols = 6;
            const rows = 12;

            for (let i = 1; i < cols; i++) {
                const pt1 = this._interpolateOnPanel(corners, i/cols, 0);
                const pt2 = this._interpolateOnPanel(corners, i/cols, 1);
                group.add(new Konva.Line({
                    points: [pt1.x, pt1.y, pt2.x, pt2.y],
                    stroke: 'rgba(255, 255, 255, 0.12)',
                    strokeWidth: 1 * scale
                }));
            }

            for (let j = 1; j < rows; j++) {
                const pt1 = this._interpolateOnPanel(corners, 0, j/rows);
                const pt2 = this._interpolateOnPanel(corners, 1, j/rows);
                group.add(new Konva.Line({
                    points: [pt1.x, pt1.y, pt2.x, pt2.y],
                    stroke: 'rgba(255, 255, 255, 0.12)',
                    strokeWidth: 1 * scale
                }));
            }

            // Busbars
            [0.25, 0.5, 0.75].forEach(v => {
                const pt1 = this._interpolateOnPanel(corners, 0, v);
                const pt2 = this._interpolateOnPanel(corners, 1, v);
                group.add(new Konva.Line({
                    points: [pt1.x, pt1.y, pt2.x, pt2.y],
                    stroke: 'rgba(192, 192, 192, 0.15)',
                    strokeWidth: 2 * scale
                }));
            });

            // Anti-reflective coating / shimmer
            group.add(new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y],
                fillLinearGradientStartPoint: { x: corners[1].x, y: corners[1].y },
                fillLinearGradientEndPoint: { x: corners[3].x, y: corners[3].y },
                fillLinearGradientColorStops: [0, 'rgba(128, 0, 128, 0.05)', 0.5, 'transparent', 1, 'rgba(0, 255, 255, 0.05)'],
                closed: true
            }));

            // Depth Shading Overlay
            group.add(new Konva.Line({
                points: [corners[0].x, corners[0].y, corners[1].x, corners[1].y, corners[2].x, corners[2].y, corners[3].x, corners[3].y],
                fill: `rgba(0, 0, 0, ${Math.min(depthFactor * 0.15, 0.5)})`,
                closed: true
            }));

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
