
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});


document.addEventListener("keydown", function (e) {

   
    if (e.key === "F12") {
        e.preventDefault();
        return false;
    }

   
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
    }

   
    if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
    }

    
    if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
    }

    
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return false;
    }

   
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return false;
    }
});


(function () {
    function detectDevTools() {
        
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

        let threshold = 160;
        if (
            window.outerWidth - window.innerWidth > threshold ||
            window.outerHeight - window.innerHeight > threshold
        ) {
            document.body.innerHTML = "";
            window.location.href = "about:blank";
        }
    }

    setInterval(detectDevTools, 1000);
})();


document.addEventListener("selectstart", function (e) {
    e.preventDefault();
});


document.addEventListener("dragstart", function (e) {
    e.preventDefault();
});