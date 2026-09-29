(function () {
  "use strict";

  function showStatus(form, message, type) {
    var status = form.querySelector("[data-auth-status]");
    if (!status) return;
    status.textContent = message;
    status.className = "status visible " + type;
    status.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function route(url, delay) {
    window.setTimeout(function () { window.location.href = url; }, delay || 0);
  }

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("form[data-auth-action]");
    if (!form) return;
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var action = form.getAttribute("data-auth-action");

    if (action === "sign-in") {
      showStatus(form, "Signed in successfully. Opening the dashboard…", "success");
      route("3.dashboard.html", 650);
      return;
    }

    if (action === "sign-up") {
      showStatus(form, "Your demo account has been created. Continue to email verification.", "success");
      form.querySelector("button[type=submit]").textContent = "Account created";
      route("1.3.verify-email.html", 850);
      return;
    }

    if (action === "forgot-password") {
      showStatus(form, "If an account matches this address, a password reset link has been sent.", "success");
      return;
    }

    if (action === "reset-password") {
      var password = form.querySelector("[name=password]").value;
      var confirmation = form.querySelector("[name=confirmPassword]").value;
      if (password !== confirmation) {
        showStatus(form, "The passwords do not match.", "error");
        return;
      }
      showStatus(form, "Your password has been updated. You can now sign in.", "success");
      return;
    }

    if (action === "mfa") {
      var code = form.querySelector("[name=code]").value;
      if (!/^\d{6}$/.test(code)) {
        showStatus(form, "Enter a valid six-digit authentication code.", "error");
        return;
      }
      if (code === "000000") {
        showStatus(form, "That authentication code is not valid. Try another six-digit code.", "error");
        return;
      }
      showStatus(form, "Authentication successful. Opening the dashboard…", "success");
      route("3.dashboard.html", 650);
    }
  });

  document.addEventListener("click", function (event) {
    var resend = event.target.closest("[data-resend-verification]");
    if (resend) {
      event.preventDefault();
      var status = document.querySelector("[data-page-status]");
      status.textContent = "A new verification email has been sent.";
      status.className = "status visible success";
      status.setAttribute("role", "status");
      return;
    }

    var invitation = event.target.closest("[data-invitation-action]");
    if (invitation) {
      event.preventDefault();
      var invitationStatus = document.querySelector("[data-page-status]");
      if (invitation.getAttribute("data-invitation-action") === "accept") {
        invitationStatus.textContent = "Invitation accepted. Opening account setup…";
        invitationStatus.className = "status visible success";
        route("13.onboarding.html", 650);
      } else {
        invitationStatus.textContent = "Invitation declined. No changes were made to your account.";
        invitationStatus.className = "status visible success";
      }
    }
  });
})();
