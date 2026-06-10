function(instance, properties) {

    // =====================================================
    // 1. BASIC SETTINGS
    // =====================================================

    var elementId = properties.element_id;
    var hideScrollbar = properties.hide_scrollbar;
    var showMiniMap = properties.show_minimap;
    var miniMapColor = properties.minimap_color || "#006cff";

    // Optional field. Create this as yes/no if you want.
    var showEdgeIndicators = properties.show_edge_indicators !== false;

    var a = document.querySelector("#" + elementId);

    if (!a) {
        console.error("Elemento com ID " + elementId + " não encontrado.");
        return;
    }

    if (instance.data.initialized && instance.data.currentElementId === elementId) {
        return;
    }

    instance.data.initialized = true;
    instance.data.currentElementId = elementId;

    a.style.cursor = "move";


    // =====================================================
    // 2. HIDE NATIVE SCROLLBAR
    // =====================================================

    if (hideScrollbar) {
        if (!document.getElementById("hide-scrollbar-" + elementId)) {
            var style = document.createElement("style");
            style.id = "hide-scrollbar-" + elementId;
            style.innerHTML = `
                #${elementId}.RepeatingGroup::-webkit-scrollbar {
                    display: none;
                }

                #${elementId} {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
            `;
            document.head.appendChild(style);
        }
    }


    // =====================================================
    // 3. DRAG TO SCROLL ON REPEATING GROUP
    // =====================================================

    var isDragging = false;
    var startX = 0;
    var scrollStart = 0;

    a.addEventListener("mousedown", function(e) {
        isDragging = true;
        startX = e.pageX - a.offsetLeft;
        scrollStart = a.scrollLeft;
        a.style.cursor = "move";
        document.body.style.userSelect = "none";
    });

    a.addEventListener("mousemove", function(e) {
        if (!isDragging) return;

        e.preventDefault();

        var x = e.pageX - a.offsetLeft;
        var movement = x - startX;

        a.scrollLeft = scrollStart - movement;

        updateMiniMap();
        updateEdgeIndicators();
    });

    a.addEventListener("mouseleave", function() {
        isDragging = false;
        a.style.cursor = "move";
        document.body.style.userSelect = "auto";
    });

    document.addEventListener("mouseup", function() {
        isDragging = false;
        a.style.cursor = "move";
        document.body.style.userSelect = "auto";
    });


    // =====================================================
    // 4. PREPARE PARENT CONTAINER
    // =====================================================

    var parent = a.parentNode;

    if (getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
    }


    // =====================================================
    // 5. EDGE INDICATORS / SCROLL SHADOWS
    // =====================================================

    var oldLeftIndicator = document.getElementById("kanban-left-indicator-" + elementId);
    var oldRightIndicator = document.getElementById("kanban-right-indicator-" + elementId);
    
    var edgeIndicatorColor = properties.edge_indicator_color || "#000000";
    var edgeIndicatorOpacity = properties.edge_indicator_opacity || 0.14;

    if (oldLeftIndicator) oldLeftIndicator.remove();
    if (oldRightIndicator) oldRightIndicator.remove();

    var leftIndicator = document.createElement("div");
    leftIndicator.id = "kanban-left-indicator-" + elementId;

    leftIndicator.style.position = "absolute";
    leftIndicator.style.left = "0";
    leftIndicator.style.top = "0";
    leftIndicator.style.bottom = hideScrollbar ? "0" : "16px";
    leftIndicator.style.width = "32px";
    leftIndicator.style.zIndex = "9998";
    leftIndicator.style.pointerEvents = "none";
    leftIndicator.style.opacity = "0";
    leftIndicator.style.transition = "opacity 180ms ease";
    leftIndicator.style.display = "block";
    leftIndicator.style.background =
      "linear-gradient(to right, " +
      hexToRgba(edgeIndicatorColor, edgeIndicatorOpacity) +
      ", rgba(0,0,0,0))";

    var rightIndicator = document.createElement("div");
    rightIndicator.id = "kanban-right-indicator-" + elementId;

    rightIndicator.style.position = "absolute";
    rightIndicator.style.right = "0";
    rightIndicator.style.top = "0";
    rightIndicator.style.bottom = hideScrollbar ? "0" : "16px";
    rightIndicator.style.width = "32px";
    rightIndicator.style.zIndex = "9998";
    rightIndicator.style.pointerEvents = "none";
    rightIndicator.style.opacity = "0";
    rightIndicator.style.transition = "opacity 180ms ease";
    rightIndicator.style.display = "block";
    rightIndicator.style.background =
      "linear-gradient(to left, " +
      hexToRgba(edgeIndicatorColor, edgeIndicatorOpacity) +
      ", rgba(0,0,0,0))";

    if (showEdgeIndicators) {
        parent.appendChild(leftIndicator);
        parent.appendChild(rightIndicator);
    }

    function updateEdgeIndicators() {
        if (!showEdgeIndicators) return;

        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;
        var scrollLeft = a.scrollLeft;

        if (!totalWidth || !visibleWidth || totalWidth <= visibleWidth + 2) {
            leftIndicator.style.opacity = "0";
            rightIndicator.style.opacity = "0";
            return;
        }

        var hasHiddenLeft = scrollLeft > 2;
        var hasHiddenRight = scrollLeft + visibleWidth < totalWidth - 2;

        leftIndicator.style.opacity = hasHiddenLeft ? "1" : "0";
        rightIndicator.style.opacity = hasHiddenRight ? "1" : "0";
    }


    // =====================================================
    // 6. MINIMAP VISIBILITY CONTROL
    // =====================================================

    var oldWrapper = document.getElementById("kanban-minimap-wrapper-" + elementId);

    if (oldWrapper) {
        oldWrapper.remove();
    }

    if (showMiniMap === false) {
        updateEdgeIndicators();

        a.addEventListener("scroll", updateEdgeIndicators);

        setTimeout(updateEdgeIndicators, 100);
        setTimeout(updateEdgeIndicators, 500);
        setTimeout(updateEdgeIndicators, 1000);

        return;
    }


    // =====================================================
    // 7. MINIMAP WRAPPER
    // =====================================================

    var wrapper = document.createElement("div");
    wrapper.id = "kanban-minimap-wrapper-" + elementId;

    wrapper.style.width = "112px";
    wrapper.style.height = "48px";
    wrapper.style.padding = "5px";
    wrapper.style.border = "1px solid #ececec";
    wrapper.style.borderRadius = "6px";
    wrapper.style.background = "#fff";
    wrapper.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
    wrapper.style.position = "absolute";
    wrapper.style.right = "24px";
    wrapper.style.bottom = hideScrollbar ? "12px" : "28px";
    wrapper.style.zIndex = "9999";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxSizing = "border-box";
    wrapper.style.cursor = "default";
    wrapper.style.opacity = "0.75";

    wrapper.addEventListener("mouseenter", function() {
        wrapper.style.opacity = "1";
    });

    wrapper.addEventListener("mouseleave", function() {
        wrapper.style.opacity = "0.75";
    });


    // =====================================================
    // 8. MINIMAP COLUMNS BACKGROUND
    // =====================================================

    var columnsLayer = document.createElement("div");

    columnsLayer.style.position = "absolute";
    columnsLayer.style.left = "5px";
    columnsLayer.style.right = "5px";
    columnsLayer.style.top = "5px";
    columnsLayer.style.bottom = "5px";
    columnsLayer.style.display = "flex";
    columnsLayer.style.gap = "2px";
    columnsLayer.style.pointerEvents = "none";


    // =====================================================
    // 9. COLOR HELPER
    // =====================================================

    function hexToRgba(hex, opacity) {
        hex = String(hex || "#006cff").replace("#", "");

        if (hex.length === 3) {
            hex = hex.split("").map(function(char) {
                return char + char;
            }).join("");
        }

        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return "rgba(0,108,255," + opacity + ")";
        }

        return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    }
    
    function hexToRgba(hex, opacity) {
        hex = String(hex || "#000000").replace("#", "");

        if (hex.length === 3) {
            hex = hex.split("").map(function(char) {
                return char + char;
            }).join("");
        }

        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return "rgba(0,0,0," + opacity + ")";
        }

        return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    }


    // =====================================================
    // 10. MINIMAP CURRENT VIEWPORT
    // =====================================================

    var viewport = document.createElement("div");

    viewport.style.position = "absolute";
    viewport.style.top = "5px";
    viewport.style.height = "calc(100% - 10px)";
    viewport.style.border = "2px solid " + miniMapColor;
    viewport.style.borderRadius = "3px";
    viewport.style.background = hexToRgba(miniMapColor, 0.05);
    viewport.style.boxSizing = "border-box";
    viewport.style.cursor = "move";

    wrapper.appendChild(columnsLayer);
    wrapper.appendChild(viewport);
    parent.appendChild(wrapper);


    // =====================================================
    // 11. RENDER MINIMAP COLUMNS
    // =====================================================

    function renderColumns() {
        columnsLayer.innerHTML = "";

        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;

        if (!totalWidth || !visibleWidth) return;

        var estimatedColumns = Math.max(1, Math.round(totalWidth / visibleWidth * 4));

        for (var i = 0; i < estimatedColumns; i++) {
            var col = document.createElement("div");
            col.style.flex = "1";
            col.style.borderLeft = "1px solid #e1e1e1";
            columnsLayer.appendChild(col);
        }
    }


    // =====================================================
    // 12. UPDATE MINIMAP POSITION
    // =====================================================

    function updateMiniMap() {
        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;

        if (!totalWidth || !visibleWidth || totalWidth <= visibleWidth + 2) {
            wrapper.style.display = "none";
            return;
        }

        wrapper.style.display = "block";

        var scrollLeft = a.scrollLeft;
        var horizontalPadding = 10;
        var mapWidth = wrapper.clientWidth - horizontalPadding;

        var ratioVisible = visibleWidth / totalWidth;
        var viewportWidth = Math.max(18, mapWidth * ratioVisible);

        var maxScroll = totalWidth - visibleWidth;
        var maxViewportLeft = mapWidth - viewportWidth;

        var viewportLeft = maxScroll > 0
            ? (scrollLeft / maxScroll) * maxViewportLeft
            : 0;

        viewport.style.width = viewportWidth + "px";
        viewport.style.left = (viewportLeft + 5) + "px";
    }


    // =====================================================
    // 13. REFRESH ALL VISUAL HELPERS
    // =====================================================

    function refreshAll() {
        renderColumns();
        updateMiniMap();
        updateEdgeIndicators();
    }

    a.addEventListener("scroll", function() {
        updateMiniMap();
        updateEdgeIndicators();
    });

    window.addEventListener("resize", refreshAll);

    setTimeout(refreshAll, 100);
    setTimeout(refreshAll, 500);
    setTimeout(refreshAll, 1000);

    if (window.ResizeObserver) {
        var observer = new ResizeObserver(refreshAll);

        observer.observe(a);

        if (a.parentElement) {
            observer.observe(a.parentElement);
        }
    }

    refreshAll();


    // =====================================================
    // 14. DRAG MINIMAP BLUE AREA
    // =====================================================

    var draggingMiniMap = false;
    var miniStartX = 0;
    var miniStartLeft = 0;

    viewport.addEventListener("mousedown", function(e) {
        draggingMiniMap = true;
        miniStartX = e.clientX;
        miniStartLeft = parseFloat(viewport.style.left) || 5;
        viewport.style.cursor = "move";

        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener("mousemove", function(e) {
        if (!draggingMiniMap) return;

        var delta = e.clientX - miniStartX;

        var horizontalPadding = 10;
        var mapWidth = wrapper.clientWidth - horizontalPadding;
        var viewportWidth = viewport.offsetWidth;
        var maxLeft = mapWidth - viewportWidth;

        var newLeft = Math.max(0, Math.min(maxLeft, miniStartLeft - 5 + delta));

        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;
        var maxScroll = totalWidth - visibleWidth;

        var ratio = maxLeft > 0 ? newLeft / maxLeft : 0;

        a.scrollLeft = maxScroll * ratio;

        updateMiniMap();
        updateEdgeIndicators();
    });

    document.addEventListener("mouseup", function() {
        draggingMiniMap = false;
        viewport.style.cursor = "move";
    });
}