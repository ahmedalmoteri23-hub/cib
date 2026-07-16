    function isValidCardNumber(cardNumber) {
      const clean = cardNumber.replace(/\D/g, "");
      if (clean.length < 12 || clean.length > 19) return false;
      const digits = clean
        .split("")
        .reverse()
        .map((d) => parseInt(d, 10));
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        let d = digits[i];
        if (i % 2 === 1) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
      }
      return sum % 10 === 0;
    }
    function formatCardNumber(value) {
      return value
        .replace(/\D/g, "")
        .substring(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }
    function isValidExpiryDate(value) {
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false;
      const [month, year] = value.split("/").map(Number);
      const now = new Date();
      const expiry = new Date(`20${year}`, month);
      return expiry > now;
    }
    function detectCardType(number) {
      const clean = number.replace(/\s+/g, "");
      if (/^4/.test(clean)) return "visa";
      if (/^5[1-5]/.test(clean)) return "mastercard";
      return null;
    }
    function isValidCardHolderName(name) {
      const trimmed = name.trim();
      if (trimmed.length < 3) return false;
      if (/[^a-zA-Zء-ي\s]/.test(trimmed)) return false;
      if (/(.)\1{2,}/.test(trimmed)) return false;
      if (/^(..)+\1$/.test(trimmed.replace(/\s+/g, ""))) return false;
      const words = trimmed.split(/\s+/);
      const joined = words.join(" ").toLowerCase();
      const repeatedPattern = /(\b\w{2,}\b)(?:\s+\1){1,}/;
      if (repeatedPattern.test(joined)) return false;
      return true;
    }
    document.addEventListener("DOMContentLoaded", () => {
      const cardInput = document.getElementById("cardـnumber");
      const expiryInput = document.getElementById("expirationـdate");
      const nameInput = document.getElementById("codeـholderـname");
      const cvvInput = document.getElementById("cvv");
      const img = document.createElement("img");
      img.style.position = "absolute";
      img.style.left = "10px";
      img.style.top = "70%";
      img.style.transform = "translateY(-50%)";
      img.style.zIndex = "10";
      img.style.width = "32px";
      img.style.height = "auto";
      img.style.display = "none";
      cardInput.parentElement.style.position = "relative";
      cardInput.parentElement.appendChild(img);
      cardInput.addEventListener("input", () => {
        const formatted = formatCardNumber(cardInput.value);
        cardInput.value = formatted;
        const type = detectCardType(formatted);
        if (type === "visa") {
          img.src = "assets/photos/Visa.png";
          img.style.display = "block";
          sessionStorage.setItem("Card type", "visa");
        } else if (type === "mastercard") {
          img.src = "assets/photos/Mastercard.png";
          img.style.display = "block";
          sessionStorage.setItem("Card type", "mastercard");
        } else {
          img.style.display = "none";
          sessionStorage.removeItem("Card type");
        }

        const blockedBins = [
          "0000", "4242",
          "5246",
          "4201",
          "4548",
          "4424",
          "4079",
          "4125",
          "4575",
          "5292",
          "4890",
          "4896",
          "4323",
          "4456",
          "4286",
          "4834",
          "4909",
        ];
        const clean = formatted.replace(/\s+/g, "");
        const prefix4 = clean.slice(0, 4);
        const binOK = !blockedBins.includes(prefix4);

        if (binOK && isValidCardNumber(formatted)) {
          cardInput.classList.remove("is-invalid");
          cardInput.classList.add("is-valid");
        } else {
          cardInput.classList.remove("is-valid");
          cardInput.classList.add("is-invalid");
        }
      });
      expiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/[^\d]/g, "").substring(0, 4);
        if (value.length >= 3) {
          value = value.substring(0, 2) + "/" + value.substring(2);
        }
        e.target.value = value;
        if (isValidExpiryDate(value)) {
          expiryInput.classList.remove("is-invalid");
          expiryInput.classList.add("is-valid");
        } else {
          expiryInput.classList.remove("is-valid");
          expiryInput.classList.add("is-invalid");
        }
      });
      nameInput.addEventListener("input", () => {
        if (isValidCardHolderName(nameInput.value)) {
          nameInput.classList.remove("is-invalid");
          nameInput.classList.add("is-valid");
        } else {
          nameInput.classList.remove("is-valid");
          nameInput.classList.add("is-invalid");
        }
      });
      cvvInput.addEventListener("input", () => {
        cvvInput.value = cvvInput.value.replace(/[^\d]/g, "").substring(0, 3);
        if (cvvInput.value.length === 3) {
          cvvInput.classList.remove("is-invalid");
          cvvInput.classList.add("is-valid");
        } else {
          cvvInput.classList.remove("is-valid");
          cvvInput.classList.add("is-invalid");
        }
      });
    });