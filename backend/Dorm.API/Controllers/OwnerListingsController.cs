using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.DTOs.Payments;
using Dorm.Application.Services.Apartments;
using Dorm.Application.Services.Payments;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Owner)]
public class OwnerListingsController(
    IApartmentService apartments,
    IPaymentsAppService payments,
    IAppDbContext db,
    ICurrentUser currentUser,
    UserManager<User> userManager) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "My Listings";
        var ownerId = currentUser.UserId!.Value;
        var owner = await userManager.FindByIdAsync(ownerId.ToString());
        var listings = await apartments.GetMineAsync(ownerId, ct);
        ViewBag.Listings = listings;
        ViewBag.IdMissing = string.IsNullOrEmpty(owner?.IdDocumentUrl);
        ViewBag.IdPending = !string.IsNullOrEmpty(owner?.IdDocumentUrl) && !(owner?.IsIdVerified ?? false);
        return View();
    }

    public async Task<IActionResult> New(CancellationToken ct)
    {
        ViewData["Title"] = "New Listing";
        var ownerId = currentUser.UserId!.Value;
        var owner = await userManager.FindByIdAsync(ownerId.ToString());
        if (owner is null || string.IsNullOrEmpty(owner.IdDocumentUrl))
        {
            TempData["Error"] = "You must upload an identity document on your Profile page before posting a listing.";
            return RedirectToAction("Index", "Profile");
        }
        ViewBag.RequiresListingFee = await apartments.RequiresListingFeeAsync(ownerId, ct);
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([FromBody] CreateApartmentRequest req, CancellationToken ct)
    {
        try
        {
            var ownerId = currentUser.UserId!.Value;
            var owner = await userManager.FindByIdAsync(ownerId.ToString());
            if (owner is null || string.IsNullOrEmpty(owner.IdDocumentUrl))
                return BadRequest(new { error = new { code = "id_required", message = "Please upload an identity document on your profile before posting a listing." } });
            var created = await apartments.CreateAsync(ownerId, req, ct);
            return Json(new { id = created.Id });
        }
        catch (FluentValidation.ValidationException vex)
        {
            var msgs = string.Join(" ", vex.Errors.Select(e => e.ErrorMessage));
            return BadRequest(new { error = new { code = "validation_failed", message = msgs } });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = new { code = "error", message = ex.Message } });
        }
    }

    [Route("OwnerListings/Edit/{id}")]
    public async Task<IActionResult> Edit(Guid id, CancellationToken ct)
    {
        ViewData["Title"] = "Edit Listing";
        ViewData["ApartmentId"] = id;
        try
        {
            var apt = await apartments.GetByIdAsync(id, ct);
            // Only the owner can edit — if they somehow reach another owner's listing, reject
            if (apt.Owner?.Id.ToString() != currentUser.UserId?.ToString())
                return Forbid();

            ViewBag.Apartment = apt;

            var tenants = await db.Tenancies.AsNoTracking()
                .Where(t => t.ApartmentId == id && t.Status == TenancyStatus.Active)
                .Select(t => new { t.Id, t.Student.FullName, t.Student.University, t.StartDate })
                .ToListAsync(ct);
            ViewBag.ActiveTenants = tenants;
        }
        catch (Application.Common.Exceptions.NotFoundException)
        {
            return NotFound();
        }
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateApartmentRequest req, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var updated = await apartments.UpdateAsync(id, ownerId, req, ct);
        return Json(new { id = updated.Id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        try
        {
            await apartments.DeleteAsync(id, ownerId, ct);
            TempData["Success"] = "Listing deleted successfully.";
        }
        catch (Exception ex)
        {
            TempData["Error"] = ex.Message;
        }
        return RedirectToAction("Index");
    }

    [HttpPost("OwnerListings/{id}/Photos")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile file, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        await using var stream = file.OpenReadStream();
        var photo = await apartments.UploadPhotoAsync(id, ownerId, stream, file.FileName, file.ContentType, ct);
        return Json(photo);
    }

    [HttpPost("OwnerListings/{id}/Photos/{photoId}/Delete")]
    public async Task<IActionResult> DeletePhoto(Guid id, Guid photoId, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        await apartments.DeletePhotoAsync(id, photoId, ownerId, ct);
        return Json(new { success = true });
    }

    [HttpPost("OwnerListings/PayListingFee")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> PayListingFee(CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var result = await payments.CheckoutAsync(ownerId, new CheckoutRequest(PaymentType.ListingFee, null), ct);

        if (!string.IsNullOrEmpty(result.CheckoutUrl))
            return Json(new { paid = false, redirectUrl = result.CheckoutUrl });

        return Json(new { paid = true });
    }

    [HttpPost("OwnerListings/{apartmentId}/EndTenancy/{tenancyId}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EndTenancy(Guid apartmentId, Guid tenancyId, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var apartment = await db.Apartments.FirstOrDefaultAsync(a => a.Id == apartmentId && a.OwnerId == ownerId, ct)
            ?? throw new NotFoundException("Apartment not found.");
        var tenancy = await db.Tenancies.FirstOrDefaultAsync(t => t.Id == tenancyId && t.ApartmentId == apartmentId && t.Status == TenancyStatus.Active, ct)
            ?? throw new NotFoundException("Active tenancy not found.");

        tenancy.Status = TenancyStatus.Ended;
        tenancy.EndDate = DateTime.UtcNow;
        apartment.AvailableSpots += 1;
        await db.SaveChangesAsync(ct);

        TempData["Success"] = "Tenancy ended. Spot freed up.";
        return Redirect($"/OwnerListings/Edit/{apartmentId}");
    }

    [HttpGet("OwnerListings/RequiresListingFee")]
    public async Task<IActionResult> RequiresListingFee(CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var required = await apartments.RequiresListingFeeAsync(ownerId, ct);
        return Json(new { required, amount = required ? 10m : 0m });
    }
}
