function(instance, properties) {
    var elementId = properties.element_id;
    var hideScrollbar = properties.hide_scrollbar;
    var a = document.querySelector("#" + elementId), c = false, d, e;

    if (!a) {
        console.error("Elemento com ID " + elementId + " não encontrado.");
        return;
    }
    
    
    // Controla a visibilidade da scrollbar
if (hideScrollbar) {
    
        var testeScrollElement = document.getElementById(elementId);
    
    if (testeScrollElement) {
        var style = document.createElement('style');
        style.innerHTML = `
            #${elementId}.RepeatingGroup::-webkit-scrollbar {
                height: auto;
                display: none;
            }
            #${elementId}.RepeatingGroup::-webkit-scrollbar-thumb {
                border-radius: 10px;
                -webkit-box-shadow: inset 0 0 12px rgba(0,0,0,0.0);
            }
        `;
        document.head.appendChild(style);
    }
    }
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log("mobile");
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            document.querySelectorAll('.RepeatingGroup').forEach(el => {
                $(el).dragNscroll();
            });
        });
    }

    a.addEventListener("mousedown", function(b) {
        c = true;
        a.classList.add("active");
        d = b.pageX - a.offsetLeft;
        e = a.scrollLeft;
        a.style.cursor = "grabbing";
        document.body.style.userSelect = "none"; // Evita seleção de texto
    });

    a.addEventListener("mouseleave", function() {
        c = false;
        a.classList.remove("active");
        a.style.cursor = "grab";
        document.body.style.userSelect = "auto";
    });

    a.addEventListener("mouseup", function() {
        c = false;
        a.classList.remove("active");
        a.style.cursor = "grab";
        document.body.style.userSelect = "auto";
    });

    a.addEventListener("mousemove", function(b) {
        if (c) {
            b.preventDefault();
            var movement = 1 * (b.pageX - a.offsetLeft - d);
            a.scrollLeft = e - movement;
            a.style.cursor = "grabbing";
        }
    });
    
}
