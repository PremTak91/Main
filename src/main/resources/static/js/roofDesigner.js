// AI Roof Layout Designer - 3D Visualizer & Spring Data Binding
let backgroundImage = null;
let hasPanelArray = false;

// Solar Array State
let arrayState = {
    x: 0,
    y: 0,
    scale: 1.0,
    rotate: 0, // In degrees
    tilt: 0,   // Skew angle in degrees
    cols: 5,
    rows: 2,
    panelWidth: 42, // Display dimensions (px)
    panelHeight: 78,
    spacing: 4,
    showStructure: true,
    structureHeight: 1.2, // Front leg height (meters)
    selectedCapacity: 5 // kW
};

// Drag State
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

$(document).ready(function() {
    // Drag and Drop handlers
    const workspace = document.getElementById('workspaceContainer');
    
    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
        workspace.classList.add('dragover');
    });

    workspace.addEventListener('dragleave', () => {
        workspace.classList.remove('dragover');
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        workspace.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    // Make Panel Grid Wrapper Draggable
    const gridWrapper = document.getElementById('panelGridWrapper');
    gridWrapper.addEventListener('mousedown', startDragging);
    window.addEventListener('mousemove', dragArray);
    window.addEventListener('mouseup', stopDragging);

    // Touch support
    gridWrapper.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            startDragging(e.touches[0]);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0] && isDragging) {
            dragArray(e.touches[0]);
        }
    }, { passive: true });

    window.addEventListener('touchend', stopDragging);
});

function triggerImageUpload() {
    document.getElementById('roofImageUpload').click();
}

function loadRoofImage(event) {
    if (event.target.files && event.target.files[0]) {
        handleImageFile(event.target.files[0]);
    }
}

function handleImageFile(file) {
    showLoader();
    const reader = new FileReader();
    reader.onload = function(e) {
        backgroundImage = new Image();
        backgroundImage.onload = function() {
            const container = document.getElementById("workspaceContainer");
            const wrapper = document.getElementById("designWrapper");
            const bgImg = document.getElementById("roofBgImage");

            // Match design wrapper sizes to the containing screen frame
            const targetWidth = container.clientWidth - 16;
            let imgWidth = backgroundImage.width;
            let imgHeight = backgroundImage.height;
            let ratio = targetWidth / imgWidth;

            // Set wrapper box width and height to wrap the aspect ratio exactly
            wrapper.style.width = targetWidth + "px";
            wrapper.style.height = (imgHeight * ratio) + "px";
            
            // Set image source
            bgImg.src = backgroundImage.src;

            // Align wrapper height
            container.style.height = wrapper.style.height;
            container.style.minHeight = "auto";
            container.style.border = "none";

            // Initialize panel positions
            arrayState.x = parseFloat(wrapper.style.width) / 2;
            arrayState.y = parseFloat(wrapper.style.height) / 2;
            arrayState.scale = 1.0;
            $('#panelScale').val(1.0);
            $('#panelRotate').val(0);
            $('#panelTilt').val(0);

            // Hide placeholder and show designer layer
            $('#uploadPlaceholder').hide();
            $('#designWrapper').show();
            $('#exportBtn').show();

            // Trigger AI sweep scanner
            triggerAiScan();
            hideLoader();
        };
        backgroundImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function triggerAiScan() {
    const overlay = document.getElementById('scanningOverlay');
    const laser = document.getElementById('laserLine');
    const progressBar = document.getElementById('scanProgressBar');
    const progressText = document.getElementById('scanProgressText');
    
    overlay.style.setProperty('display', 'flex', 'important');
    laser.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 4;
        progressBar.style.width = progress + '%';
        progressText.innerText = `Detecting boundaries & shadow vectors... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                overlay.style.setProperty('display', 'none', 'important');
                laser.style.display = 'none';
                
                // Initialize default specs
                hasPanelArray = true;
                $('#addArrayBtn').hide();
                $('#removeArrayBtn').show();
                $('#controlsCard').show();
                $('#overviewCard').show();
                $('#summaryCard').show();
                $('#shadowCard').show();
                $('#selectorCard').show();
                
                // Force capacity selector default to 5 kW
                selectCapacityOption(5);
                showToast('AI Surface analysis completed successfully.', 'success');
            }, 300);
        }
    }, 80);
}

// Calculate the transformed corner coordinates of panel grid inside parent space
function getTransformedCorners() {
    const totalWidth = arrayState.cols * (arrayState.panelWidth + arrayState.spacing) - arrayState.spacing;
    const totalHeight = arrayState.rows * (arrayState.panelHeight + arrayState.spacing) - arrayState.spacing;
    
    const halfW = (totalWidth / 2) * arrayState.scale;
    const halfH = (totalHeight / 2) * arrayState.scale;
    
    // Coordinates relative to array center
    const local = [
        { x: -halfW, y: -halfH }, // TL (0)
        { x: halfW, y: -halfH },  // TR (1)
        { x: -halfW, y: halfH },  // BL (2)
        { x: halfW, y: halfH }    // BR (3)
    ];
    
    const radRotate = (arrayState.rotate * Math.PI) / 180;
    const radTilt = (arrayState.tilt * Math.PI) / 180;
    const cos = Math.cos(radRotate);
    const sin = Math.sin(radRotate);
    const tanSkew = Math.tan(radTilt);
    
    return local.map(pt => {
        // Skew (Perspective Tilt)
        let kx = pt.x + pt.y * tanSkew;
        let ky = pt.y;
        
        // Rotate
        let rx = kx * cos - ky * sin;
        let ry = kx * sin + ky * cos;
        
        // Translate to array center
        return {
            x: rx + arrayState.x,
            y: ry + arrayState.y
        };
    });
}

function updateSliders() {
    arrayState.scale = parseFloat($('#panelScale').val());
    $('#scaleVal').text(arrayState.scale.toFixed(1));

    arrayState.rotate = parseInt($('#panelRotate').val());
    $('#rotateVal').text(arrayState.rotate + '°');

    arrayState.tilt = parseInt($('#panelTilt').val());
    $('#tiltVal').text(arrayState.tilt + '°');

    arrayState.structureHeight = parseFloat($('#structureHeight').val());
    $('#heightVal').text(arrayState.structureHeight.toFixed(1) + 'm');

    drawUI();
    updateCalculations();
}

function updateDirection() {
    drawUI();
    updateCalculations();
}

function toggleStructure() {
    arrayState.showStructure = document.getElementById("showStructure").checked;
    drawUI();
}

function updateWorkspaceZoom() {
    const zoom = $('#workspaceZoom').val();
    const wrapper = document.getElementById("designWrapper");
    
    if (zoom === "fit") {
        wrapper.style.transform = "none";
        wrapper.style.transformOrigin = "top left";
    } else {
        const factor = parseFloat(zoom);
        wrapper.style.transform = `scale(${factor})`;
        wrapper.style.transformOrigin = "top left";
    }
}

// Drag Handlers
function startDragging(e) {
    if (!hasPanelArray) return;
    isDragging = true;
    startDragX = e.clientX - arrayState.x;
    startDragY = e.clientY - arrayState.y;
}

function dragArray(e) {
    if (!isDragging) return;
    arrayState.x = e.clientX - startDragX;
    arrayState.y = e.clientY - startDragY;
    
    // Bounds check to keep within wrapper
    const wrapper = document.getElementById("designWrapper");
    const maxW = parseFloat(wrapper.style.width);
    const maxH = parseFloat(wrapper.style.height);
    
    arrayState.x = Math.max(10, Math.min(maxW - 10, arrayState.x));
    arrayState.y = Math.max(10, Math.min(maxH - 10, arrayState.y));

    drawUI();
}

function stopDragging() {
    isDragging = false;
}

// Draw dynamic SVG dimension helpers
function drawSvgDimensionLine(p1, p2, offset, text, color) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return "";
    
    let nx = -dy / len;
    let ny = dx / len;
    
    let op1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
    let op2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
    
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Draw tick extensions and main dimension line
    let code = `
        <path d="M ${p1.x + nx * (offset * 0.15)} ${p1.y + ny * (offset * 0.15)} L ${op1.x + nx * 3} ${op1.y + ny * 3} 
                 M ${p2.x + nx * (offset * 0.15)} ${p2.y + ny * (offset * 0.15)} L ${op2.x + nx * 3} ${op2.y + ny * 3} 
                 M ${op1.x} ${op1.y} L ${op2.x} ${op2.y}" 
              stroke="${color}" stroke-width="1.5" />
    `;
    
    // Arrowheads
    code += drawSvgArrowhead(op1, angle + 180, color);
    code += drawSvgArrowhead(op2, angle, color);
    
    // Centered label card
    let mx = (op1.x + op2.x) / 2;
    let my = (op1.y + op2.y) / 2;
    
    code += `
        <rect x="${mx - 45}" y="${my - 8}" width="90" height="16" fill="rgba(15, 23, 42, 0.9)" stroke="#475569" stroke-width="0.8" rx="3" />
        <text x="${mx}" y="${my + 3}" fill="${color}" font-size="10" font-weight="bold" text-anchor="middle" font-family="sans-serif">${text}</text>
    `;
    return code;
}

function drawSvgArrowhead(pt, angleDeg, color) {
    return `
        <g transform="translate(${pt.x}, ${pt.y}) rotate(${angleDeg})">
            <path d="M 0 0 L -6 -3 L -6 3 Z" fill="${color}" />
        </g>
    `;
}

function drawSvgCompass(x, y, direction) {
    let size = 20;
    let angle = 0;
    if (direction === "South") angle = 90;
    else if (direction === "North") angle = -90;
    else if (direction === "East") angle = 0;
    else if (direction === "West") angle = 180;
    
    return `
        <g transform="translate(${x}, ${y})">
            <!-- Compass Dial Card -->
            <circle cx="0" cy="0" r="${size}" fill="rgba(15, 23, 42, 0.85)" stroke="#ffb300" stroke-width="1.8" />
            <text x="0" y="-${size - 5}" fill="#cbd5e1" font-size="7" font-weight="bold" text-anchor="middle">N</text>
            <text x="0" y="${size - 2}" fill="#cbd5e1" font-size="7" font-weight="bold" text-anchor="middle">S</text>
            <text x="${size - 5}" y="2.5" fill="#cbd5e1" font-size="7" font-weight="bold" text-anchor="middle">E</text>
            <text x="-${size - 5}" y="2.5" fill="#cbd5e1" font-size="7" font-weight="bold" text-anchor="middle">W</text>
            <g transform="rotate(${angle})">
                <path d="M ${size - 6} 0 L 0 -3 L 0 3 Z" fill="#d9534f" />
                <path d="M -${size - 6} 0 L 0 -3 L 0 3 Z" fill="#cbd5e1" />
            </g>
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
            
            <rect x="${size + 6}" y="-8" width="90" height="16" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="0.8" rx="3" />
            <text x="${size + 12}" y="3" fill="#ffb300" font-size="9" font-weight="bold" font-family="sans-serif">${direction.toUpperCase()} FACING</text>
        </g>
    `;
}

// Regenerates the 3D panel grid and updates the SVG structural lines/dimension overlays
function drawUI() {
    if (!backgroundImage || !hasPanelArray) {
        $('#panelGridWrapper').hide();
        $('#annotationSvg').hide();
        return;
    }

    const grid = document.getElementById('panelGridWrapper');
    const svg = document.getElementById('annotationSvg');
    const wrapper = document.getElementById('designWrapper');
    
    // 1. Rebuild HTML 3D Panels inside wrapper
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${arrayState.cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${arrayState.rows}, 1fr)`;
    grid.style.gap = `${arrayState.spacing}px`;

    const totalWidth = arrayState.cols * (arrayState.panelWidth + arrayState.spacing) - arrayState.spacing;
    const totalHeight = arrayState.rows * (arrayState.panelHeight + arrayState.spacing) - arrayState.spacing;

    grid.style.width = totalWidth + "px";
    grid.style.height = totalHeight + "px";
    grid.style.left = (arrayState.x - totalWidth / 2) + "px";
    grid.style.top = (arrayState.y - totalHeight / 2) + "px";
    
    // Apply 3D CSS Transformations
    grid.style.transform = `rotate(${arrayState.rotate}deg) skewX(${arrayState.tilt}deg) scale(${arrayState.scale})`;

    // Populate panels
    grid.innerHTML = "";
    const panelCount = arrayState.cols * arrayState.rows;
    for (let i = 0; i < panelCount; i++) {
        const panel = document.createElement('div');
        panel.className = "solar-panel-3d";
        panel.style.width = arrayState.panelWidth + "px";
        panel.style.height = arrayState.panelHeight + "px";
        
        // Wafer grid lines inside solar panel
        const wafer = document.createElement('div');
        wafer.className = "solar-panel-wafer";
        for (let j = 0; j < 8; j++) {
            wafer.appendChild(document.createElement('div'));
        }
        panel.appendChild(wafer);
        grid.appendChild(panel);
    }

    // 2. Draw SVG Structure Legs & Connector lines
    svg.style.display = 'block';
    svg.innerHTML = "";

    if (arrayState.showStructure) {
        const corners = getTransformedCorners();
        const legFront = arrayState.structureHeight * 40 * arrayState.scale;
        const legBack = (arrayState.structureHeight + 0.6) * 40 * arrayState.scale;

        // Front feet coordinates
        const fBL = { x: corners[2].x, y: corners[2].y + legFront };
        const fBR = { x: corners[3].x, y: corners[3].y + legFront };
        // Back feet coordinates
        const fTL = { x: corners[0].x, y: corners[0].y + legBack };
        const fTR = { x: corners[1].x, y: corners[1].y + legBack };

        let svgContent = "";

        // Leg drawing paths (Thick structural steel)
        svgContent += `<path d="M ${corners[0].x} ${corners[0].y} L ${fTL.x} ${fTL.y}" stroke="#94a3b8" stroke-width="${3 * arrayState.scale}" />`;
        svgContent += `<path d="M ${corners[1].x} ${corners[1].y} L ${fTR.x} ${fTR.y}" stroke="#94a3b8" stroke-width="${3 * arrayState.scale}" />`;
        svgContent += `<path d="M ${corners[2].x} ${corners[2].y} L ${fBL.x} ${fBL.y}" stroke="#94a3b8" stroke-width="${3 * arrayState.scale}" />`;
        svgContent += `<path d="M ${corners[3].x} ${corners[3].y} L ${fBR.x} ${fBR.y}" stroke="#94a3b8" stroke-width="${3 * arrayState.scale}" />`;

        // Cross bracing pipes connecting the feet
        svgContent += `<path d="M ${fTL.x} ${fTL.y} L ${fTR.x} ${fTR.y} M ${fBL.x} ${fBL.y} L ${fBR.x} ${fBR.y} M ${fTL.x} ${fTL.y} L ${fBL.x} ${fBL.y} M ${fTR.x} ${fTR.y} L ${fBR.x} ${fBR.y}" stroke="#64748b" stroke-width="${2.2 * arrayState.scale}" />`;

        // Concrete footings
        const footW = 14 * arrayState.scale;
        const footH = 7 * arrayState.scale;
        [fTL, fTR, fBL, fBR].forEach(foot => {
            svgContent += `<rect x="${foot.x - footW/2}" y="${foot.y - footH/2}" width="${footW}" height="${footH}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8" rx="2" />`;
        });

        // 3. Draw Clean SVG Dimension Lines (Not hiding the structure)
        const frontHeightM = arrayState.structureHeight.toFixed(1) + " m";
        const backHeightM = (arrayState.structureHeight + 0.6).toFixed(1) + " m";
        const widthM = (arrayState.cols * 1.1).toFixed(1) + " m";

        // Front Leg Height (drawn next to Front Left Leg, offset left)
        svgContent += drawSvgDimensionLine(corners[2], fBL, -20 * arrayState.scale, `Leg H: ${frontHeightM}`, "#3b82f6");

        // Back Leg Height (drawn next to Back Left Leg, offset left)
        svgContent += drawSvgDimensionLine(corners[0], fTL, -25 * arrayState.scale, `Back H: ${backHeightM}`, "#3b82f6");

        // Width / Base Pipe Spacing (drawn below front feet)
        svgContent += drawSvgDimensionLine(fBL, fBR, 25 * arrayState.scale, `Width: ${widthM}`, "#eab308");

        // 4. Draw Compass Dial in the top-right corner, out of the way!
        const wrapperW = parseFloat(wrapper.style.width) || 800;
        const compassX = wrapperW - 130;
        const compassY = 35;
        const direction = $('#panelDirection').val() || "South";
        svgContent += drawSvgCompass(compassX, compassY, direction);

        svg.innerHTML = svgContent;
    }
}

function selectCapacityOption(kw) {
    arrayState.selectedCapacity = kw;
    
    $('.capacity-option-card').removeClass('active');
    
    if (kw === 3) {
        arrayState.cols = 3;
        arrayState.rows = 2;
        $('#opt3kW').addClass('active');
    } else if (kw === 5) {
        arrayState.cols = 5;
        arrayState.rows = 2;
        $('#opt5kW').addClass('active');
    } else if (kw === 7.5) {
        arrayState.cols = 7;
        arrayState.rows = 2;
        $('#opt7kW').addClass('active');
    }

    drawUI();
    updateCalculations();
}

function addPanelArray() {
    hasPanelArray = true;
    $('#addArrayBtn').hide();
    $('#removeArrayBtn').show();
    drawUI();
    updateCalculations();
}

function removePanelArray() {
    hasPanelArray = false;
    $('#removeArrayBtn').hide();
    $('#addArrayBtn').show();
    drawUI();
    updateCalculations();
}

function resetLayout() {
    if (!backgroundImage) return;
    
    const container = document.getElementById("workspaceContainer");
    container.style.border = "2px dashed #334155";
    container.style.height = "75vh";
    container.style.minHeight = "600px";
    
    hasPanelArray = false;
    arrayState.cols = 5;
    arrayState.rows = 2;
    arrayState.scale = 1.0;
    arrayState.rotate = 0;
    arrayState.tilt = 0;
    arrayState.showStructure = true;
    arrayState.structureHeight = 1.2;
    arrayState.x = parseFloat(container.clientWidth) / 2;
    arrayState.y = 400; // default height middle

    // Reset controls
    $('#panelScale').val(1.0);
    $('#scaleVal').text('1.0');
    $('#panelRotate').val(0);
    $('#rotateVal').text('0°');
    $('#panelTilt').val(0);
    $('#tiltVal').text('0°');
    $('#showStructure').prop('checked', true);
    $('#structureHeight').val(1.2);
    $('#heightVal').text('1.2m');
    $('#panelDirection').val('South');
    
    $('#removeArrayBtn').hide();
    $('#addArrayBtn').show();

    selectCapacityOption(5);
    
    drawUI();
    updateCalculations();
    showToast('Layout parameters reset.', 'info');
}

function updateCalculations() {
    if (!hasPanelArray) {
        return;
    }

    const panelCount = arrayState.cols * arrayState.rows;
    const panelWatts = 550; // Wp Half-Cut standard
    const capacityKw = (panelCount * panelWatts) / 1000;
    
    const dailyKwh = Math.round(capacityKw * 4 * 0.9);
    const monthlyKwh = Math.round(capacityKw * 4 * 30 * 0.85);

    // Update Sidebar summaries
    $('#viewCapacity').text(capacityKw + " kW");
    $('#viewDaily').text(`~${dailyKwh}-${dailyKwh + 4} kWh`);
    $('#viewMonthly').text(`~${monthlyKwh}-${monthlyKwh + 120} kWh`);
    $('#viewPanels').text(panelCount + " Panels");
    
    const frontH = arrayState.structureHeight.toFixed(1) + " m";
    const backH = (arrayState.structureHeight + 0.6) * 40 * arrayState.scale; // wait, label in meters
    const backHM = (arrayState.structureHeight + 0.6).toFixed(1) + " m";
    $('#viewHeight').text(`${frontH} (Front) / ${backHM} (Back)`);

    const facingText = ($('#panelDirection').val() || "South") + " Facing";
    $('#viewPlacement').text(facingText);

    const tiltDeg = Math.round(parseFloat($('#panelTilt').val())) + 18;
    $('#viewTilt').text(`${tiltDeg}° (Optimum)`);
    
    // Fit suitable options
    if (capacityKw <= 3) {
        $('#viewSuitable').text("Small Homes, Shops");
    } else if (capacityKw <= 5) {
        $('#viewSuitable').text("Homes, Small Offices");
    } else {
        $('#viewSuitable').text("Medium Offices, Large Homes");
    }
}

// REST Dynamic JSON data binding client call
function saveDesignToServer() {
    if (!backgroundImage || !hasPanelArray) {
        showToast("Please load a roof image and place panel grids first.", "warning");
        return;
    }

    showLoader();
    
    const payload = {
        cols: arrayState.cols,
        rows: arrayState.rows,
        scale: arrayState.scale,
        rotate: arrayState.rotate,
        tilt: arrayState.tilt,
        structureHeight: arrayState.structureHeight,
        capacityKw: (arrayState.cols * arrayState.rows * 550) / 1000,
        direction: $('#panelDirection').val() || "South"
    };

    $.ajax({
        url: '/roof-designer/save',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function(response) {
            hideLoader();
            if (response.success) {
                showToast(response.message, 'success');
            } else {
                showToast(response.message || 'Saving failed.', 'error');
            }
        },
        error: function(xhr, status, error) {
            hideLoader();
            showToast('Connection to server failed. Design not saved.', 'error');
            console.error(error);
        }
    });
}

// Helper for drawing dimension line on high-res export canvas
function drawCanvasDimensionLine(ctx, p1, p2, offset, text, color, scaleFactor) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return;
    
    let nx = -dy / len;
    let ny = dx / len;
    
    let op1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
    let op2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.8 * scaleFactor;
    
    // Draw tick marks
    ctx.beginPath();
    ctx.moveTo(p1.x + nx * (offset * 0.15), p1.y + ny * (offset * 0.15));
    ctx.lineTo(op1.x + nx * (3 * scaleFactor), op1.y + ny * (3 * scaleFactor));
    ctx.moveTo(p2.x + nx * (offset * 0.15), p2.y + ny * (offset * 0.15));
    ctx.lineTo(op2.x + nx * (3 * scaleFactor), op2.y + ny * (3 * scaleFactor));
    ctx.stroke();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(op1.x, op1.y);
    ctx.lineTo(op2.x, op2.y);
    ctx.stroke();
    
    // Draw small arrowheads
    drawCanvasArrowhead(ctx, op1, Math.atan2(dy, dx) + Math.PI, 6 * scaleFactor);
    drawCanvasArrowhead(ctx, op2, Math.atan2(dy, dx), 6 * scaleFactor);
    
    // Draw text box
    let mx = (op1.x + op2.x) / 2;
    let my = (op1.y + op2.y) / 2;
    let fontSize = Math.max(10, Math.round(9.5 * scaleFactor));
    ctx.font = 'bold ' + fontSize + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let textW = ctx.measureText(text).width + (8 * scaleFactor);
    let textH = fontSize + (4 * scaleFactor);
    
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(mx - textW/2, my - textH/2, textW, textH);
    ctx.strokeRect(mx - textW/2, my - textH/2, textW, textH);
    
    ctx.fillStyle = color;
    ctx.fillText(text, mx, my);
    ctx.restore();
}

function drawCanvasArrowhead(ctx, pt, angle, size) {
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size/2);
    ctx.lineTo(-size, size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawCanvasCompass(ctx, x, y, direction, scaleFactor) {
    ctx.save();
    ctx.translate(x, y);
    
    let size = 20 * scaleFactor;
    let angle = 0;
    if (direction === "South") angle = Math.PI / 2;
    else if (direction === "North") angle = -Math.PI / 2;
    else if (direction === "East") angle = 0;
    else if (direction === "West") angle = Math.PI;

    // Draw Dial
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 1.8 * scaleFactor;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();

    // Cardinals
    ctx.fillStyle = '#cbd5e1';
    let fontSize = Math.max(8, Math.round(7.5 * scaleFactor));
    ctx.font = 'bold ' + fontSize + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("N", 0, -size + 5 * scaleFactor);
    ctx.fillText("S", 0, size - 5 * scaleFactor);
    ctx.fillText("E", size - 5 * scaleFactor, 0);
    ctx.fillText("W", -size + 5 * scaleFactor, 0);

    // Rotate needle
    ctx.rotate(angle);
    ctx.fillStyle = '#d9534f'; // Red
    ctx.beginPath();
    ctx.moveTo(size - 6 * scaleFactor, 0);
    ctx.lineTo(0, -3 * scaleFactor);
    ctx.lineTo(0, 3 * scaleFactor);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cbd5e1'; // Silver
    ctx.beginPath();
    ctx.moveTo(-size + 6 * scaleFactor, 0);
    ctx.lineTo(0, -3 * scaleFactor);
    ctx.lineTo(0, 3 * scaleFactor);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw Facing Text
    ctx.save();
    let textX = x + size + 6 * scaleFactor;
    let textY = y;
    ctx.font = 'bold ' + Math.max(9, Math.round(9 * scaleFactor)) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    let text = direction.toUpperCase() + " FACING";
    let textW = ctx.measureText(text).width + 8 * scaleFactor;
    let textH = 16 * scaleFactor;
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.8 * scaleFactor;
    ctx.fillRect(textX, textY - textH/2, textW, textH);
    ctx.strokeRect(textX, textY - textH/2, textW, textH);
    
    ctx.fillStyle = '#ffb300';
    ctx.fillText(text, textX + 4 * scaleFactor, textY);
    ctx.restore();
}

// Captures the entire custom rendering dynamically inside a high-res hidden canvas for download
function exportProposal() {
    if (!backgroundImage) return;

    showLoader();
    setTimeout(() => {
        try {
            const expCanvas = document.getElementById("hiddenExportCanvas");
            const expCtx = expCanvas.getContext("2d");

            // Set canvas size matching the background image exactly
            expCanvas.width = backgroundImage.width;
            expCanvas.height = backgroundImage.height;

            // Draw original roof image completely
            expCtx.drawImage(backgroundImage, 0, 0, expCanvas.width, expCanvas.height);

            // Add overlay dark filter (20%)
            expCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
            expCtx.fillRect(0, 0, expCanvas.width, expCanvas.height);

            if (hasPanelArray) {
                // Calculate rendering scaling factors
                const wrapper = document.getElementById("designWrapper");
                const scaleFactor = backgroundImage.width / parseFloat(wrapper.style.width);

                // Compute corner coordinates mapped to high-res image space
                const corners = getTransformedCorners().map(pt => ({
                    x: pt.x * scaleFactor,
                    y: pt.y * scaleFactor
                }));

                const legFront = arrayState.structureHeight * 40 * arrayState.scale * scaleFactor;
                const legBack = (arrayState.structureHeight + 0.6) * 40 * arrayState.scale * scaleFactor;

                const fBL = { x: corners[2].x, y: corners[2].y + legFront };
                const fBR = { x: corners[3].x, y: corners[3].y + legFront };
                const fTL = { x: corners[0].x, y: corners[0].y + legBack };
                const fTR = { x: corners[1].x, y: corners[1].y + legBack };

                // 1. Draw structure legs
                expCtx.strokeStyle = '#94a3b8';
                expCtx.lineWidth = 3 * arrayState.scale * scaleFactor;
                expCtx.lineCap = 'round';
                expCtx.lineJoin = 'round';

                expCtx.beginPath();
                expCtx.moveTo(corners[0].x, corners[0].y); expCtx.lineTo(fTL.x, fTL.y);
                expCtx.moveTo(corners[1].x, corners[1].y); expCtx.lineTo(fTR.x, fTR.y);
                expCtx.moveTo(corners[2].x, corners[2].y); expCtx.lineTo(fBL.x, fBL.y);
                expCtx.moveTo(corners[3].x, corners[3].y); expCtx.lineTo(fBR.x, fBR.y);
                expCtx.stroke();

                // Cross braces
                expCtx.strokeStyle = '#64748b';
                expCtx.lineWidth = 2.2 * arrayState.scale * scaleFactor;
                expCtx.beginPath();
                expCtx.moveTo(fTL.x, fTL.y); expCtx.lineTo(fTR.x, fTR.y);
                expCtx.moveTo(fBL.x, fBL.y); expCtx.lineTo(fBR.x, fBR.y);
                expCtx.moveTo(fTL.x, fTL.y); expCtx.lineTo(fBL.x, fBL.y);
                expCtx.moveTo(fTR.x, fTR.y); expCtx.lineTo(fBR.x, fBR.y);
                expCtx.stroke();

                // Concrete feet blocks
                expCtx.fillStyle = '#cbd5e1';
                expCtx.strokeStyle = '#94a3b8';
                expCtx.lineWidth = 0.8 * scaleFactor;
                const footW = 14 * arrayState.scale * scaleFactor;
                const footH = 7 * arrayState.scale * scaleFactor;
                [fTL, fTR, fBL, fBR].forEach(foot => {
                    expCtx.fillRect(foot.x - footW/2, foot.y - footH/2, footW, footH);
                    expCtx.strokeRect(foot.x - footW/2, foot.y - footH/2, footW, footH);
                });

                // 2. Draw 3D Solar panels using transformed path polygons
                expCtx.save();
                expCtx.translate(arrayState.x * scaleFactor, arrayState.y * scaleFactor);
                expCtx.rotate((arrayState.rotate * Math.PI) / 180);
                expCtx.transform(1, 0, Math.tan((arrayState.tilt * Math.PI) / 180), 1, 0, 0);
                expCtx.scale(arrayState.scale * scaleFactor, arrayState.scale * scaleFactor);

                const totalW = arrayState.cols * (arrayState.panelWidth + arrayState.spacing) - arrayState.spacing;
                const totalH = arrayState.rows * (arrayState.panelHeight + arrayState.spacing) - arrayState.spacing;
                expCtx.translate(-totalW / 2, -totalH / 2);

                for (let r = 0; r < arrayState.rows; r++) {
                    for (let c = 0; c < arrayState.cols; c++) {
                        const px = c * (arrayState.panelWidth + arrayState.spacing);
                        const py = r * (arrayState.panelHeight + arrayState.spacing);

                        // Gradient fill matching #173b67 -> #0b2145
                        let grad = expCtx.createLinearGradient(px, py, px + arrayState.panelWidth, py + arrayState.panelHeight);
                        grad.addColorStop(0, "#173b67");
                        grad.addColorStop(1, "#0b2145");
                        expCtx.fillStyle = grad;
                        expCtx.fillRect(px, py, arrayState.panelWidth, arrayState.panelHeight);

                        // Aluminum frame
                        expCtx.strokeStyle = '#475569';
                        expCtx.lineWidth = 1.2;
                        expCtx.strokeRect(px, py, arrayState.panelWidth, arrayState.panelHeight);

                        // Wafer lines
                        expCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                        expCtx.lineWidth = 0.5;
                        expCtx.beginPath();
                        expCtx.moveTo(px + arrayState.panelWidth/2, py);
                        expCtx.lineTo(px + arrayState.panelWidth/2, py + arrayState.panelHeight);
                        for (let j = 1; j < 4; j++) {
                            const gy = py + (arrayState.panelHeight / 4) * j;
                            expCtx.moveTo(px, gy);
                            expCtx.lineTo(px + arrayState.panelWidth, gy);
                        }
                        expCtx.stroke();
                    }
                }
                expCtx.restore();

                // 3. Draw top-left completed badge on high-res canvas
                expCtx.save();
                let lx = 20 * scaleFactor;
                let ly = 20 * scaleFactor;
                let boxW = 230 * scaleFactor;
                let boxH = 55 * scaleFactor;

                expCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                expCtx.strokeStyle = '#475569';
                expCtx.lineWidth = 1.5 * scaleFactor;
                expCtx.beginPath();
                expCtx.roundRect(lx, ly, boxW, boxH, 8 * scaleFactor);
                expCtx.fill();
                expCtx.stroke();

                expCtx.fillStyle = '#3b82f6';
                expCtx.beginPath();
                expCtx.roundRect(lx + 12 * scaleFactor, ly + 12 * scaleFactor, 31 * scaleFactor, 31 * scaleFactor, 4 * scaleFactor);
                expCtx.fill();

                expCtx.fillStyle = '#ffffff';
                expCtx.font = 'bold ' + Math.round(11 * scaleFactor) + 'px Arial';
                expCtx.fillText("AI SOLAR ROOF ANALYSIS", lx + 52 * scaleFactor, ly + 24 * scaleFactor);

                expCtx.fillStyle = '#22c55e';
                expCtx.beginPath();
                expCtx.arc(lx + 55 * scaleFactor, ly + 38 * scaleFactor, 3.5 * scaleFactor, 0, 2*Math.PI);
                expCtx.fill();

                expCtx.fillStyle = '#94a3b8';
                expCtx.font = Math.round(10 * scaleFactor) + 'px Arial';
                expCtx.fillText("Analysis Completed", lx + 64 * scaleFactor, ly + 41 * scaleFactor);
                expCtx.restore();

                // 4. Draw Vector Dimensions and Compass on high-res canvas
                const frontHeightM = arrayState.structureHeight.toFixed(1) + " m";
                const backHeightM = (arrayState.structureHeight + 0.6).toFixed(1) + " m";
                const widthM = (arrayState.cols * 1.1).toFixed(1) + " m";

                drawCanvasDimensionLine(expCtx, corners[2], fBL, -20 * arrayState.scale * scaleFactor, `Leg H: ${frontHeightM}`, "#3b82f6", scaleFactor);
                drawCanvasDimensionLine(expCtx, corners[0], fTL, -25 * arrayState.scale * scaleFactor, `Back H: ${backHeightM}`, "#3b82f6", scaleFactor);
                drawCanvasDimensionLine(expCtx, fBL, fBR, 25 * arrayState.scale * scaleFactor, `Width: ${widthM}`, "#eab308", scaleFactor);

                const compassX = expCanvas.width - 130 * scaleFactor;
                const compassY = 35 * scaleFactor;
                const direction = $('#panelDirection').val() || "South";
                drawCanvasCompass(expCtx, compassX, compassY, direction, scaleFactor);
            }

            // Export to download trigger
            const dataUrl = expCanvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `Tesla_Solar_Roof_Proposal_${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
            
            hideLoader();
            showToast('High-fidelity proposal downloaded successfully.', 'success');
        } catch (e) {
            hideLoader();
            showToast('Export failed due to cross-origin image policy.', 'error');
            console.error(e);
        }
    }, 500);
}
