using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.Services.Apartments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Owner)]
public class OwnerListingsController(
    IApartmentService apartments,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "My Listings";
        var ownerId = currentUser.UserId!.Value;
        var listings = await apartments.GetMineAsync(ownerId, ct);
        ViewBag.Listings = listings;
        return View();
    }

    public async Task<IActionResult> New(CancellationToken ct)
    {
        ViewData["Title"] = "New Listing";
        var ownerId = currentUser.UserId!.Value;
        ViewBag.RequiresListingFee = await apartments.RequiresListingFeeAsync(ownerId, ct);
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([FromBody] CreateApartmentRequest req, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var created = await apartments.CreateAsync(ownerId, req, ct);
        return Json(new { id = created.Id });
    }

    [Route("OwnerListings/Edit/{id}")]
    public async Task<IActionResult> Edit(Guid id, CancellationToken ct)
    {
        ViewData["Title"] = "Edit Listing";
        ViewData["ApartmentId"] = id;
        var apt = await apartments.GetByIdAsync(id, ct);
        ViewBag.Apartment = apt;
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
        await apartments.DeleteAsync(id, ownerId, ct);
        TempData["Success"] = "Listing deleted.";
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

    [HttpGet("OwnerListings/RequiresListingFee")]
    public async Task<IActionResult> RequiresListingFee(CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        var required = await apartments.RequiresListingFeeAsync(ownerId, ct);
        return Json(new { required, amount = required ? 10m : 0m });
    }
}
