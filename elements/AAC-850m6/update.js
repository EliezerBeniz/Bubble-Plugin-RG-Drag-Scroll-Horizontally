function(instance, properties) {
    var elementId = properties.element_id;
    var hideScrollbar = properties.hide_scrollbar;
    var showMiniMap = properties.show_minimap;
    var miniMapColor = properties.minimap_color || "#006cff";
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
    
    if (showMiniMap === false) {
        var existingMiniMap = document.getElementById("kanban-minimap-wrapper-" + elementId);
        if (existingMiniMap) {
            existingMiniMap.remove();
        }
        return;
    }

    // =========================
    // MINI MAP SCROLL
    // =========================

    var oldWrapper = document.getElementById("kanban-minimap-wrapper-" + elementId);
    if (oldWrapper) {
        oldWrapper.remove();
    }

    var wrapper = document.createElement("div");
    wrapper.id = "kanban-minimap-wrapper-" + elementId;

    wrapper.style.width = "110px";
    wrapper.style.height = "34px";
    wrapper.style.border = "1px solid #d9d9d9";
    wrapper.style.borderRadius = "6px";
    wrapper.style.background = "#fff";
    wrapper.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
    wrapper.style.position = "absolute";
    wrapper.style.right = "12px";
    wrapper.style.bottom = hideScrollbar ? "12px" : "32px";
    wrapper.style.zIndex = "9999";
    wrapper.style.overflow = "hidden";
    wrapper.style.cursor = "default";
    wrapper.style.pointerEvents = "auto";

    var columnsLayer = document.createElement("div");
    columnsLayer.style.position = "absolute";
    columnsLayer.style.left = "6px";
    columnsLayer.style.right = "6px";
    columnsLayer.style.top = "5px";
    columnsLayer.style.bottom = "5px";
    columnsLayer.style.display = "flex";
    columnsLayer.style.gap = "2px";

    function hexToRgba(hex, opacity) {
        hex = hex.replace("#", "");

        if (hex.length === 3) {
            hex = hex.split("").map(function(char) {
                return char + char;
            }).join("");
        }

        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    }

    var viewport = document.createElement("div");
    viewport.style.position = "absolute";
    viewport.style.top = "4px";
    viewport.style.height = "24px";
    viewport.style.border = "2px solid " + miniMapColor;
    viewport.style.borderRadius = "3px";
    viewport.style.background = hexToRgba(miniMapColor, 0.05);
    viewport.style.boxSizing = "border-box";
    viewport.style.cursor = "move";

    wrapper.appendChild(columnsLayer);
    wrapper.appendChild(viewport);

    var parent = a.parentNode;

    if (getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
    }

    parent.appendChild(wrapper);

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

    function updateMiniMap() {
        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;

        if (!totalWidth || !visibleWidth || totalWidth <= visibleWidth + 2) {
            wrapper.style.display = "none";
            return;
        }

        wrapper.style.display = "block";

        var scrollLeft = a.scrollLeft;
        var mapWidth = wrapper.clientWidth;

        var ratioVisible = visibleWidth / totalWidth;
        var viewportWidth = Math.max(18, mapWidth * ratioVisible);

        var maxScroll = totalWidth - visibleWidth;
        var maxViewportLeft = mapWidth - viewportWidth;

        var viewportLeft = maxScroll > 0
            ? (scrollLeft / maxScroll) * maxViewportLeft
            : 0;

        viewport.style.width = viewportWidth + "px";
        viewport.style.left = viewportLeft + "px";
    }

    function refreshMiniMap() {
        renderColumns();
        updateMiniMap();
    }

    a.addEventListener("scroll", updateMiniMap);

    window.addEventListener("resize", function() {
        refreshMiniMap();
    });

    setTimeout(refreshMiniMap, 100);
    setTimeout(refreshMiniMap, 500);
    setTimeout(refreshMiniMap, 1000);

    if (window.ResizeObserver) {
        var observer = new ResizeObserver(function() {
            refreshMiniMap();
        });

        observer.observe(a);

        if (a.parentElement) {
            observer.observe(a.parentElement);
        }
    }

    refreshMiniMap();

    var draggingMiniMap = false;
    var miniStartX = 0;
    var miniStartLeft = 0;

    viewport.addEventListener("mousedown", function(e) {
        draggingMiniMap = true;
        miniStartX = e.clientX;
        miniStartLeft = parseFloat(viewport.style.left) || 0;
        viewport.style.cursor = "move";

        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener("mousemove", function(e) {
        if (!draggingMiniMap) return;

        var delta = e.clientX - miniStartX;

        var mapWidth = wrapper.clientWidth;
        var viewportWidth = viewport.offsetWidth;
        var maxLeft = mapWidth - viewportWidth;

        var newLeft = Math.max(0, Math.min(maxLeft, miniStartLeft + delta));

        var totalWidth = a.scrollWidth;
        var visibleWidth = a.clientWidth;
        var maxScroll = totalWidth - visibleWidth;

        var ratio = maxLeft > 0 ? newLeft / maxLeft : 0;

        a.scrollLeft = maxScroll * ratio;

        updateMiniMap();
    });

    document.addEventListener("mouseup", function() {
        draggingMiniMap = false;
        viewport.style.cursor = "grab";
    });
}