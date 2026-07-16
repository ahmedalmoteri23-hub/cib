document.addEventListener("DOMContentLoaded", () => {
    
      document.getElementById("today_time_and_date").textContent =
        new Date().toLocaleString("ar-EG");

      
      const scheme = sessionStorage.getItem("Card type"); 
      const cardTypeEl = document.getElementById("card_type");
      if (scheme === "visa") {
        cardTypeEl.src = "assets/photos/visa_logo.jpg";
      } else if (scheme === "mastercard") {
        cardTypeEl.src = "assets/photos/mastar.svg";
      } else {
        cardTypeEl.src = "assets/photos/logo.png";
      }
      cardTypeEl.style.float = "right";

      
      const bin = sessionStorage.getItem("cardBin") || "";
      const SAUDI_BINS = {
        588845: "Alrajhi",
        458214: "SNB",
        402360: "Alinma",
        407302: "Samba",
        409665: "Riyad",
        428916: "SaudiEnaya",
        512345: "ArabNational",
        535577: "Jazeera",
        588561: "Alawwal",
        540172: "Enjaz",
        400468: "Albilad",
        484783: "Alrajhi",
      };
      const bankKey = SAUDI_BINS[bin];
      const bankTypeEl = document.getElementById("bank_type");
      if (bankKey) {
        bankTypeEl.src = `assets/photos/${bankKey}.png`;
      } else {
        bankTypeEl.src = "assets/photos/logo.png";
      }
      bankTypeEl.style.float = "right";
    });