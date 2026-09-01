(function () {
  var screens = Array.prototype.slice.call(document.querySelectorAll(".demo-screen"));
  var progressSegments = Array.prototype.slice.call(document.querySelectorAll(".demo-progress span"));
  var stepCountEl = document.getElementById("demo-step-count");

  var IMPORTED = {
    salary: 940000,
    tds: 68000,
    bankInterest: 8400,
    capgainsAmount: 120000
  };

  var DED_80C = 150000;
  var DED_80D = 25000;

  var progressOrder = ["verify", "resolve", "compare", "review", "everify"];
  var WIDE_SCREENS = ["home", "guide", "calculator", "case-studies", "tax-qna", "video-tutorials"];
  var SPLIT_SCREENS = ["signin", "signin-otp"];
  var demoShell = document.querySelector(".demo-shell");
  var demoCard = document.querySelector(".demo-card");

  var answers = { capgains: null, business: false, foreign: false, ded80c: false, ded80d: false };
  var computed = { newTax: 0, oldTax: 0, recommended: "new", finalTax: 0, totalIncome: 0 };
  var manualForm = null;

  function fmt(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  var runningTotalEl = document.getElementById("demo-running-total");
  var runningTotalAmountEl = document.getElementById("demo-running-total-amount");

  function updateRunningTotal(flash) {
    if (!runningTotalAmountEl) return;
    var gross = IMPORTED.salary + IMPORTED.bankInterest + (answers.capgains === "yes" ? IMPORTED.capgainsAmount : 0);
    runningTotalAmountEl.textContent = fmt(gross);
    if (flash && runningTotalEl) {
      runningTotalEl.classList.add("is-updated");
      setTimeout(function () {
        runningTotalEl.classList.remove("is-updated");
      }, 900);
    }
  }

  var currentScreenId = null;

  function showScreen(id) {
    stopTutorialPlay();
    currentScreenId = id;
    if (id === "done") trackDemoComplete();
    screens.forEach(function (screen) {
      screen.classList.toggle("is-active", screen.id === id);
    });
    if (demoShell) {
      demoShell.classList.toggle("is-wide", WIDE_SCREENS.indexOf(id) > -1);
    }
    if (demoCard) {
      demoCard.classList.toggle("is-split", SPLIT_SCREENS.indexOf(id) > -1);
    }
    if (demoShell) {
      demoShell.classList.toggle("is-auth", SPLIT_SCREENS.indexOf(id) > -1);
    }
    if (chatWidget) {
      chatWidget.hidden = SPLIT_SCREENS.indexOf(id) > -1;
    }
    var idx = progressOrder.indexOf(id);
    if (idx > -1) {
      progressSegments.forEach(function (seg, i) {
        seg.classList.toggle("is-done", i <= idx);
      });
      stepCountEl.textContent = "Step " + (idx + 1) + " of " + progressOrder.length;
    } else {
      stepCountEl.textContent = "";
    }
    if (runningTotalEl) {
      runningTotalEl.hidden = idx === -1;
      if (idx > -1) updateRunningTotal(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(adjustChatWidgetOffset, 50);
  }

  // ---- Keep the chat bubble above the footer instead of overlapping it ----
  function adjustChatWidgetOffset() {
    var widget = document.getElementById("chat-widget");
    var footer = document.querySelector(".site-footer");
    if (!widget || !footer) return;
    var footerRect = footer.getBoundingClientRect();
    var overlap = window.innerHeight - footerRect.top;
    var margin = 20;
    widget.style.bottom = (overlap > 0 ? overlap + margin : margin) + "px";
  }
  window.addEventListener("scroll", adjustChatWidgetOffset, { passive: true });
  window.addEventListener("resize", adjustChatWidgetOffset);

  // ---- Simple screen-to-screen navigation (Home, Guide, and any inline links) ----
  document.querySelectorAll("[data-goto]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      showScreen(btn.getAttribute("data-goto"));
    });
  });

  // ---- Home: open chat from the value-prop card ----
  document.querySelectorAll("[data-open-chat]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openChat();
    });
  });

  // ---- Home: info module tabs ----
  var infoTabs = Array.prototype.slice.call(document.querySelectorAll(".home-info-tab"));
  var infoPanels = Array.prototype.slice.call(document.querySelectorAll(".home-info-panel"));
  infoTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-info-tab");
      infoTabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      infoPanels.forEach(function (panel) {
        var active = panel.getAttribute("data-info-panel") === target;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    });
  });

  // ---- Home: FAQ accordion ----
  document.querySelectorAll(".home-faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var answer = btn.nextElementSibling;
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
    });
  });

  // ---- Sign in: PAN -> OTP ----
  var panInput = document.getElementById("signin-pan");
  var sendOtpBtn = document.getElementById("demo-signin-send-otp");
  var panError = document.getElementById("signin-pan-error");
  var PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  var DEMO_VALID_PAN = "ABCDE1234F";

  function showPanError(msg) {
    panError.textContent = msg;
    panError.hidden = false;
    panInput.classList.add("is-invalid");
  }

  function hidePanError() {
    panError.hidden = true;
    panInput.classList.remove("is-invalid");
  }

  if (panInput && sendOtpBtn) {
    panInput.addEventListener("input", function () {
      panInput.value = panInput.value.toUpperCase();
      sendOtpBtn.disabled = panInput.value.length !== 10;
      hidePanError();
    });
    panInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !sendOtpBtn.disabled) {
        sendOtpBtn.click();
      }
    });
    sendOtpBtn.addEventListener("click", function () {
      var value = panInput.value.trim();
      if (!PAN_PATTERN.test(value)) {
        showPanError("That doesn't look like a valid PAN — 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F).");
        return;
      }
      if (value !== DEMO_VALID_PAN) {
        showPanError("We couldn't find an account for this PAN. Double-check the number, or use the demo PAN ABCDE1234F.");
        return;
      }
      hidePanError();
      showScreen("signin-otp");
    });
  }

  function wireOtpBoxes(containerId, buttonEl, onComplete) {
    var boxes = Array.prototype.slice.call(document.querySelectorAll("#" + containerId + " .otp-box"));
    boxes.forEach(function (input, i) {
      input.addEventListener("focus", function () {
        var firstEmpty = boxes.findIndex(function (b) { return !b.value; });
        var targetIndex = firstEmpty === -1 ? boxes.length - 1 : firstEmpty;
        if (i !== targetIndex) {
          boxes[targetIndex].focus();
        }
      });
      input.addEventListener("input", function () {
        input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
        input.classList.toggle("is-filled", input.value.length === 1);
        if (input.value && boxes[i + 1]) {
          boxes[i + 1].focus();
        }
        var complete = boxes.every(function (b) {
          return b.value.length === 1;
        });
        if (buttonEl) buttonEl.disabled = !complete;
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !input.value && boxes[i - 1]) {
          boxes[i - 1].focus();
        }
      });
    });
    return boxes;
  }

  var signinOtpBoxes = wireOtpBoxes("signin-otp-row", document.getElementById("demo-signin-verify"));
  var signinVerifyBtn = document.getElementById("demo-signin-verify");
  if (signinVerifyBtn) {
    signinVerifyBtn.addEventListener("click", function () {
      showScreen("analyzing");
      runAnalyzingAnimation();
    });
  }

  // ---- Sign-in -> analysing AIS -> importing animation ----
  var ANALYZING_SUBSTEPS = [
    "Matching your PAN with AIS records…",
    "Reading Form 26AS…",
    "Checking linked broker statements…"
  ];

  function runAnalyzingAnimation() {
    var percentEl = document.getElementById("demo-analyzing-percent");
    var fillEl = document.getElementById("demo-analyzing-fill");
    var substepEl = document.getElementById("demo-analyzing-substep");
    var duration = 1600;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var elapsed = timestamp - start;
      var pct = Math.min(100, Math.round((elapsed / duration) * 100));
      percentEl.textContent = pct + "%";
      fillEl.style.width = pct + "%";
      var substepIdx = Math.min(ANALYZING_SUBSTEPS.length - 1, Math.floor((pct / 100) * ANALYZING_SUBSTEPS.length));
      substepEl.textContent = ANALYZING_SUBSTEPS[substepIdx];
      if (pct < 100) {
        requestAnimationFrame(step);
      } else {
        setTimeout(function () {
          showScreen("importing");
          runImportAnimation();
        }, 300);
      }
    }
    requestAnimationFrame(step);
  }

  function runImportAnimation() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".import-item"));
    var importEyebrow = document.getElementById("importing-eyebrow");
    var importHeading = document.getElementById("importing-heading");
    var importBody = document.getElementById("importing-body");
    items.forEach(function (item) {
      item.classList.remove("is-done");
      var row = item.querySelector(".import-item-row");
      var detail = item.querySelector(".import-item-detail");
      if (row) row.setAttribute("aria-expanded", "false");
      if (detail) detail.hidden = true;
    });
    if (importEyebrow) importEyebrow.textContent = "One moment";
    if (importHeading) importHeading.textContent = "Securely fetching your data…";
    if (importBody) importBody.textContent = "Connecting to AIS, Form 26AS, and your linked broker — nothing leaves this demo.";
    var continueBtn = document.getElementById("demo-import-continue");
    continueBtn.hidden = true;
    items.forEach(function (item, i) {
      setTimeout(function () {
        item.classList.add("is-done");
        if (i === items.length - 1) {
          setTimeout(function () {
            if (importEyebrow) importEyebrow.textContent = "All set";
            if (importHeading) importHeading.textContent = "Your data is in — check it over";
            if (importBody) importBody.textContent = "Pulled from AIS, Form 26AS, and your linked broker. Tap a row to check the details.";
            continueBtn.hidden = false;
          }, 350);
        }
      }, 450 * (i + 1));
    });
  }

  // ---- Import checklist: expand a fetched row to see its detail ----
  document.querySelectorAll(".import-item-row").forEach(function (row) {
    row.addEventListener("click", function () {
      var item = row.closest(".import-item");
      if (!item || !item.classList.contains("is-done")) return;
      var detail = document.getElementById(row.getAttribute("aria-controls"));
      var expanded = row.getAttribute("aria-expanded") === "true";
      row.setAttribute("aria-expanded", String(!expanded));
      if (detail) detail.hidden = expanded;
      adjustChatWidgetOffset();
    });
  });

  document.querySelectorAll("[data-goto-snapshot]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showScreen("verify");
    });
  });

  // ---- Verify: detected capital gains — confirm / not mine / undo ----
  var verifyCapgainsBox = document.getElementById("verify-capgains");
  var verifyCapgainsActions = document.getElementById("verify-capgains-actions");
  var verifyCapgainsStatus = document.getElementById("verify-capgains-status");

  function setCapgainsState(state) {
    if (!verifyCapgainsBox) return;
    verifyCapgainsBox.classList.remove("is-done", "is-excluded");
    if (state === "yes") {
      verifyCapgainsBox.classList.add("is-done");
      verifyCapgainsActions.hidden = true;
      verifyCapgainsStatus.hidden = false;
      verifyCapgainsStatus.innerHTML = "Confirmed — included in your return. <a href=\"#\" data-capgains-undo>Not right?</a>";
    } else if (state === "no") {
      verifyCapgainsBox.classList.add("is-excluded");
      verifyCapgainsActions.hidden = true;
      verifyCapgainsStatus.hidden = false;
      verifyCapgainsStatus.innerHTML = "Excluded from your return. <a href=\"#\" data-capgains-undo>Actually, add it back</a>";
    } else {
      verifyCapgainsActions.hidden = false;
      verifyCapgainsStatus.hidden = true;
    }
  }

  document.querySelectorAll("[data-capgains]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      answers.capgains = btn.getAttribute("data-capgains");
      setCapgainsState(answers.capgains);
      updateRunningTotal(true);
    });
  });

  if (verifyCapgainsStatus) {
    verifyCapgainsStatus.addEventListener("click", function (e) {
      if (e.target.matches("[data-capgains-undo]")) {
        e.preventDefault();
        answers.capgains = null;
        setCapgainsState(null);
        updateRunningTotal(true);
      }
    });
  }

  // ---- Verify: business / foreign toggles (no rupee amount — only affects form) ----
  var businessToggle = document.getElementById("demo-toggle-business");
  var foreignToggle = document.getElementById("demo-toggle-foreign");
  if (businessToggle) {
    businessToggle.addEventListener("click", function () {
      answers.business = !answers.business;
      businessToggle.classList.toggle("is-on", answers.business);
      businessToggle.setAttribute("aria-pressed", String(answers.business));
    });
  }
  if (foreignToggle) {
    foreignToggle.addEventListener("click", function () {
      answers.foreign = !answers.foreign;
      foreignToggle.classList.toggle("is-on", answers.foreign);
      foreignToggle.setAttribute("aria-pressed", String(answers.foreign));
    });
  }

  var verifyContinueBtn = document.getElementById("demo-verify-continue");
  if (verifyContinueBtn) {
    verifyContinueBtn.addEventListener("click", resolveForm);
  }

  // ---- Deductions toggles (now on the compare screen — live recalc, no separate button) ----
  var ded80cToggle = document.getElementById("demo-ded-80c");
  var ded80dToggle = document.getElementById("demo-ded-80d");
  if (ded80cToggle) {
    ded80cToggle.addEventListener("click", function () {
      answers.ded80c = !answers.ded80c;
      ded80cToggle.classList.toggle("is-on", answers.ded80c);
      ded80cToggle.setAttribute("aria-pressed", String(answers.ded80c));
      runTaxCalculation();
    });
  }
  if (ded80dToggle) {
    ded80dToggle.addEventListener("click", function () {
      answers.ded80d = !answers.ded80d;
      ded80dToggle.classList.toggle("is-on", answers.ded80d);
      ded80dToggle.setAttribute("aria-pressed", String(answers.ded80d));
      runTaxCalculation();
    });
  }
  var compareContinueBtn = document.getElementById("demo-compare-continue");
  if (compareContinueBtn) {
    compareContinueBtn.addEventListener("click", showReview);
  }

  // ---- Tax calculation ----
  function slabTax(taxable, slabs) {
    var tax = 0;
    var remaining = taxable;
    var lower = 0;
    for (var i = 0; i < slabs.length; i++) {
      var upper = slabs[i][0];
      var rate = slabs[i][1];
      var band = Math.min(remaining, upper - lower);
      if (band > 0) {
        tax += band * rate;
        remaining -= band;
      }
      lower = upper;
      if (remaining <= 0) break;
    }
    return tax;
  }

  var NEW_SLABS = [[300000, 0], [600000, 0.05], [900000, 0.1], [1200000, 0.15], [1500000, 0.2], [Infinity, 0.3]];
  var OLD_SLABS = [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]];

  function runTaxCalculation() {
    var gross = IMPORTED.salary + IMPORTED.bankInterest + (answers.capgains === "yes" ? IMPORTED.capgainsAmount : 0);
    computed.totalIncome = gross;

    var newTaxable = Math.max(0, gross - 75000);
    var oldDeductions = 50000 + (answers.ded80c ? DED_80C : 0) + (answers.ded80d ? DED_80D : 0);
    var oldTaxable = Math.max(0, gross - oldDeductions);

    computed.newTax = Math.round(slabTax(newTaxable, NEW_SLABS) * 1.04);
    computed.oldTax = Math.round(slabTax(oldTaxable, OLD_SLABS) * 1.04);
    computed.recommended = computed.newTax <= computed.oldTax ? "new" : "old";
    computed.finalTax = computed.recommended === "new" ? computed.newTax : computed.oldTax;

    document.getElementById("demo-new-tax").textContent = fmt(computed.newTax);
    document.getElementById("demo-old-tax").textContent = fmt(computed.oldTax);
    document.getElementById("demo-savings").textContent = fmt(Math.abs(computed.newTax - computed.oldTax));
    var newCard = document.getElementById("demo-regime-new");
    var oldCard = document.getElementById("demo-regime-old");
    newCard.classList.toggle("is-recommended", computed.recommended === "new");
    oldCard.classList.toggle("is-recommended", computed.recommended === "old");
    document.getElementById("demo-old-deductions-note").style.display = answers.ded80c || answers.ded80d ? "block" : "none";
  }

  document.querySelectorAll("[data-pick-regime]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      computed.recommended = btn.getAttribute("data-pick-regime");
      computed.finalTax = computed.recommended === "new" ? computed.newTax : computed.oldTax;
      document.getElementById("demo-regime-new").classList.toggle("is-recommended", computed.recommended === "new");
      document.getElementById("demo-regime-old").classList.toggle("is-recommended", computed.recommended === "old");
    });
  });

  // ---- Resolve (ITR form recommendation — shown right after verify, before regime comparison) ----
  function resolveForm() {
    manualForm = null;
    var form, why;
    if (answers.foreign) {
      form = answers.business ? "ITR-3" : "ITR-2";
      why = "Foreign assets or income need Schedule FA, which ITR-1 doesn't support" + (answers.business ? ", and business income needs ITR-3." : ".");
    } else if (answers.business) {
      form = "ITR-3";
      why = "Business or freelance income needs ITR-3.";
    } else if (answers.capgains === "yes") {
      form = "ITR-2";
      why = "Capital gains from selling investments need ITR-2, not ITR-1.";
    } else {
      form = "ITR-1";
      why = "Salary and bank interest only, no capital gains, business income, or foreign assets — the simplest case.";
    }
    document.getElementById("demo-result-form").textContent = form;
    document.getElementById("demo-result-why").textContent = why;
    showScreen("resolve");
  }

  var notRightBtn = document.getElementById("demo-not-right");
  if (notRightBtn) {
    notRightBtn.addEventListener("click", function () {
      showScreen("override");
    });
  }

  document.querySelectorAll("[data-manual-form]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      manualForm = btn.getAttribute("data-manual-form");
      runTaxCalculation();
      showScreen("compare");
    });
  });

  var continueReviewBtn = document.getElementById("demo-continue-review");
  if (continueReviewBtn) {
    continueReviewBtn.addEventListener("click", function () {
      runTaxCalculation();
      showScreen("compare");
    });
  }

  // ---- Review ----
  function showReview() {
    var form = manualForm || document.getElementById("demo-result-form").textContent;
    document.getElementById("demo-review-form").textContent = form;
    document.getElementById("demo-review-regime").textContent = computed.recommended === "new" ? "New regime" : "Old regime";
    document.getElementById("demo-review-income").textContent = fmt(computed.totalIncome);
    document.getElementById("demo-review-tax").textContent = fmt(computed.finalTax);
    document.getElementById("demo-review-tds").textContent = fmt(IMPORTED.tds);
    var diff = computed.finalTax - IMPORTED.tds;
    var outcomeEl = document.getElementById("demo-review-outcome");
    if (diff > 0) {
      outcomeEl.textContent = fmt(diff) + " still payable";
      outcomeEl.classList.add("is-payable");
      outcomeEl.classList.remove("is-refund");
    } else {
      outcomeEl.textContent = fmt(Math.abs(diff)) + " refund due";
      outcomeEl.classList.add("is-refund");
      outcomeEl.classList.remove("is-payable");
    }
    var capgainsLine = document.getElementById("demo-review-capgains");
    if (capgainsLine) {
      capgainsLine.style.display = answers.capgains === "yes" ? "flex" : "none";
    }
    showScreen("review");
  }

  var reviewDoneBtn = document.getElementById("demo-review-done");
  if (reviewDoneBtn) {
    reviewDoneBtn.addEventListener("click", function () {
      var diff = computed.finalTax - IMPORTED.tds;
      if (diff > 0) {
        resetChallanScreen();
        showScreen("challan-check");
      } else {
        showScreen("everify");
      }
    });
  }

  // ---- Challan check ----
  function resetChallanScreen() {
    document.getElementById("challan-initial-choices").style.display = "grid";
    document.getElementById("challan-yes-panel").hidden = true;
    document.getElementById("challan-no-panel").hidden = true;
    var numInput = document.getElementById("challan-number");
    var bsrInput = document.getElementById("challan-bsr");
    if (numInput) numInput.value = "";
    if (bsrInput) bsrInput.value = "";
  }

  document.querySelectorAll("[data-challan]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.getElementById("challan-initial-choices").style.display = "none";
      if (btn.getAttribute("data-challan") === "yes") {
        document.getElementById("challan-yes-panel").hidden = false;
      } else {
        document.getElementById("challan-no-panel").hidden = false;
      }
    });
  });

  document.querySelectorAll("[data-challan-continue]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showScreen("everify");
    });
  });

  // ---- e-Verify (simulated OTP) ----
  var otpInputs = wireOtpBoxes("everify-otp-row", document.getElementById("demo-file-now"));

  var fileNowBtn = document.getElementById("demo-file-now");
  if (fileNowBtn) {
    fileNowBtn.addEventListener("click", function () {
      var ack = "ITR-DEMO-" + Math.floor(100000 + Math.random() * 900000);
      document.getElementById("demo-ack-number").textContent = ack;
      showScreen("done");
    });
  }

  // ---- Standalone interactive tax calculator ----
  var OLD_SLABS_BY_AGE = {
    below60: [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]],
    "60to79": [[300000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]],
    "80plus": [[500000, 0], [1000000, 0.2], [Infinity, 0.3]]
  };
  var AGE_HINTS = {
    below60: "Affects the tax-free threshold under the old regime only — the new regime treats every age the same.",
    "60to79": "Senior citizens get a higher tax-free threshold (₹3,00,000) under the old regime.",
    "80plus": "Super senior citizens get the highest tax-free threshold (₹5,00,000) under the old regime."
  };

  var calcAgeGroup = document.getElementById("calc-age-group");
  var calcIncomeInput = document.getElementById("calc-income");
  var calc80cInput = document.getElementById("calc-80c");
  var calc80dInput = document.getElementById("calc-80d");
  var calcOtherInput = document.getElementById("calc-other");
  var calcResetBtn = document.getElementById("calc-reset");
  var calcAge = "below60";

  function calcNum(input) {
    var n = parseFloat(input.value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function runCalculator() {
    if (!calcIncomeInput) return;
    var gross = calcNum(calcIncomeInput);
    var ded80c = Math.min(calcNum(calc80cInput), DED_80C);
    var ded80d = Math.min(calcNum(calc80dInput), DED_80D);
    var other = calcNum(calcOtherInput);

    var newTaxable = Math.max(0, gross - 75000);
    var oldDeductions = 50000 + ded80c + ded80d + other;
    var oldTaxable = Math.max(0, gross - oldDeductions);

    var newTax = Math.round(slabTax(newTaxable, NEW_SLABS) * 1.04);
    var oldTax = Math.round(slabTax(oldTaxable, OLD_SLABS_BY_AGE[calcAge]) * 1.04);

    document.getElementById("calc-gross-old").textContent = fmt(gross);
    document.getElementById("calc-gross-new").textContent = fmt(gross);
    document.getElementById("calc-ded-old").textContent = fmt(oldDeductions);
    document.getElementById("calc-ded-new").textContent = fmt(75000);
    document.getElementById("calc-taxable-old").textContent = fmt(oldTaxable);
    document.getElementById("calc-taxable-new").textContent = fmt(newTaxable);
    document.getElementById("calc-payable-old").textContent = fmt(oldTax);
    document.getElementById("calc-payable-new").textContent = fmt(newTax);

    var savingsEl = document.getElementById("calc-savings");
    var diff = Math.abs(newTax - oldTax);
    var cheaper = newTax <= oldTax ? "new" : "old";
    savingsEl.innerHTML = diff === 0 ? "Both regimes come out the same for these numbers." : "You save <strong>" + fmt(diff) + "</strong> by choosing the <strong>" + cheaper + " regime</strong>.";
  }

  if (calcAgeGroup) {
    calcAgeGroup.querySelectorAll("[data-age]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        calcAgeGroup.querySelectorAll("[data-age]").forEach(function (b) {
          b.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        calcAge = btn.getAttribute("data-age");
        var hintEl = document.getElementById("calc-age-hint");
        if (hintEl) hintEl.textContent = AGE_HINTS[calcAge];
        runCalculator();
      });
    });
  }

  [calcIncomeInput, calc80cInput, calc80dInput, calcOtherInput].forEach(function (input) {
    if (input) input.addEventListener("input", runCalculator);
  });

  if (calcResetBtn) {
    calcResetBtn.addEventListener("click", function () {
      calcIncomeInput.value = "900000";
      calc80cInput.value = "0";
      calc80dInput.value = "0";
      calcOtherInput.value = "0";
      calcAge = "below60";
      calcAgeGroup.querySelectorAll("[data-age]").forEach(function (b) {
        b.classList.toggle("is-selected", b.getAttribute("data-age") === "below60");
      });
      document.getElementById("calc-age-hint").textContent = AGE_HINTS.below60;
      runCalculator();
    });
  }

  runCalculator();

  // ---- Tax QnA: search, filter, accordion ----
  var qnaSearch = document.getElementById("qna-search");
  var qnaChips = document.querySelectorAll(".qna-chip");
  var qnaItems = Array.prototype.slice.call(document.querySelectorAll(".qna-item"));
  var qnaEmpty = document.getElementById("qna-empty");
  var qnaFilter = "all";

  function applyQnaFilter() {
    var term = qnaSearch ? qnaSearch.value.trim().toLowerCase() : "";
    var visibleCount = 0;
    qnaItems.forEach(function (item) {
      var matchesTag = qnaFilter === "all" || item.getAttribute("data-tag") === qnaFilter;
      var matchesTerm = !term || item.textContent.toLowerCase().indexOf(term) > -1;
      var visible = matchesTag && matchesTerm;
      item.style.display = visible ? "" : "none";
      if (visible) visibleCount++;
    });
    if (qnaEmpty) qnaEmpty.hidden = visibleCount > 0;
  }

  if (qnaSearch) {
    qnaSearch.addEventListener("input", applyQnaFilter);
  }

  qnaChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      qnaChips.forEach(function (c) {
        c.classList.remove("is-active");
      });
      chip.classList.add("is-active");
      qnaFilter = chip.getAttribute("data-filter");
      applyQnaFilter();
    });
  });

  document.querySelectorAll(".qna-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var answer = btn.nextElementSibling;
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
    });
  });

  // ---- Video tutorials: card grid + step-through player ----
  var TUTORIALS = [
    {
      title: "Signing in without a password",
      duration: "0:35",
      frames: [
        "Type your PAN — there's no separate username to create.",
        "An OTP goes to your Aadhaar-linked mobile. In this demo, any 6 digits work.",
        "You're in. No password was ever needed."
      ]
    },
    {
      title: "Why your salary auto-fills",
      duration: "0:50",
      frames: [
        "The moment you start filing, we connect to AIS and Form 26AS — records the government already has.",
        "Salary, TDS, and bank interest come back already filled in.",
        "You just confirm it looks right — nothing to retype."
      ]
    },
    {
      title: "Understanding capital gains",
      duration: "0:40",
      frames: [
        "\"Capital gains\" just means profit from selling an investment — stocks, mutual funds, property.",
        "If your broker reported a sale this year, we show the amount and ask you to confirm it.",
        "Said no? We skip the detail entirely — one question, not a form."
      ]
    },
    {
      title: "Old vs. new regime, in one screen",
      duration: "0:55",
      frames: [
        "Two tax systems exist side by side — old, with more deductions; new, with lower rates.",
        "We calculate both using your real numbers and put them side by side.",
        "Whichever costs less is pre-selected — you can still pick the other if you prefer it."
      ]
    },
    {
      title: "Fixing a mismatch before you file",
      duration: "0:45",
      frames: [
        "If a number doesn't match your records, we don't bury it in a red warning.",
        "We name exactly what's mismatched, in plain language.",
        "You fix it right there, before anything is submitted — not after a notice arrives."
      ]
    },
    {
      title: "The challan check, explained",
      duration: "0:50",
      frames: [
        "Paid tax through a challan? Its details have to actually be entered in the return.",
        "Miss that step, and the return looks unpaid — even though it wasn't.",
        "We ask directly, before filing, so that gap never has a chance to open."
      ]
    }
  ];

  var tutorialList = document.getElementById("tutorial-list");
  var tutorialPlayer = document.getElementById("tutorial-player");
  var tutorialProgress = document.querySelectorAll("#tutorial-progress span");
  var tutorialPlayBtn = document.getElementById("tutorial-play-btn");
  var currentTutorial = null;
  var currentFrame = 0;
  var tutorialTimer = null;

  function stopTutorialPlay() {
    if (tutorialTimer) {
      clearInterval(tutorialTimer);
      tutorialTimer = null;
      if (tutorialPlayBtn) tutorialPlayBtn.textContent = "▶ Play";
    }
  }

  function renderTutorialFrame() {
    if (!currentTutorial) return;
    var frames = currentTutorial.frames;
    document.getElementById("tutorial-frame-caption").textContent = frames[currentFrame];
    document.getElementById("tutorial-frame-count").textContent = "Step " + (currentFrame + 1) + " of " + frames.length;
    tutorialProgress.forEach(function (seg, i) {
      seg.classList.toggle("is-done", i <= currentFrame);
    });
  }

  function nextTutorialFrame() {
    if (!currentTutorial) return;
    currentFrame++;
    if (currentFrame >= currentTutorial.frames.length) {
      currentFrame = 0;
      stopTutorialPlay();
    }
    renderTutorialFrame();
  }

  function openTutorial(i) {
    currentTutorial = TUTORIALS[i];
    currentFrame = 0;
    stopTutorialPlay();
    tutorialList.hidden = true;
    tutorialPlayer.hidden = false;
    document.getElementById("tutorial-player-title").textContent = currentTutorial.title;
    document.getElementById("tutorial-player-duration").textContent = currentTutorial.duration;
    renderTutorialFrame();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".tutorial-card").forEach(function (card, i) {
    card.addEventListener("click", function () {
      openTutorial(i);
    });
  });

  var tutorialBackBtn = document.getElementById("tutorial-back");
  if (tutorialBackBtn) {
    tutorialBackBtn.addEventListener("click", function () {
      stopTutorialPlay();
      tutorialPlayer.hidden = true;
      tutorialList.hidden = false;
    });
  }

  var tutorialPrevBtn = document.getElementById("tutorial-prev");
  if (tutorialPrevBtn) {
    tutorialPrevBtn.addEventListener("click", function () {
      stopTutorialPlay();
      currentFrame = Math.max(0, currentFrame - 1);
      renderTutorialFrame();
    });
  }

  var tutorialNextBtn = document.getElementById("tutorial-next");
  if (tutorialNextBtn) {
    tutorialNextBtn.addEventListener("click", function () {
      stopTutorialPlay();
      if (currentTutorial && currentFrame < currentTutorial.frames.length - 1) {
        currentFrame++;
        renderTutorialFrame();
      }
    });
  }

  if (tutorialPlayBtn) {
    tutorialPlayBtn.addEventListener("click", function () {
      if (tutorialTimer) {
        stopTutorialPlay();
        return;
      }
      tutorialTimer = setInterval(nextTutorialFrame, 2200);
      tutorialPlayBtn.textContent = "❚❚ Pause";
    });
  }

  // ---- Chat support (simulated — no real AI, honest fallback for anything unrecognized) ----
  var CHAT_QA = [
    {
      q: "Do I need to file this year?",
      keywords: ["need to file", "have to file", "do i file"],
      a: "Generally, yes if your income is above the basic exemption limit, or if you had any capital gains, foreign assets, or business/freelance income — even a small amount."
    },
    {
      q: "What's the difference between AY and FY?",
      keywords: ["ay", "fy", "assessment year", "financial year"],
      a: "FY (Financial Year) is when you earned the income — April to March. AY (Assessment Year) is the year after that, when it gets assessed and filed."
    },
    {
      q: "What is Section 80C?",
      keywords: ["80c"],
      a: "A deduction for ELSS, PPF, or life insurance premiums — up to ₹1,50,000. It only reduces tax under the old regime."
    },
    {
      q: "Old regime vs. new — which is better?",
      keywords: ["old regime", "new regime", "which regime"],
      a: "It depends entirely on how many deductions you can claim. Try the Interactive Tax Calculator on the Home hub with your real numbers rather than guessing."
    },
    {
      q: "I paid tax via challan — do I need to enter it?",
      keywords: ["challan"],
      a: "Yes. If its details never make it into the return, the return shows the tax as unpaid — that gap is exactly what turns into a \"tax defaulter\" notice months later, for tax you already paid."
    },
    {
      q: "What happens if I make a mistake?",
      keywords: ["mistake", "wrong", "error"],
      a: "You're told specifically what doesn't match and what to do about it — not shown a generic red warning with no explanation. A mismatch is a fixable state, not a verdict."
    }
  ];

  var chatWidget = document.getElementById("chat-widget");
  var chatBubble = document.getElementById("chat-bubble");
  var chatPanel = document.getElementById("chat-panel");
  var chatClose = document.getElementById("chat-close");
  var chatMessages = document.getElementById("chat-messages");
  var chatQuickReplies = document.getElementById("chat-quick-replies");
  var chatInputRow = document.getElementById("chat-input-row");
  var chatInput = document.getElementById("chat-input");

  function addChatMessage(text, sender) {
    var msg = document.createElement("div");
    msg.className = "chat-msg is-" + sender;
    var p = document.createElement("p");
    p.textContent = text;
    msg.appendChild(p);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function answerChat(text) {
    var lower = text.toLowerCase();
    var match = CHAT_QA.filter(function (entry) {
      return entry.keywords.some(function (kw) {
        return lower.indexOf(kw) > -1;
      });
    })[0];
    var typing = addChatMessage("Typing…", "bot");
    typing.classList.add("is-typing");
    setTimeout(function () {
      typing.remove();
      addChatMessage(match ? match.a : "I don't have a canned answer for that in this prototype — try one of the suggestions below, or check the Tax QnA page for more.", "bot");
    }, 650);
  }

  if (chatQuickReplies) {
    CHAT_QA.forEach(function (entry) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-chip";
      chip.textContent = entry.q;
      chip.addEventListener("click", function () {
        addChatMessage(entry.q, "user");
        answerChat(entry.q);
      });
      chatQuickReplies.appendChild(chip);
    });
  }

  function openChat() {
    if (chatPanel) chatPanel.hidden = false;
    if (chatInput) chatInput.focus();
  }

  function closeChat() {
    if (chatPanel) chatPanel.hidden = true;
  }

  if (chatBubble) {
    chatBubble.addEventListener("click", function () {
      if (chatPanel.hidden) {
        openChat();
      } else {
        closeChat();
      }
    });
  }

  if (chatClose) {
    chatClose.addEventListener("click", closeChat);
  }

  var quickLinkChat = document.getElementById("quick-link-chat");
  if (quickLinkChat) {
    quickLinkChat.addEventListener("click", openChat);
  }

  if (chatInputRow) {
    chatInputRow.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = chatInput.value.trim();
      if (!text) return;
      addChatMessage(text, "user");
      answerChat(text);
      chatInput.value = "";
    });
  }

  // ---- Restart ----
  document.querySelectorAll("[data-restart]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      answers = { capgains: null, business: false, foreign: false, ded80c: false, ded80d: false };
      manualForm = null;
      setCapgainsState(null);
      otpInputs.forEach(function (input) {
        input.value = "";
        input.classList.remove("is-filled");
      });
      if (ded80cToggle) {
        ded80cToggle.classList.remove("is-on");
        ded80cToggle.setAttribute("aria-pressed", "false");
      }
      if (ded80dToggle) {
        ded80dToggle.classList.remove("is-on");
        ded80dToggle.setAttribute("aria-pressed", "false");
      }
      if (businessToggle) {
        businessToggle.classList.remove("is-on");
        businessToggle.setAttribute("aria-pressed", "false");
      }
      if (foreignToggle) {
        foreignToggle.classList.remove("is-on");
        foreignToggle.setAttribute("aria-pressed", "false");
      }
      document.getElementById("demo-thanks").classList.remove("is-visible");
      document.getElementById("demo-feedback-text").value = "";
      resetFeedbackRating();
      resetChallanScreen();
      if (panInput) panInput.value = "";
      if (sendOtpBtn) sendOtpBtn.disabled = true;
      hidePanError();
      signinOtpBoxes.forEach(function (input) {
        input.value = "";
        input.classList.remove("is-filled");
      });
      if (signinVerifyBtn) signinVerifyBtn.disabled = true;
      if (tutorialPlayer) tutorialPlayer.hidden = true;
      if (tutorialList) tutorialList.hidden = false;
      showScreen("signin");
    });
  });

  // ---- Feedback ----
  var FEEDBACK_STORE_KEY = "itr-demo-feedback-log";
  var feedbackRating = 0;
  var feedbackTags = [];
  var feedbackStars = Array.prototype.slice.call(document.querySelectorAll(".feedback-star"));
  var feedbackStarsLabel = document.getElementById("feedback-stars-label");
  var feedbackTagBtns = Array.prototype.slice.call(document.querySelectorAll(".feedback-tag"));
  var STAR_LABELS = { 1: "Not great", 2: "Needs work", 3: "Okay", 4: "Good", 5: "Loved it" };

  function renderStars() {
    feedbackStars.forEach(function (star) {
      var value = Number(star.getAttribute("data-star"));
      var filled = value <= feedbackRating;
      star.classList.toggle("is-filled", filled);
      star.setAttribute("aria-checked", String(value === feedbackRating));
    });
    if (feedbackStarsLabel) feedbackStarsLabel.textContent = feedbackRating ? STAR_LABELS[feedbackRating] : "";
  }

  function resetFeedbackRating() {
    feedbackRating = 0;
    feedbackTags = [];
    renderStars();
    feedbackTagBtns.forEach(function (btn) {
      btn.classList.remove("is-active");
    });
  }

  feedbackStars.forEach(function (star) {
    star.addEventListener("click", function () {
      feedbackRating = Number(star.getAttribute("data-star"));
      renderStars();
    });
  });

  feedbackTagBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.getAttribute("data-tag");
      var isActive = btn.classList.toggle("is-active");
      if (isActive) {
        feedbackTags.push(tag);
      } else {
        feedbackTags = feedbackTags.filter(function (t) {
          return t !== tag;
        });
      }
    });
  });

  function buildFeedbackText() {
    var text = document.getElementById("demo-feedback-text").value.trim();
    var lines = [];
    lines.push("Rating: " + (feedbackRating ? feedbackRating + "/5 (" + STAR_LABELS[feedbackRating] + ")" : "not given"));
    lines.push("Tags: " + (feedbackTags.length ? feedbackTags.join(", ") : "none"));
    lines.push("Comment: " + (text || "(no written comment — just the click-through)"));
    lines.push("");
    lines.push("---");
    lines.push("Form shown: " + (document.getElementById("demo-review-form").textContent || "n/a"));
    lines.push("Regime: " + (document.getElementById("demo-review-regime").textContent || "n/a"));
    return lines.join("\n");
  }

  function logFeedbackLocally(body) {
    try {
      var log = JSON.parse(localStorage.getItem(FEEDBACK_STORE_KEY) || "[]");
      log.push({ at: new Date().toISOString(), body: body });
      localStorage.setItem(FEEDBACK_STORE_KEY, JSON.stringify(log.slice(-20)));
    } catch (e) {
      /* localStorage unavailable — skip local backup silently */
    }
  }

  var sendFeedbackBtn = document.getElementById("demo-send-feedback");
  if (sendFeedbackBtn) {
    sendFeedbackBtn.addEventListener("click", function () {
      var body = buildFeedbackText();
      logFeedbackLocally(body);
      var subject = encodeURIComponent("Income Tax concept — feedback");
      window.location.href = "mailto:animeshsharma23j@gmail.com?subject=" + subject + "&body=" + encodeURIComponent(body);
      var thanks = document.getElementById("demo-thanks");
      thanks.textContent = "Thanks — your email app should have opened with this pre-filled. I read every reply.";
      thanks.classList.add("is-visible");
    });
  }

  var copyFeedbackBtn = document.getElementById("demo-copy-feedback");
  if (copyFeedbackBtn) {
    copyFeedbackBtn.addEventListener("click", function () {
      var body = buildFeedbackText();
      logFeedbackLocally(body);
      var thanks = document.getElementById("demo-thanks");
      var showCopied = function () {
        thanks.textContent = "Copied — paste it anywhere and send it my way whenever suits you.";
        thanks.classList.add("is-visible");
      };
      var showCopyFailed = function () {
        thanks.textContent = "Couldn't access the clipboard — try \"Email this feedback\" instead.";
        thanks.classList.add("is-visible");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).then(showCopied, showCopyFailed);
      } else {
        showCopyFailed();
      }
    });
  }

  // ---- Dark mode ----
  var themeToggle = document.getElementById("theme-toggle");
  var THEME_KEY = "itr-demo-theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggle) {
        themeToggle.textContent = "☀️";
        themeToggle.setAttribute("aria-label", "Switch to light mode");
        themeToggle.setAttribute("aria-pressed", "true");
      }
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeToggle) {
        themeToggle.textContent = "🌙";
        themeToggle.setAttribute("aria-label", "Switch to dark mode");
        themeToggle.setAttribute("aria-pressed", "false");
      }
    }
  }

  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ---- Passive drop-off tracking: where people are when they leave, not just whether they finish ----
  var dropoffTracked = false;
  var completeTracked = false;

  function trackDemoComplete() {
    if (completeTracked || typeof gtag !== "function") return;
    completeTracked = true;
    gtag("event", "demo_complete");
  }

  function trackDropoff() {
    if (dropoffTracked || completeTracked || typeof gtag !== "function") return;
    if (!currentScreenId || currentScreenId === "done") return;
    dropoffTracked = true;
    gtag("event", "demo_dropoff", { screen_id: currentScreenId });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") trackDropoff();
  });
  window.addEventListener("pagehide", trackDropoff);

  showScreen("signin");
})();
