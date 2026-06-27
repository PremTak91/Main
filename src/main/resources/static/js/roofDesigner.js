// Roof Layout Designer Workspace Management
let canvas, ctx;
let backgroundImage = null;
let hasPanelArray = false;

// Solar Array State
let arrayState = {
    x: 0,
    y: 0,
    scale: 1.0,
    rotate: 0, // In radians
    tilt: 0,   // Skew angle in radians
    cols: 4,
    rows: 2,
    panelWidth: 35, // Render dimensions
    panelHeight: 65,
    spacing: 3
};

// Drag State
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

$(document).ready(function() {
    canvas = document.getElementById('designCanvas');
    ctx = canvas.getContext('2d');

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

    // Canvas Mouse listeners for dragging the array
    canvas.addEventListener('mousedown', startDragging);
    canvas.addEventListener('mousemove', dragArray);
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);

    // Touch events for mobile compatibility
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    });
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
            // Set canvas size matching the image dimensions
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;
            
            // Set initial position of panels array to the center of canvas
            arrayState.x = canvas.width / 2;
            arrayState.y = canvas.height / 2;

            // Reset scale if image is exceptionally large or small
            if (canvas.width > 2000) {
                arrayState.scale = 2.0;
                $('#panelScale').val(2.0);
            } else {
                arrayState.scale = 1.0;
                $('#panelScale').val(1.0);
            }

            // Adjust interface
            $('#uploadPlaceholder').hide();
            $('#designCanvas').show();
            $('#addArrayBtn').show();
            $('#controlsCard').show();
            $('#exportBtn').show();
            
            draw();
            hideLoader();
            showToast('Roof image loaded successfully. Click "Add Solar Panel Array" to design.', 'success');
        };
        backgroundImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function draw() {
    if (!backgroundImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw panel array overlay
    if (hasPanelArray) {
        drawPanelArray();
    }
}

function drawPanelArray() {
    ctx.save();
    
    // Move to center of array
    ctx.translate(arrayState.x, arrayState.y);
    
    // Apply Rotation
    ctx.rotate(arrayState.rotate);
    
    // Apply Perspective Skew (Tilt)
    // Horizontal skew factor is tan(tilt)
    ctx.transform(1, 0, Math.tan(arrayState.tilt), 1, 0, 0);
    
    // Apply Scale
    ctx.scale(arrayState.scale, arrayState.scale);

    const totalWidth = arrayState.cols * (arrayState.panelWidth + arrayState.spacing) - arrayState.spacing;
    const totalHeight = arrayState.rows * (arrayState.panelHeight + arrayState.spacing) - arrayState.spacing;
    
    // Offset translation to draw grid centered on (x, y)
    ctx.translate(-totalWidth / 2, -totalHeight / 2);

    for (let r = 0; r < arrayState.rows; r++) {
        for (let c = 0; c < arrayState.cols; c++) {
            const px = c * (arrayState.panelWidth + arrayState.spacing);
            const py = r * (arrayState.panelHeight + arrayState.spacing);

            // Draw solar panel glass (deep translucent blue)
            ctx.fillStyle = 'rgba(10, 35, 66, 0.85)';
            ctx.fillRect(px, py, arrayState.panelWidth, arrayState.panelHeight);

            // Draw panel frame (silver/aluminum border)
            ctx.strokeStyle = 'rgba(180, 190, 200, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px, py, arrayState.panelWidth, arrayState.panelHeight);

            // Draw silicon wafer micro-cell grids inside panel for realism
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            
            // Vertical grids
            const midX = px + arrayState.panelWidth / 2;
            ctx.beginPath();
            ctx.moveTo(midX, py);
            ctx.lineTo(midX, py + arrayState.panelHeight);
            ctx.stroke();

            // Horizontal grids
            const steps = 4;
            for (let i = 1; i < steps; i++) {
                const gy = py + (arrayState.panelHeight / steps) * i;
                ctx.beginPath();
                ctx.moveTo(px, gy);
                ctx.lineTo(px + arrayState.panelWidth, gy);
                ctx.stroke();
            }
        }
    }

    ctx.restore();
}

// Drag functionality
function startDragging(e) {
    if (!hasPanelArray) return;
    
    const mousePos = getMousePos(e);
    
    // We assume the mouse is within the array boundary roughly
    // For simplicity, we allow dragging from anywhere on the canvas
    isDragging = true;
    startDragX = mousePos.x - arrayState.x;
    startDragY = mousePos.y - arrayState.y;
}

function dragArray(e) {
    if (!isDragging) return;
    
    const mousePos = getMousePos(e);
    arrayState.x = mousePos.x - startDragX;
    arrayState.y = mousePos.y - startDragY;
    
    draw();
}

function stopDragging() {
    isDragging = false;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    // Translate client coordinates relative to scaled canvas display boundaries
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Sliders and controls updates
function updateSliders() {
    arrayState.scale = parseFloat($('#panelScale').val());
    $('#scaleVal').text(arrayState.scale.toFixed(1));

    const rotateDeg = parseInt($('#panelRotate').val());
    arrayState.rotate = (rotateDeg * Math.PI) / 180;
    $('#rotateVal').text(rotateDeg + '°');

    const tiltDeg = parseInt($('#panelTilt').val());
    arrayState.tilt = (tiltDeg * Math.PI) / 180;
    $('#tiltVal').text(tiltDeg + '°');

    draw();
}

function rebuildArray() {
    arrayState.cols = parseInt($('#gridCols').val()) || 1;
    arrayState.rows = parseInt($('#gridRows').val()) || 1;
    
    draw();
    updateCalculations();
}

function addPanelArray() {
    hasPanelArray = true;
    $('#addArrayBtn').hide();
    $('#removeArrayBtn').show();
    draw();
    updateCalculations();
    showToast('Solar panel array added. Use sliders to rotate, scale, and align.', 'success');
}

function removePanelArray() {
    hasPanelArray = false;
    $('#removeArrayBtn').hide();
    $('#addArrayBtn').show();
    draw();
    updateCalculations();
}

function resetLayout() {
    if (!backgroundImage) return;
    
    hasPanelArray = false;
    arrayState.cols = 4;
    arrayState.rows = 2;
    arrayState.scale = 1.0;
    arrayState.rotate = 0;
    arrayState.tilt = 0;
    arrayState.x = canvas.width / 2;
    arrayState.y = canvas.height / 2;

    // Reset controls
    $('#gridCols').val(4);
    $('#gridRows').val(2);
    $('#panelScale').val(1.0);
    $('#scaleVal').text('1.0');
    $('#panelRotate').val(0);
    $('#rotateVal').text('0°');
    $('#panelTilt').val(0);
    $('#tiltVal').text('0°');
    
    $('#removeArrayBtn').hide();
    $('#addArrayBtn').show();

    draw();
    updateCalculations();
    showToast('Layout parameters reset.', 'info');
}

function updateCalculations() {
    if (!hasPanelArray) {
        $('#metricCapacity').text('0.0 kW');
        $('#metricCount').text('0');
        $('#metricArea').text('0.0 m²');
        $('#metricGeneration').text('0 kWh/m');
        return;
    }

    const panelCount = arrayState.cols * arrayState.rows;
    const panelWatts = parseInt($('#panelWattage').val());
    const capacityKw = (panelCount * panelWatts) / 1000;
    
    // Average space required per panel is 2.2 sq meters
    const areaSqM = panelCount * 2.2;
    
    // Generation formula: capacity * 4 peak sun hours * 30 days * 0.8 efficiency factor
    const monthlyKwh = Math.round(capacityKw * 4 * 30 * 0.8);

    $('#metricCapacity').text(capacityKw.toFixed(1) + ' kW');
    $('#metricCount').text(panelCount);
    $('#metricArea').text(areaSqM.toFixed(1) + ' m²');
    $('#metricGeneration').text(monthlyKwh + ' kWh');
}

function exportProposal() {
    if (!backgroundImage) return;

    showLoader();
    setTimeout(() => {
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `Solar_Roof_Proposal_${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
            hideLoader();
            showToast('Design proposal image generated and downloaded successfully.', 'success');
        } catch (e) {
            hideLoader();
            showToast('Export failed due to browser security restrictions on cross-origin images.', 'error');
            console.error(e);
        }
    }, 500);
}
