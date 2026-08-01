/**
 * AI Roof Detection Pipeline
 * Uses OpenCV.js and TensorFlow.js (DeepLab V3) to detect roof boundaries and obstacles.
 */

const RoofDetection = (function() {
    let cvReady = false;
    let tfReady = false;
    let deeplabModel = null;
    let isInitialized = false;
    let currentMats = []; // Track mats for cleanup

    function registerMat(mat) {
        if (mat) currentMats.push(mat);
        return mat;
    }

    /**
     * Initialize the detection engine.
     * @param {Function} onProgress - Callback for progress updates
     * @returns {Promise<{opencvReady: boolean, modelLoaded: boolean}>}
     */
    async function initDetectionEngine(onProgress = () => {}) {
        if (isInitialized) {
            return { opencvReady: cvReady, modelLoaded: tfReady && deeplabModel !== null };
        }

        onProgress(1, "Checking OpenCV.js", 10);
        
        // Poll for cv
        cvReady = await checkOpenCVReady();
        if (cvReady) {
            onProgress(2, "OpenCV.js is ready", 40);
        } else {
            onProgress(2, "OpenCV.js not available, will use fallback", 40);
        }

        onProgress(3, "Checking TensorFlow.js and DeepLab", 50);
        tfReady = typeof tf !== 'undefined' && typeof deeplab !== 'undefined';
        
        if (tfReady) {
            try {
                onProgress(4, "Loading DeepLab V3 Model", 70);
                deeplabModel = await deeplab.load({base: 'pascal', quantizationBytes: 2});
                onProgress(5, "DeepLab V3 Model Loaded", 100);
            } catch (e) {
                console.error("Failed to load DeepLab model:", e);
                deeplabModel = null;
                onProgress(5, "Failed to load model, will use fallback", 100);
            }
        } else {
            onProgress(5, "TFJS/DeepLab not available, will use fallback", 100);
        }

        isInitialized = true;
        return { opencvReady: cvReady, modelLoaded: deeplabModel !== null };
    }

    function checkOpenCVReady(timeout = 5000, interval = 100) {
        return new Promise(resolve => {
            if (typeof cv !== 'undefined' && cv.Mat) {
                resolve(true);
                return;
            }
            let timeElapsed = 0;
            const timer = setInterval(() => {
                timeElapsed += interval;
                if (typeof cv !== 'undefined' && cv.Mat) {
                    clearInterval(timer);
                    resolve(true);
                } else if (timeElapsed >= timeout) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, interval);
        });
    }

    async function yieldUI() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    // Step 1: preprocessImage
    function preprocessImage(imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        
        if (!cvReady) {
            return {
                canvas: canvas,
                width: canvas.width,
                height: canvas.height,
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
            };
        }

        const mat = registerMat(cv.imread(canvas));
        const gray = registerMat(new cv.Mat());
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
        
        const blurred = registerMat(new cv.Mat());
        const ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
        
        return { mat, gray: blurred, width: canvas.width, height: canvas.height, canvas };
    }

    // Step 2: detectEdges
    function detectEdges(preprocessed) {
        if (!cvReady) {
            return fallbackEdgeDetection(preprocessed);
        }
        
        const edges = registerMat(new cv.Mat());
        const { gray } = preprocessed;
        
        // Canny auto threshold using Otsu's method on the grayscale histogram
        const otsuThreshold = registerMat(new cv.Mat());
        const threshVal = cv.threshold(gray, otsuThreshold, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
        
        const lowerThreshold = 0.5 * threshVal;
        const upperThreshold = threshVal;
        
        cv.Canny(gray, edges, lowerThreshold, upperThreshold, 3, false);
        
        // Morphological closing to connect broken edges
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        const closedEdges = registerMat(new cv.Mat());
        cv.morphologyEx(edges, closedEdges, cv.MORPH_CLOSE, kernel);
        
        return { edgeMat: closedEdges };
    }

    function fallbackEdgeDetection(preprocessed) {
        const width = preprocessed.width;
        const height = preprocessed.height;
        const src = preprocessed.imageData.data;
        const edgeCanvas = document.createElement('canvas');
        edgeCanvas.width = width;
        edgeCanvas.height = height;
        const ctx = edgeCanvas.getContext('2d');
        const edgeImgData = ctx.createImageData(width, height);
        const dst = edgeImgData.data;

        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        // grayscale
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const r = src[i * 4];
            const g = src[i * 4 + 1];
            const b = src[i * 4 + 2];
            gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let pixelX = 0;
                let pixelY = 0;

                for (let j = -1; j <= 1; j++) {
                    for (let i = -1; i <= 1; i++) {
                        const idx = ((y + j) * width + (x + i));
                        const weightX = sobelX[(j + 1) * 3 + (i + 1)];
                        const weightY = sobelY[(j + 1) * 3 + (i + 1)];
                        pixelX += gray[idx] * weightX;
                        pixelY += gray[idx] * weightY;
                    }
                }
                const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
                const outIdx = (y * width + x) * 4;
                const val = magnitude > 100 ? 255 : 0;
                dst[outIdx] = val;
                dst[outIdx + 1] = val;
                dst[outIdx + 2] = val;
                dst[outIdx + 3] = 255;
            }
        }
        ctx.putImageData(edgeImgData, 0, 0);
        return { edgeCanvas };
    }

    // Step 3: segmentRoof
    async function segmentRoof(imageElement) {
        if (deeplabModel) {
            try {
                const segmentation = await deeplabModel.segment(imageElement);
                return processSegmentation(segmentation, imageElement.width, imageElement.height);
            } catch(e) {
                console.error("Segmentation failed", e);
                return fallbackSegmentation(imageElement);
            }
        } else {
            return fallbackSegmentation(imageElement);
        }
    }

    function processSegmentation(segmentation, width, height) {
        const segCanvas = document.createElement('canvas');
        segCanvas.width = width;
        segCanvas.height = height;
        const ctx = segCanvas.getContext('2d');
        const imgData = ctx.createImageData(width, height);
        
        const data = segmentation.segmentationMap;
        for (let i = 0; i < data.length; i++) {
            // Simplified: we just take non-background / non-sky as 'foreground'
            const val = data[i] > 0 ? 255 : 0;
            const idx = i * 4;
            imgData.data[idx] = val;
            imgData.data[idx + 1] = val;
            imgData.data[idx + 2] = val;
            imgData.data[idx + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        
        if (cvReady) {
            const segMat = registerMat(cv.imread(segCanvas));
            const gray = registerMat(new cv.Mat());
            cv.cvtColor(segMat, gray, cv.COLOR_RGBA2GRAY, 0);
            
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
            const dilated = registerMat(new cv.Mat());
            cv.morphologyEx(gray, dilated, cv.MORPH_DILATE, kernel);
            
            const eroded = registerMat(new cv.Mat());
            cv.morphologyEx(dilated, eroded, cv.MORPH_ERODE, kernel);
            
            return { segMat: eroded, segCanvas };
        }
        
        return { segCanvas };
    }

    function fallbackSegmentation(imageElement) {
        // Color-based segmentation (detect sky vs roof vs ground)
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        const maskData = maskCtx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // sky detection heuristic: blue > green, blue > red, overall brightness high
            const isSky = (b > r * 1.2 && b > g * 1.1 && b > 100);
            // also consider top portion as sky could be improved here, but color heuristic is okay
            const val = isSky ? 0 : 255;
            maskData.data[i] = val;
            maskData.data[i+1] = val;
            maskData.data[i+2] = val;
            maskData.data[i+3] = 255;
        }
        maskCtx.putImageData(maskData, 0, 0);
        
        if (cvReady) {
            const mat = registerMat(cv.imread(maskCanvas));
            const gray = registerMat(new cv.Mat());
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
            return { segMat: gray, segCanvas: maskCanvas };
        }
        return { segCanvas: maskCanvas };
    }

    // Step 4: combineMasks
    function combineMasks(edgeData, segData) {
        if (!cvReady) {
            return { combinedCanvas: segData.segCanvas || edgeData.edgeCanvas };
        }
        
        const edgeMat = edgeData.edgeMat;
        const segMat = segData.segMat;
        
        const combined = registerMat(new cv.Mat());
        cv.bitwise_and(edgeMat, segMat, combined);
        
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        const dilated = registerMat(new cv.Mat());
        cv.dilate(combined, dilated, kernel);
        
        return { combinedMat: dilated };
    }

    // Step 5: extractContours
    function extractContours(combinedData, width, height, maxContourPoints) {
        let roofPolygon = [];
        let obstacles = [];
        
        if (!cvReady) {
            // Fallback: Just return a bounding box
            roofPolygon = [
                {x: width * 0.1, y: height * 0.1},
                {x: width * 0.9, y: height * 0.1},
                {x: width * 0.9, y: height * 0.9},
                {x: width * 0.1, y: height * 0.9}
            ];
            return { roofPolygon, obstacles };
        }
        
        const combinedMat = combinedData.combinedMat || combinedData.edgeMat || combinedData.segMat;
        if (!combinedMat) {
            return { roofPolygon, obstacles };
        }

        const contours = new cv.MatVector();
        const hierarchy = registerMat(new cv.Mat());
        
        cv.findContours(combinedMat, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
        
        let largestArea = 0;
        let largestIndex = -1;
        
        const minRoofArea = width * height * 0.05;
        const minObstacleArea = width * height * 0.005;

        let allContours = [];
        for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);
            const area = cv.contourArea(cnt);
            if (area > minObstacleArea) {
                allContours.push({ index: i, area: area, cnt: cnt });
                if (area > largestArea && area > minRoofArea) {
                    largestArea = area;
                    largestIndex = i;
                }
            } else {
                cnt.delete();
            }
        }
        
        if (largestIndex !== -1) {
            const mainRoof = allContours.find(c => c.index === largestIndex).cnt;
            
            // simplify main roof
            let epsilon = 0.02 * cv.arcLength(mainRoof, true);
            let approx = registerMat(new cv.Mat());
            cv.approxPolyDP(mainRoof, approx, epsilon, true);
            
            while (approx.rows > maxContourPoints && epsilon < 0.1 * cv.arcLength(mainRoof, true)) {
                epsilon += 0.01 * cv.arcLength(mainRoof, true);
                approx.delete();
                approx = registerMat(new cv.Mat());
                cv.approxPolyDP(mainRoof, approx, epsilon, true);
            }
            
            if (approx.rows < 3) {
                approx.delete();
                approx = registerMat(new cv.Mat());
                cv.convexHull(mainRoof, approx);
            }
            
            for (let i = 0; i < approx.rows; i++) {
                roofPolygon.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
            }
            
            // Extract obstacles
            for (let c of allContours) {
                if (c.index !== largestIndex) {
                    let obsPoly = registerMat(new cv.Mat());
                    cv.approxPolyDP(c.cnt, obsPoly, 0.02 * cv.arcLength(c.cnt, true), true);
                    let obsPoints = [];
                    for (let i = 0; i < obsPoly.rows; i++) {
                        obsPoints.push({ x: obsPoly.data32S[i * 2], y: obsPoly.data32S[i * 2 + 1] });
                    }
                    
                    if (obsPoints.length >= 3) {
                        const rect = cv.boundingRect(obsPoly);
                        const aspect = rect.width / rect.height;
                        let type = 'unknown';
                        let label = 'Unknown';
                        
                        if (aspect > 0.8 && aspect < 1.2 && c.area < minRoofArea * 0.1) {
                            type = 'water_tank';
                            label = 'Water Tank';
                        } else if (c.area > minRoofArea * 0.1) {
                            type = 'staircase';
                            label = 'Staircase Room';
                        } else if (c.area < minObstacleArea * 2) {
                            type = 'vent';
                            label = 'Vent Pipe';
                        } else if (rect.x < width * 0.1 || rect.x + rect.width > width * 0.9) {
                            type = 'parapet';
                            label = 'Parapet Wall';
                        } else {
                            type = 'chimney';
                            label = 'Chimney';
                        }
                        
                        obstacles.push({
                            id: 'obs_' + Math.random().toString(36).substr(2, 9),
                            type: type,
                            polygon: obsPoints,
                            bounds: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
                            label: label
                        });
                    }
                }
                c.cnt.delete(); // cleanup
            }
        }
        
        contours.delete();
        return { roofPolygon, obstacles };
    }

    // Step 6: estimateRoofOrientation
    function estimateRoofOrientation(roofPolygon, width, height) {
        if (roofPolygon.length < 2) return 'unknown';
        
        let longestEdge = { p1: null, p2: null, length: 0, dx: 0, dy: 0 };
        for (let i = 0; i < roofPolygon.length; i++) {
            const p1 = roofPolygon[i];
            const p2 = roofPolygon[(i + 1) % roofPolygon.length];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx*dx + dy*dy);
            if (length > longestEdge.length) {
                longestEdge = { p1, p2, length, dx, dy };
            }
        }
        
        if (longestEdge.length === 0) return 'unknown';
        
        let angle = Math.atan2(longestEdge.dy, longestEdge.dx) * 180 / Math.PI;
        if (angle < 0) angle += 180;
        
        // Simple heuristic: 
        // 0-45 or 135-180 -> roughly horizontal -> North/South facing
        // 45-135 -> roughly vertical -> East/West facing
        if (angle > 45 && angle < 135) {
            return 'east';
        } else {
            return 'south'; 
        }
    }

    /**
     * Main detection function to process the image and extract roof and obstacle properties.
     * @param {HTMLImageElement} imageElement 
     * @param {Object} options 
     */
    async function detectRoofFromImage(imageElement, options = {}) {
        const startTime = performance.now();
        const {
            onProgress = () => {},
            maxContourPoints = 12,
            minConfidence = 0.3
        } = options;
        
        let roofPolygon = [];
        let obstacles = [];
        let roofOrientation = 'unknown';
        let confidence = 0.0;
        
        try {
            onProgress(1, "Preprocessing Image", 10);
            const preprocessed = preprocessImage(imageElement);
            await yieldUI();
            
            onProgress(2, "Detecting Edges", 30);
            const edgeData = detectEdges(preprocessed);
            await yieldUI();
            
            onProgress(3, "Segmenting Roof Area", 50);
            const segData = await segmentRoof(imageElement);
            await yieldUI();
            
            onProgress(4, "Combining Masks", 70);
            const combinedData = combineMasks(edgeData, segData);
            await yieldUI();
            
            onProgress(5, "Extracting Contours", 90);
            const contourData = extractContours(combinedData, preprocessed.width, preprocessed.height, maxContourPoints);
            roofPolygon = contourData.roofPolygon;
            obstacles = contourData.obstacles;
            await yieldUI();
            
            onProgress(6, "Estimating Orientation", 95);
            roofOrientation = estimateRoofOrientation(roofPolygon, preprocessed.width, preprocessed.height);
            
            // Calculate confidence
            confidence = roofPolygon.length >= 3 ? (cvReady && tfReady ? 0.9 : 0.6) : 0.1;
            if (confidence < minConfidence) {
                console.warn("Confidence below minimum threshold");
            }
            
            const processingTimeMs = performance.now() - startTime;
            onProgress(7, "Detection Complete", 100);
            
            return {
                roofPolygon,
                obstacles,
                roofOrientation,
                confidence,
                processingTimeMs,
                debugData: {
                    edgeMask: null,
                    segmentationMask: null
                }
            };
        } catch (error) {
            console.error("Error during detection:", error);
            throw error;
        } finally {
            cleanupDetection();
        }
    }

    /**
     * Frees all allocated memory in OpenCV.js for this run.
     */
    function cleanupDetection() {
        currentMats.forEach(mat => {
            if (mat && typeof mat.delete === 'function' && !mat.isDeleted()) {
                try {
                    mat.delete();
                } catch(e) {}
            }
        });
        currentMats = [];
    }

    return {
        initDetectionEngine,
        detectRoofFromImage,
        cleanupDetection
    };
})();

// Export globally
if (typeof window !== 'undefined') {
    window.RoofDetection = RoofDetection;
}
