using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Testimonials;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/testimonials")]
public sealed class TestimonialsController(IAppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("approved")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TestimonialDto>>> GetApproved(CancellationToken ct)
    {
        var items = await db.Testimonials
            .AsNoTracking()
            .Include(t => t.User)
            .Where(t => t.IsApproved)
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new TestimonialDto(
                t.Id, t.User.FullName,
                t.User.Role.ToString(),
                t.Stars, t.Text, t.IsApproved, t.CreatedAt))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("all")]
    [Authorize(Policy = AuthPolicies.Admin)]
    public async Task<ActionResult<IReadOnlyList<TestimonialDto>>> GetAll(CancellationToken ct)
    {
        var items = await db.Testimonials
            .AsNoTracking()
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TestimonialDto(
                t.Id, t.User.FullName,
                t.User.Role.ToString(),
                t.Stars, t.Text, t.IsApproved, t.CreatedAt))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TestimonialDto>> Create(
        [FromBody] CreateTestimonialRequest req, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        if (string.IsNullOrWhiteSpace(req.Text) || req.Text.Length < 10 || req.Text.Length > 500)
            throw new BadRequestException("Testimonial must be 10–500 characters.");
        if (req.Stars < 1 || req.Stars > 5)
            throw new BadRequestException("Stars must be between 1 and 5.");

        var existing = await db.Testimonials
            .AnyAsync(t => t.UserId == userId, ct);
        if (existing)
            throw new ConflictException("You have already submitted a testimonial.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        var testimonial = new Testimonial
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Text = req.Text.Trim(),
            Stars = req.Stars,
            IsApproved = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.Testimonials.Add(testimonial);
        await db.SaveChangesAsync(ct);

        return Ok(new TestimonialDto(
            testimonial.Id, user.FullName, user.Role.ToString(),
            testimonial.Stars, testimonial.Text,
            testimonial.IsApproved, testimonial.CreatedAt));
    }

    [HttpPut("{id:guid}/approve")]
    [Authorize(Policy = AuthPolicies.Admin)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var t = await db.Testimonials.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Testimonial not found.");
        t.IsApproved = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var t = await db.Testimonials.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Testimonial not found.");
        db.Testimonials.Remove(t);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
