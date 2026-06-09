using Dorm.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Dorm.Domain.Entities;

namespace Dorm.API.Controllers;

[Authorize]
public class PhoneVerificationController(
    UserManager<User> userManager,
    ICurrentUser currentUser) : Controller
{
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SendOtp(CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(currentUser.UserId!.Value.ToString());
        if (user is null) return NotFound();

        if (string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            TempData["PhoneError"] = "Please add a phone number to your profile first.";
            return RedirectToAction("Index", "Profile");
        }

        var otp = new Random().Next(100000, 999999).ToString();
        user.PhoneOtp = otp;
        user.PhoneOtpExpiry = DateTime.UtcNow.AddMinutes(10);
        user.IsPhoneVerified = false;
        await userManager.UpdateAsync(user);

        // Mock: in production this would be sent via SMS gateway (e.g. Twilio)
        TempData["PhoneOtpSent"] = "true";
        TempData["MockOtp"] = otp; // shown on screen in dev mode
        return RedirectToAction("Index", "Profile");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> VerifyOtp(string otp)
    {
        var user = await userManager.FindByIdAsync(currentUser.UserId!.Value.ToString());
        if (user is null) return NotFound();

        if (string.IsNullOrWhiteSpace(otp) ||
            user.PhoneOtp != otp.Trim() ||
            user.PhoneOtpExpiry < DateTime.UtcNow)
        {
            TempData["PhoneError"] = "Invalid or expired code. Please request a new one.";
            return RedirectToAction("Index", "Profile");
        }

        user.IsPhoneVerified = true;
        user.PhoneOtp = null;
        user.PhoneOtpExpiry = null;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            TempData["PhoneError"] = "Failed to save verification. Please try again.";
            return RedirectToAction("Index", "Profile");
        }

        TempData["Success"] = "Phone number verified successfully!";
        return RedirectToAction("Index", "Profile");
    }
}
